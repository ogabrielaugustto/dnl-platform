"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  hasMissingProfileLegalFieldsError,
  validateClientLegalProfile,
} from "@/lib/client-legal-profile";
import { requireManageableOrganization } from "@/lib/dal/settings";
import { requirePanelAccess } from "@/lib/auth";
import { hasMissingProfileSignatureFieldsError } from "@/lib/profile-signature";
import { createSignatureRecord, parseSignaturePayloadJson } from "@/lib/signature";
import { createClient } from "@/lib/server";

type FieldErrors = Record<string, string[] | undefined>;

export type SettingsActionState = {
  status?: "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
};

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Use ate 120 caracteres para o nome."),
  cpf: z.string().trim(),
  signerRole: z.string().trim(),
  signingCity: z.string().trim(),
  avatarUrl: z
    .string()
    .trim()
    .max(500, "Use uma URL de avatar menor.")
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value.length === 0 || z.url().safeParse(value).success,
      "Informe uma URL valida para o avatar.",
    ),
});

const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da organizacao.")
    .max(120, "Use ate 120 caracteres para o nome."),
  document: z
    .string()
    .trim()
    .max(32, "Use ate 32 caracteres para o documento.")
    .optional(),
  billingEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      "Informe um e-mail financeiro valido.",
    ),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      "Informe um e-mail principal valido.",
    ),
  contactPhone: z
    .string()
    .trim()
    .max(32, "Use ate 32 caracteres para o telefone.")
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value.length === 0 || /^[0-9()+\-\s]+$/.test(value),
      "Informe um telefone valido.",
    ),
  websiteUrl: z
    .string()
    .trim()
    .max(500, "Use uma URL menor para o site.")
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value.length === 0 || z.url().safeParse(normalizeUrl(value)).success,
      "Informe uma URL valida para o site.",
    ),
  instagramHandle: z
    .string()
    .trim()
    .max(40, "Use ate 40 caracteres para o Instagram.")
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value.length === 0 || /^[A-Za-z0-9._@]+$/.test(value),
      "Use apenas letras, numeros, ponto e underline no Instagram.",
    ),
});

function normalizeOptionalValue(value: string) {
  return value.trim().length > 0 ? value.trim() : null;
}

function normalizeInstagramHandle(value: string) {
  const normalized = value.trim().replace(/^@+/, "");
  return normalized.length > 0 ? normalized : null;
}

function normalizeUrl(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return normalized;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

function buildValidationErrorState(error: z.ZodError): SettingsActionState {
  return {
    status: "error",
    message: "Revise os campos destacados e tente novamente.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function parseSignatureFromFormData(formData: FormData) {
  const signaturePayload = parseSignaturePayloadJson(formData.get("signaturePayload"));
  return createSignatureRecord(signaturePayload);
}

function parseOptionalSignatureFromFormData(formData: FormData) {
  const rawPayload = formData.get("signaturePayload");

  if (typeof rawPayload !== "string" || rawPayload.trim().length === 0) {
    return null;
  }

  const signaturePayload = parseSignaturePayloadJson(rawPayload);
  return createSignatureRecord(signaturePayload);
}

function hasMissingOrganizationFieldsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42703" ||
    combinedMessage.includes("contact_email") ||
    combinedMessage.includes("contact_phone") ||
    combinedMessage.includes("website_url") ||
    combinedMessage.includes("instagram_handle")
  );
}

export async function updateProfileSettingsAction(
  _: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    signerRole: formData.get("signerRole"),
    signingCity: formData.get("signingCity"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return buildValidationErrorState(parsed.error);
  }

  const legalProfile = validateClientLegalProfile({
    fullName: parsed.data.fullName,
    cpf: parsed.data.cpf,
    signerRole: parsed.data.signerRole,
    signingCity: parsed.data.signingCity,
  });

  if (!legalProfile.ok) {
    return {
      status: "error",
      message: legalProfile.message,
      fieldErrors: {
        cpf: [legalProfile.message],
      },
    };
  }

  const signatureResult = parseOptionalSignatureFromFormData(formData);

  if (signatureResult && !signatureResult.ok) {
    return {
      status: "error",
      message: signatureResult.message,
      fieldErrors: {
        signature: [signatureResult.message],
      },
    };
  }

  const context = await requirePanelAccess("client");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: legalProfile.profile.fullName,
      cpf: legalProfile.profile.cpf,
      signer_role: legalProfile.profile.signerRole,
      signing_city: legalProfile.profile.signingCity,
      avatar_url: normalizeOptionalValue(parsed.data.avatarUrl),
      signature_mode: signatureResult?.ok ? signatureResult.record.mode : null,
      signature_payload: signatureResult?.ok ? signatureResult.record.payload : null,
      signature_signed_name: signatureResult?.ok ? signatureResult.record.signedName : null,
      signature_svg: signatureResult?.ok ? signatureResult.record.svg : null,
      signature_updated_at: signatureResult?.ok ? new Date().toISOString() : null,
    })
    .eq("id", context.userId);

  if (error) {
    if (
      hasMissingProfileSignatureFieldsError(error) ||
      hasMissingProfileLegalFieldsError(error)
    ) {
      return {
        status: "error",
        message:
          "Os novos campos do perfil ainda nao podem ser salvos porque a migration do banco nao foi aplicada no Supabase.",
      };
    }

    return {
      status: "error",
      message: "Nao foi possivel atualizar o perfil agora.",
    };
  }

  refresh();

  return {
    status: "success",
    message: "Perfil atualizado com sucesso.",
  };
}

export async function saveClientSignatureAction(
  _: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const signatureResult = parseSignatureFromFormData(formData);

  if (!signatureResult.ok) {
    return {
      status: "error",
      message: signatureResult.message,
      fieldErrors: {
        signature: [signatureResult.message],
      },
    };
  }

  const context = await requirePanelAccess("client");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      signature_mode: signatureResult.record.mode,
      signature_payload: signatureResult.record.payload,
      signature_signed_name: signatureResult.record.signedName,
      signature_svg: signatureResult.record.svg,
      signature_updated_at: new Date().toISOString(),
    })
    .eq("id", context.userId);

  if (error) {
    if (hasMissingProfileSignatureFieldsError(error)) {
      return {
        status: "error",
        message:
          "A assinatura ainda nao pode ser salva porque a migration do banco nao foi aplicada no Supabase.",
      };
    }

    return {
      status: "error",
      message: "Nao foi possivel salvar a assinatura agora.",
    };
  }

  refresh();

  return {
    status: "success",
    message: "Assinatura salva com sucesso.",
  };
}

export async function updateOrganizationSettingsAction(
  _: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    document: formData.get("document"),
    billingEmail: formData.get("billingEmail"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    websiteUrl: formData.get("websiteUrl"),
    instagramHandle: formData.get("instagramHandle"),
  });

  if (!parsed.success) {
    return buildValidationErrorState(parsed.error);
  }

  const { organizationId } = await requireManageableOrganization();
  const supabase = await createClient();
  const payload = {
    name: parsed.data.name,
    document: normalizeOptionalValue(parsed.data.document ?? ""),
    billing_email: normalizeOptionalValue(parsed.data.billingEmail),
    contact_email: normalizeOptionalValue(parsed.data.contactEmail),
    contact_phone: normalizeOptionalValue(parsed.data.contactPhone),
    website_url: normalizeOptionalValue(normalizeUrl(parsed.data.websiteUrl)),
    instagram_handle: normalizeInstagramHandle(parsed.data.instagramHandle),
  };

  const { error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", organizationId);

  if (error && hasMissingOrganizationFieldsError(error)) {
    const legacyUpdate = await supabase
      .from("organizations")
      .update({
        name: payload.name,
        document: payload.document,
        billing_email: payload.billing_email,
      })
      .eq("id", organizationId);

    if (legacyUpdate.error) {
      return {
        status: "error",
        message: "Nao foi possivel atualizar a organizacao agora.",
      };
    }

    refresh();

    return {
      status: "success",
      message:
        "Dados basicos atualizados. Para salvar site, telefone e Instagram, aplique a migration nova no dnl-worker.",
    };
  }

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel atualizar a organizacao agora.",
    };
  }

  refresh();

  return {
    status: "success",
    message: "Organizacao atualizada com sucesso.",
  };
}
