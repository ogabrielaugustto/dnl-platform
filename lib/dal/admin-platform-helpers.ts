import { z } from "zod";

export type AdminPlatformContactUpdateValues = {
  contact_email: string | null;
  contact_whatsapp: string | null;
};

export type ParsedAdminPlatformContactForm =
  | {
      data: {
        values: AdminPlatformContactUpdateValues;
      };
      success: true;
    }
  | {
      message: string;
      success: false;
    };

const adminPlatformContactSchema = z.object({
  contactEmail: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.email("Informe um e-mail de contato valido.").nullable()),
  contactWhatsapp: z
    .string()
    .trim()
    .max(40, "Informe um WhatsApp com ate 40 caracteres.")
    .transform((value) => value || null),
});

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseAdminPlatformContactForm(
  formData: FormData,
): ParsedAdminPlatformContactForm {
  const parsed = adminPlatformContactSchema.safeParse({
    contactEmail: readString(formData, "contactEmail"),
    contactWhatsapp: readString(formData, "contactWhatsapp"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ?? "Dados invalidos para o contato.",
      success: false,
    };
  }

  return {
    data: {
      values: {
        contact_email: parsed.data.contactEmail,
        contact_whatsapp: parsed.data.contactWhatsapp,
      },
    },
    success: true,
  };
}

export function buildWhatsAppUrl(value: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const normalized =
    trimmed.startsWith("+") || digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${normalized}`;
}

export function isMissingPlatformSettingsTableError(error: unknown) {
  const maybeError = error as {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  };
  const code = maybeError?.code ?? "";
  const text = [
    maybeError?.message,
    maybeError?.details,
    maybeError?.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!text.includes("platform_settings")) {
    return false;
  }

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    text.includes("schema cache") ||
    text.includes("does not exist") ||
    text.includes("could not find")
  );
}
