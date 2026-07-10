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

const emptyPlatformContactSettings: AdminPlatformContactSettings = {
  contactEmail: null,
  contactWhatsapp: null,
  updatedAt: null,
  whatsappUrl: null,
};

export type AdminPlatformContactSettings = {
  contactEmail: string | null;
  contactWhatsapp: string | null;
  updatedAt: string | null;
  whatsappUrl: string | null;
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

export async function getPlatformContactSettings() {
  await requirePanelAccess("admin");

  return readPlatformSettings({ throwOnError: true });
}

export async function getPublicPlatformContactSettings() {
  return readPlatformSettings({ throwOnError: false });
}
