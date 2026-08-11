"use server";

import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import {
  hasMissingProfileLegalFieldsError,
  validateClientLegalProfile,
} from "@/lib/client-legal-profile";
import { requireActiveOrganization } from "@/lib/dal/assets";
import { normalizeProfileSignature } from "@/lib/profile-signature";
import {
  buildRightsOwnershipConfirmationDocument,
  RIGHTS_OWNERSHIP_CONFIRMATION_TEMPLATE_VERSION,
} from "@/lib/rights-ownership-confirmation";
import { createClient } from "@/lib/server";
import {
  createSignatureRecord,
  parseSignaturePayloadJson,
} from "@/lib/signature";
import { wakeWorkerForSiteIntelInvestigation } from "@/lib/worker";

const updateDetectionStatusSchema = z.object({
  detectionId: z.uuid(),
  nextStatus: z.enum([
    "pending",
    "possible_infringement",
    "authorized",
    "unauthorized",
    "takedown_sent",
    "resolved",
    "ignored",
  ]),
  scope: z.enum(["single", "incident"]).default("single"),
  reason: z.string().trim().max(120).optional(),
  redirectTo: z.string().trim().min(1),
});

const confirmUnauthorizedUseSchema = z.object({
  detectionId: z.uuid(),
  redirectTo: z.string().trim().min(1),
  scope: z.enum(["incident"]).default("incident"),
  fullName: z.string().trim(),
  cpf: z.string().trim(),
  signerRole: z.string().trim(),
  signingCity: z.string().trim(),
  confirmOwnership: z.literal(true, {
    message: "Confirme que voce revisou e concorda com a declaracao antes de continuar.",
  }),
  updateSignature: z.enum(["yes", "no"]).default("no"),
});

type FieldErrors = Record<string, string[] | undefined>;

export type DetectionDecisionActionState = {
  status?: "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
};

type DetectionActionRow = {
  id: string;
  case_public_id: number;
  asset_id: string;
  source_url: string;
  canonical_source_url: string;
  domain: string | null;
  status: string;
};

type DetectionWithAssetRow = DetectionActionRow & {
  public_id: number;
  assets:
    | {
        public_id: number;
        title: string;
      }
    | {
        public_id: number;
        title: string;
      }[]
    | null;
};

type ProfileLegalRow = {
  full_name: string | null;
  cpf: string | null;
  signer_role: string | null;
  signing_city: string | null;
  signature_mode: "draw" | "type" | null;
  signature_payload: unknown;
  signature_signed_name: string | null;
  signature_svg: string | null;
  signature_updated_at: string | null;
};

function parseNormalizedDomain(params: {
  domain: string | null;
  source_url: string;
  canonical_source_url: string;
}) {
  const candidates = [params.domain, params.source_url, params.canonical_source_url];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const host = candidate.includes("://") ? new URL(candidate).hostname : candidate;
      const normalized = host.trim().toLowerCase().replace(/^www\./, "");

      if (normalized) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  return "site-nao-identificado";
}

function getActionLabel(nextStatus: string) {
  switch (nextStatus) {
    case "possible_infringement":
      return "marcada_como_possivel_infracao";
    case "authorized":
      return "marcada_como_uso_autorizado";
    case "unauthorized":
      return "marcada_como_uso_nao_autorizado";
    case "takedown_sent":
      return "notificacao_enviada";
    case "resolved":
      return "marcada_como_resolvida";
    case "ignored":
      return "marcada_como_ignorada";
    default:
      return "status_atualizado";
  }
}

function buildActionState(message: string, fieldErrors?: FieldErrors): DetectionDecisionActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

function parseSignatureFromFormData(formData: FormData) {
  const signaturePayload = parseSignaturePayloadJson(formData.get("signaturePayload"));
  return createSignatureRecord(signaturePayload);
}

async function loadRepresentativeDetection(params: {
  detectionId: string;
  organizationId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, asset_id, source_url, canonical_source_url, domain, status, assets(public_id, title)",
    )
    .eq("organization_id", params.organizationId)
    .eq("id", params.detectionId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Ocorrencia nao encontrada para esta organizacao.");
  }

  return {
    ...(data as Omit<DetectionWithAssetRow, "assets">),
    assets: Array.isArray(data.assets) ? (data.assets[0] ?? null) : data.assets,
  } satisfies DetectionWithAssetRow;
}

async function loadIncidentDetections(params: {
  representative: DetectionActionRow;
  organizationId: string;
  scope: "single" | "incident";
}) {
  if (params.scope === "single") {
    return [params.representative];
  }

  const supabase = await createClient();
  const representativeDomain = parseNormalizedDomain(params.representative);
  const { data, error } = await supabase
    .from("detections")
    .select("id, case_public_id, asset_id, source_url, canonical_source_url, domain, status")
    .eq("organization_id", params.organizationId)
    .eq("asset_id", params.representative.asset_id)
    .is("archived_at", null);

  if (error) {
    throw new Error("Nao foi possivel carregar o grupo desta ocorrencia.");
  }

  return ((data ?? []) as DetectionActionRow[]).filter(
    (item) => parseNormalizedDomain(item) === representativeDomain,
  );
}

function revalidateDetectionViews(params: {
  representativeDetectionId: string;
  casePublicId: number;
}) {
  revalidatePath("/detections");
  revalidatePath("/cases");
  revalidatePath(`/cases/${params.casePublicId}`);
  revalidatePath(`/detections/${params.representativeDetectionId}`);
  revalidatePath("/gallery");
}

export async function updateDetectionStatusAction(formData: FormData) {
  const parsed = updateDetectionStatusSchema.safeParse({
    detectionId: formData.get("detectionId"),
    nextStatus: formData.get("nextStatus"),
    scope: formData.get("scope") ?? "single",
    reason: formData.get("reason") ?? undefined,
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    throw new Error("Nao foi possivel atualizar o status da ocorrencia.");
  }

  const { organizationId, userId } = await requireActiveOrganization();
  const representative = await loadRepresentativeDetection({
    detectionId: parsed.data.detectionId,
    organizationId,
  });
  const targetDetections = await loadIncidentDetections({
    representative,
    organizationId,
    scope: parsed.data.scope,
  });

  const detectionsToUpdate = targetDetections.filter(
    (item) => item.status !== parsed.data.nextStatus,
  );

  if (detectionsToUpdate.length === 0) {
    revalidateDetectionViews({
      representativeDetectionId: representative.id,
      casePublicId: representative.case_public_id,
    });
    return;
  }

  const reviewedAt = new Date().toISOString();
  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("detections")
    .update({
      status: parsed.data.nextStatus,
      reviewed_at: reviewedAt,
      reviewed_by_user_id: userId,
    })
    .eq("organization_id", organizationId)
    .in(
      "id",
      detectionsToUpdate.map((item) => item.id),
    );

  if (updateError) {
    throw new Error("Nao foi possivel salvar a avaliacao desta ocorrencia.");
  }

  const actionRows = detectionsToUpdate.map((item) => ({
    organization_id: organizationId,
    detection_id: item.id,
    user_id: userId,
    action: getActionLabel(parsed.data.nextStatus),
    from_status: item.status,
    to_status: parsed.data.nextStatus,
    metadata: {
      scope: parsed.data.scope,
      representativeDetectionId: representative.id,
      reason: parsed.data.reason ?? null,
    },
  }));

  const { error: actionError } = await supabase.from("detection_actions").insert(actionRows);

  if (actionError) {
    throw new Error("Nao foi possivel registrar o historico da ocorrencia.");
  }

  revalidateDetectionViews({
    representativeDetectionId: representative.id,
    casePublicId: representative.case_public_id,
  });
}

export async function confirmUnauthorizedUseAction(
  _: DetectionDecisionActionState,
  formData: FormData,
): Promise<DetectionDecisionActionState> {
  const parsed = confirmUnauthorizedUseSchema.safeParse({
    detectionId: formData.get("detectionId"),
    redirectTo: formData.get("redirectTo"),
    scope: formData.get("scope") ?? "incident",
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    signerRole: formData.get("signerRole"),
    signingCity: formData.get("signingCity"),
    confirmOwnership: formData.get("confirmOwnership") === "on",
    updateSignature: formData.get("updateSignature") ?? "no",
  });

  if (!parsed.success) {
    return buildActionState(
      parsed.error.issues[0]?.message ?? "Nao foi possivel confirmar o uso nao autorizado.",
    );
  }

  const legalProfile = validateClientLegalProfile({
    fullName: parsed.data.fullName,
    cpf: parsed.data.cpf,
    signerRole: parsed.data.signerRole,
    signingCity: parsed.data.signingCity,
  });

  if (!legalProfile.ok) {
    return buildActionState(legalProfile.message, {
      cpf: [legalProfile.message],
    });
  }

  const { organizationId, userId } = await requireActiveOrganization();
  const supabase = await createClient();
  const representative = await loadRepresentativeDetection({
    detectionId: parsed.data.detectionId,
    organizationId,
  });
  const targetDetections = await loadIncidentDetections({
    representative,
    organizationId,
    scope: parsed.data.scope,
  });
  const detectionsToUpdate = targetDetections.filter((item) => item.status !== "unauthorized");

  if (detectionsToUpdate.length === 0) {
    revalidateDetectionViews({
      representativeDetectionId: representative.id,
      casePublicId: representative.case_public_id,
    });
    return {
      status: "success",
      message: "Esta ocorrencia ja estava marcada como uso nao autorizado.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "full_name, cpf, signer_role, signing_city, signature_mode, signature_payload, signature_signed_name, signature_svg, signature_updated_at",
    )
    .eq("id", userId)
    .maybeSingle<ProfileLegalRow>();

  if (profileError || !profile) {
    if (hasMissingProfileLegalFieldsError(profileError)) {
      return buildActionState(
        "Os novos campos do perfil ainda nao estao disponiveis porque a migration do banco nao foi aplicada no Supabase.",
      );
    }

    return buildActionState("Nao foi possivel carregar o perfil da conta agora.");
  }

  const shouldUpdateSignature = parsed.data.updateSignature === "yes";
  const existingSignature = normalizeProfileSignature(profile);
  const signatureResult = shouldUpdateSignature ? parseSignatureFromFormData(formData) : null;

  if (signatureResult && !signatureResult.ok) {
    return buildActionState(signatureResult.message, {
      signature: [signatureResult.message],
    });
  }

  const signatureRecord =
    signatureResult?.ok
      ? signatureResult.record
      : existingSignature
        ? {
            mode: existingSignature.mode,
            payload: JSON.parse(existingSignature.payloadJson) as ProfileLegalRow["signature_payload"],
            signedName: existingSignature.signedName,
            svg: existingSignature.svg,
          }
        : null;

  if (!signatureRecord) {
    return buildActionState("Crie a assinatura antes de confirmar o uso nao autorizado.", {
      signature: ["Crie a assinatura antes de confirmar o uso nao autorizado."],
    });
  }

  const profileUpdatePayload = {
    full_name: legalProfile.profile.fullName,
    cpf: legalProfile.profile.cpf,
    signer_role: legalProfile.profile.signerRole,
    signing_city: legalProfile.profile.signingCity,
    ...(shouldUpdateSignature
      ? {
          signature_mode: signatureRecord.mode,
          signature_payload: signatureRecord.payload,
          signature_signed_name: signatureRecord.signedName,
          signature_svg: signatureRecord.svg,
          signature_updated_at: new Date().toISOString(),
        }
      : {}),
  };

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update(profileUpdatePayload)
    .eq("id", userId);

  if (updateProfileError) {
    if (hasMissingProfileLegalFieldsError(updateProfileError)) {
      return buildActionState(
        "Os novos campos do perfil ainda nao podem ser salvos porque a migration do banco nao foi aplicada no Supabase.",
      );
    }

    return buildActionState("Nao foi possivel atualizar o perfil do signatario agora.");
  }

  const reviewedAt = new Date().toISOString();
  const { error: updateDetectionError } = await supabase
    .from("detections")
    .update({
      status: "unauthorized",
      reviewed_at: reviewedAt,
      reviewed_by_user_id: userId,
    })
    .eq("organization_id", organizationId)
    .in(
      "id",
      detectionsToUpdate.map((item) => item.id),
    );

  if (updateDetectionError) {
    return buildActionState("Nao foi possivel salvar a avaliacao desta ocorrencia.");
  }

  const declarationDocument = buildRightsOwnershipConfirmationDocument({
    assetPublicIds: [representative.assets?.public_id ?? representative.public_id],
    signerFullName: legalProfile.profile.fullName,
    signerCpf: legalProfile.profile.cpf,
    signerRole: legalProfile.profile.signerRole,
    signingCity: legalProfile.profile.signingCity,
    statementDate: reviewedAt,
  });

  const { data: insertedDocument, error: documentError } = await supabase
    .from("rights_ownership_confirmations")
    .insert({
      organization_id: organizationId,
      detection_id: representative.id,
      user_id: userId,
      document_type: declarationDocument.documentType,
      asset_public_id: representative.assets?.public_id ?? representative.public_id,
      case_public_id: representative.case_public_id,
      signer_full_name: declarationDocument.signerFullName,
      signer_cpf: declarationDocument.signerCpf,
      signer_role: declarationDocument.signerRole,
      signing_city: declarationDocument.signingCity,
      statement_date: declarationDocument.statementDateIso.slice(0, 10),
      signature_mode: signatureRecord.mode,
      signature_payload: signatureRecord.payload,
      signature_svg: signatureRecord.svg,
      template_version: RIGHTS_OWNERSHIP_CONFIRMATION_TEMPLATE_VERSION,
      body_snapshot: declarationDocument.body,
      template_snapshot_json: declarationDocument,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (documentError || !insertedDocument) {
    return buildActionState(
      "Nao foi possivel salvar a declaracao assinada deste caso agora.",
    );
  }

  const actionRows = detectionsToUpdate.map((item) => ({
    organization_id: organizationId,
    detection_id: item.id,
    user_id: userId,
    action: getActionLabel("unauthorized"),
    from_status: item.status,
    to_status: "unauthorized",
    metadata: {
      assetPublicId: representative.assets?.public_id ?? representative.public_id,
      documentId: insertedDocument.id,
      representativeDetectionId: representative.id,
      scope: parsed.data.scope,
      signerFullName: legalProfile.profile.fullName,
    },
  }));

  const { error: actionError } = await supabase.from("detection_actions").insert(actionRows);

  if (actionError) {
    return buildActionState("Nao foi possivel registrar o historico da ocorrencia.");
  }

  await Promise.allSettled(
    detectionsToUpdate.map((item) => wakeWorkerForSiteIntelInvestigation(item.id)),
  );

  revalidateDetectionViews({
    representativeDetectionId: representative.id,
    casePublicId: representative.case_public_id,
  });
  refresh();

  return {
    status: "success",
    message: "Uso nao autorizado confirmado e declaracao assinada salva com sucesso.",
  };
}
