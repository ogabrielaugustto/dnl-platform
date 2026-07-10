"use server";

import { revalidatePath } from "next/cache";
import { recordAdminActivity } from "@/lib/admin-activity";
import { requirePanelAccess } from "@/lib/auth";
import {
  isMissingPlatformSettingsTableError,
  parseAdminPlatformContactForm,
} from "@/lib/dal/admin-platform-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminPlatformContactActionState = {
  message?: string;
  status?: "error" | "success";
};

export async function updateAdminPlatformContactAction(
  formData: FormData,
): Promise<AdminPlatformContactActionState> {
  const context = await requirePanelAccess("admin");
  const parsed = parseAdminPlatformContactForm(formData);

  if (!parsed.success) {
    return {
      message: parsed.message,
      status: "error",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("platform_settings").upsert(
    {
      id: true,
      ...parsed.data.values,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    if (isMissingPlatformSettingsTableError(error)) {
      return {
        message:
          "A tabela de configuracoes da plataforma ainda nao existe no banco. Aplique a migration do dnl-worker antes de salvar.",
        status: "error",
      };
    }

    return {
      message: "Nao foi possivel atualizar o contato da plataforma agora.",
      status: "error",
    };
  }

  await recordAdminActivity({
    action: "platform_contact_settings_updated",
    entity: "platform_settings",
    metadata: {
      hasContactEmail: Boolean(parsed.data.values.contact_email),
      hasContactWhatsapp: Boolean(parsed.data.values.contact_whatsapp),
      summary: "Contato publico da plataforma atualizado no painel admin.",
    },
    userId: context.userId,
  });

  revalidatePath("/admin/platform");
  revalidatePath("/contato");
  revalidatePath("/admin/activities");

  return {
    message: "Contato da plataforma atualizado com sucesso.",
    status: "success",
  };
}
