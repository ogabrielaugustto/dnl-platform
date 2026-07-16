import { z } from "zod";

export type AdminPlatformContactUpdateValues = {
  contact_email: string | null;
  contact_whatsapp: string | null;
};

export type AdminPlatformGeneralUpdateValues = {
  trade_name: string | null;
  legal_name: string | null;
  cnpj: string | null;
  institutional_email: string | null;
  institutional_phone: string | null;
  postal_code: string | null;
  address_line: string | null;
  address_number: string | null;
  address_complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  about: string | null;
  legal_representative_name: string | null;
  legal_representative_document: string | null;
  legal_representative_role: string | null;
  legal_representative_phone: string | null;
  legal_representative_email: string | null;
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

export type ParsedAdminPlatformGeneralForm =
  | {
      data: {
        values: AdminPlatformGeneralUpdateValues;
      };
      success: true;
    }
  | {
      message: string;
      success: false;
    };

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null);

const optionalEmail = (message: string) =>
  z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.email(message).nullable());

const optionalDigitsLength = ({
  length,
  message,
  max,
}: {
  length: number;
  message: string;
  max: number;
}) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null)
    .refine(
      (value) => !value || value.replace(/\D/g, "").length === length,
      message,
    );

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

const adminPlatformGeneralSchema = z.object({
  tradeName: optionalText(120, "Informe um nome fantasia com ate 120 caracteres."),
  legalName: optionalText(180, "Informe uma razao social com ate 180 caracteres."),
  cnpj: optionalDigitsLength({
    length: 14,
    max: 32,
    message: "Informe um CNPJ com 14 digitos.",
  }),
  institutionalEmail: optionalEmail("Informe um e-mail institucional valido."),
  institutionalPhone: optionalText(40, "Informe um telefone com ate 40 caracteres."),
  postalCode: optionalDigitsLength({
    length: 8,
    max: 16,
    message: "Informe um CEP com 8 digitos.",
  }),
  addressLine: optionalText(180, "Informe um endereco com ate 180 caracteres."),
  addressNumber: optionalText(30, "Informe um numero com ate 30 caracteres."),
  addressComplement: optionalText(120, "Informe um complemento com ate 120 caracteres."),
  district: optionalText(120, "Informe um bairro com ate 120 caracteres."),
  city: optionalText(120, "Informe uma cidade com ate 120 caracteres."),
  state: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => !value || /^[A-Z]{2}$/.test(value), {
      message: "Informe a UF com 2 letras.",
    })
    .transform((value) => value || null),
  about: optionalText(1200, "Informe o texto sobre a DNL com ate 1200 caracteres."),
  legalRepresentativeName: optionalText(
    160,
    "Informe o nome do representante com ate 160 caracteres.",
  ),
  legalRepresentativeDocument: optionalText(
    40,
    "Informe o documento do representante com ate 40 caracteres.",
  ),
  legalRepresentativeRole: optionalText(
    120,
    "Informe o cargo do representante com ate 120 caracteres.",
  ),
  legalRepresentativePhone: optionalText(
    40,
    "Informe o celular do representante com ate 40 caracteres.",
  ),
  legalRepresentativeEmail: optionalEmail(
    "Informe um e-mail valido para o representante legal.",
  ),
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

export function parseAdminPlatformGeneralForm(
  formData: FormData,
): ParsedAdminPlatformGeneralForm {
  const parsed = adminPlatformGeneralSchema.safeParse({
    tradeName: readString(formData, "tradeName"),
    legalName: readString(formData, "legalName"),
    cnpj: readString(formData, "cnpj"),
    institutionalEmail: readString(formData, "institutionalEmail"),
    institutionalPhone: readString(formData, "institutionalPhone"),
    postalCode: readString(formData, "postalCode"),
    addressLine: readString(formData, "addressLine"),
    addressNumber: readString(formData, "addressNumber"),
    addressComplement: readString(formData, "addressComplement"),
    district: readString(formData, "district"),
    city: readString(formData, "city"),
    state: readString(formData, "state"),
    about: readString(formData, "about"),
    legalRepresentativeName: readString(formData, "legalRepresentativeName"),
    legalRepresentativeDocument: readString(
      formData,
      "legalRepresentativeDocument",
    ),
    legalRepresentativeRole: readString(formData, "legalRepresentativeRole"),
    legalRepresentativePhone: readString(formData, "legalRepresentativePhone"),
    legalRepresentativeEmail: readString(formData, "legalRepresentativeEmail"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Dados invalidos para as informacoes gerais.",
      success: false,
    };
  }

  return {
    data: {
      values: {
        trade_name: parsed.data.tradeName,
        legal_name: parsed.data.legalName,
        cnpj: parsed.data.cnpj,
        institutional_email: parsed.data.institutionalEmail,
        institutional_phone: parsed.data.institutionalPhone,
        postal_code: parsed.data.postalCode,
        address_line: parsed.data.addressLine,
        address_number: parsed.data.addressNumber,
        address_complement: parsed.data.addressComplement,
        district: parsed.data.district,
        city: parsed.data.city,
        state: parsed.data.state,
        about: parsed.data.about,
        legal_representative_name: parsed.data.legalRepresentativeName,
        legal_representative_document:
          parsed.data.legalRepresentativeDocument,
        legal_representative_role: parsed.data.legalRepresentativeRole,
        legal_representative_phone: parsed.data.legalRepresentativePhone,
        legal_representative_email: parsed.data.legalRepresentativeEmail,
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
