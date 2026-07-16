"use server";

import { revalidatePath } from "next/cache";
import { recordAdminActivity } from "@/lib/admin-activity";
import { requirePanelAccess } from "@/lib/auth";
import {
  isMissingPlatformSettingsTableError,
  parseAdminPlatformContactForm,
  parseAdminPlatformGeneralForm,
} from "@/lib/dal/admin-platform-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminPlatformContactActionState = {
  message?: string;
  status?: "error" | "success";
};

export type AdminPlatformGeneralActionState = {
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

export async function updateAdminPlatformGeneralAction(
  formData: FormData,
): Promise<AdminPlatformGeneralActionState> {
  const context = await requirePanelAccess("admin");
  const parsed = parseAdminPlatformGeneralForm(formData);

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
          "As colunas de informacoes gerais ainda nao existem no banco. Aplique a migration do dnl-worker antes de salvar.",
        status: "error",
      };
    }

    return {
      message:
        "Nao foi possivel atualizar as informacoes gerais da plataforma agora.",
      status: "error",
    };
  }

  await recordAdminActivity({
    action: "platform_general_settings_updated",
    entity: "platform_settings",
    metadata: {
      hasCnpj: Boolean(parsed.data.values.cnpj),
      hasLegalRepresentative: Boolean(
        parsed.data.values.legal_representative_name,
      ),
      hasTradeName: Boolean(parsed.data.values.trade_name),
      summary: "Informacoes gerais da plataforma atualizadas no painel admin.",
    },
    userId: context.userId,
  });

  revalidatePath("/admin/platform");
  revalidatePath("/admin/activities");

  return {
    message: "Informacoes gerais da plataforma atualizadas com sucesso.",
    status: "success",
  };
}
