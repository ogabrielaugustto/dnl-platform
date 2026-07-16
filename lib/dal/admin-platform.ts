import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import {
  buildWhatsAppUrl,
  isMissingPlatformSettingsTableError,
} from "@/lib/dal/admin-platform-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

type PlatformSettingsRow = {
  contact_email: string | null;
  contact_whatsapp: string | null;
  updated_at: string;
};

type PlatformGeneralSettingsRow = {
  about: string | null;
  address_complement: string | null;
  address_line: string | null;
  address_number: string | null;
  city: string | null;
  cnpj: string | null;
  district: string | null;
  institutional_email: string | null;
  institutional_phone: string | null;
  legal_name: string | null;
  legal_representative_document: string | null;
  legal_representative_email: string | null;
  legal_representative_name: string | null;
  legal_representative_phone: string | null;
  legal_representative_role: string | null;
  postal_code: string | null;
  state: string | null;
  trade_name: string | null;
  updated_at: string;
};

const emptyPlatformContactSettings: AdminPlatformContactSettings = {
  contactEmail: null,
  contactWhatsapp: null,
  updatedAt: null,
  whatsappUrl: null,
};

const emptyPlatformGeneralSettings: AdminPlatformGeneralSettings = {
  about: null,
  addressComplement: null,
  addressLine: null,
  addressNumber: null,
  city: null,
  cnpj: null,
  district: null,
  institutionalEmail: null,
  institutionalPhone: null,
  legalName: null,
  legalRepresentativeDocument: null,
  legalRepresentativeEmail: null,
  legalRepresentativeName: null,
  legalRepresentativePhone: null,
  legalRepresentativeRole: null,
  postalCode: null,
  state: null,
  tradeName: null,
  updatedAt: null,
};

export type AdminPlatformContactSettings = {
  contactEmail: string | null;
  contactWhatsapp: string | null;
  updatedAt: string | null;
  whatsappUrl: string | null;
};

export type AdminPlatformGeneralSettings = {
  about: string | null;
  addressComplement: string | null;
  addressLine: string | null;
  addressNumber: string | null;
  city: string | null;
  cnpj: string | null;
  district: string | null;
  institutionalEmail: string | null;
  institutionalPhone: string | null;
  legalName: string | null;
  legalRepresentativeDocument: string | null;
  legalRepresentativeEmail: string | null;
  legalRepresentativeName: string | null;
  legalRepresentativePhone: string | null;
  legalRepresentativeRole: string | null;
  postalCode: string | null;
  state: string | null;
  tradeName: string | null;
  updatedAt: string | null;
};

async function readPlatformSettings({
  throwOnError,
}: {
  throwOnError: boolean;
}): Promise<AdminPlatformContactSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("contact_email, contact_whatsapp, updated_at")
    .eq("id", true)
    .maybeSingle<PlatformSettingsRow>();

  if (error) {
    if (isMissingPlatformSettingsTableError(error)) {
      console.error("platform_contact_settings_table_missing", {
        message: error.message,
      });

      return emptyPlatformContactSettings;
    }

    if (throwOnError) {
      throw new Error("Nao foi possivel carregar as configuracoes da plataforma.");
    }

    console.error("platform_contact_settings_read_failed", {
      message: error.message,
    });
  }

  return {
    contactEmail: data?.contact_email ?? null,
    contactWhatsapp: data?.contact_whatsapp ?? null,
    updatedAt: data?.updated_at ?? null,
    whatsappUrl: buildWhatsAppUrl(data?.contact_whatsapp ?? null),
  };
}

async function readPlatformGeneralSettings(): Promise<AdminPlatformGeneralSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select(
      [
        "about",
        "address_complement",
        "address_line",
        "address_number",
        "city",
        "cnpj",
        "district",
        "institutional_email",
        "institutional_phone",
        "legal_name",
        "legal_representative_document",
        "legal_representative_email",
        "legal_representative_name",
        "legal_representative_phone",
        "legal_representative_role",
        "postal_code",
        "state",
        "trade_name",
        "updated_at",
      ].join(", "),
    )
    .eq("id", true)
    .maybeSingle<PlatformGeneralSettingsRow>();

  if (error) {
    if (isMissingPlatformSettingsTableError(error)) {
      console.error("platform_general_settings_schema_missing", {
        message: error.message,
      });

      return emptyPlatformGeneralSettings;
    }

    throw new Error("Nao foi possivel carregar as informacoes gerais da plataforma.");
  }

  return {
    about: data?.about ?? null,
    addressComplement: data?.address_complement ?? null,
    addressLine: data?.address_line ?? null,
    addressNumber: data?.address_number ?? null,
    city: data?.city ?? null,
    cnpj: data?.cnpj ?? null,
    district: data?.district ?? null,
    institutionalEmail: data?.institutional_email ?? null,
    institutionalPhone: data?.institutional_phone ?? null,
    legalName: data?.legal_name ?? null,
    legalRepresentativeDocument: data?.legal_representative_document ?? null,
    legalRepresentativeEmail: data?.legal_representative_email ?? null,
    legalRepresentativeName: data?.legal_representative_name ?? null,
    legalRepresentativePhone: data?.legal_representative_phone ?? null,
    legalRepresentativeRole: data?.legal_representative_role ?? null,
    postalCode: data?.postal_code ?? null,
    state: data?.state ?? null,
    tradeName: data?.trade_name ?? null,
    updatedAt: data?.updated_at ?? null,
  };
}

export async function getPlatformContactSettings() {
  await requirePanelAccess("admin");

  return readPlatformSettings({ throwOnError: true });
}

export async function getPlatformGeneralSettings() {
  await requirePanelAccess("admin");

  return readPlatformGeneralSettings();
}

export async function getPublicPlatformContactSettings() {
  return readPlatformSettings({ throwOnError: false });
}
