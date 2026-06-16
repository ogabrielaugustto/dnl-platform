"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAdminActivity } from "@/lib/admin-activity";
import { requirePanelAccess } from "@/lib/auth";
import { getAppUrl, sendPasswordRecoveryEmail } from "@/lib/email/service";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminManagementActionState = {
  message?: string;
  status?: "error" | "success";
};

const inviteUserSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe o nome completo."),
    email: z.email("Informe um e-mail valido."),
    accessType: z.enum(["internal", "client"]),
    organizationId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accessType === "client" && !value.organizationId) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: "Selecione a organizacao que vai receber este usuario.",
      });
    }

    if (
      value.accessType === "client" &&
      value.organizationId &&
      !z.uuid().safeParse(value.organizationId).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationId"],
        message: "Organizacao invalida.",
      });
    }
  });

const toggleUserSchema = z.object({
  userId: z.uuid(),
  nextIsActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const passwordResetSchema = z.object({
  userId: z.uuid(),
});

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const candidate = error as { message?: string };
  return candidate.message ?? fallback;
}

function revalidateAdminManagementPaths() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/organizations");
  revalidatePath("/admin/activities");
}

export async function inviteAdminUserAction(
  _: AdminManagementActionState,
  formData: FormData,
): Promise<AdminManagementActionState> {
  const context = await requirePanelAccess("admin");
  const parsed = inviteUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    accessType: formData.get("accessType"),
    organizationId: formData.get("organizationId") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const admin = createAdminClient();
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id, email, full_name, system_role")
    .eq("email", normalizedEmail)
    .maybeSingle<{
      id: string;
      email: string | null;
      full_name: string | null;
      system_role: "user" | "admin" | "super_admin";
    }>();

  if (existingProfileError) {
    return {
      status: "error",
      message: "Nao foi possivel verificar se este usuario ja existe.",
    };
  }

  const systemRole =
    parsed.data.accessType === "internal"
      ? "admin"
      : existingProfile?.system_role === "admin" ||
          existingProfile?.system_role === "super_admin"
        ? existingProfile.system_role
        : "user";

  let userId = existingProfile?.id ?? null;
  let wasInvitedNow = false;

  if (!userId) {
    const appUrl = getAppUrl();
    const inviteResponse = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: {
        full_name: parsed.data.fullName,
      },
      redirectTo: `${appUrl}/auth/login`,
    });

    if (inviteResponse.error || !inviteResponse.data.user) {
      return {
        status: "error",
        message:
          getMutationErrorMessage(
            inviteResponse.error,
            "Nao foi possivel convidar este usuario agora.",
          ),
      };
    }

    userId = inviteResponse.data.user.id;
    wasInvitedNow = true;
  }

  const { error: upsertProfileError } = await admin.from("profiles").upsert({
    id: userId,
    email: normalizedEmail,
    full_name: parsed.data.fullName,
    system_role: systemRole,
    is_active: true,
  });

  if (upsertProfileError) {
    return {
      status: "error",
      message: "Nao foi possivel salvar o perfil deste usuario.",
    };
  }

  if (parsed.data.accessType === "client" && parsed.data.organizationId) {
    const { error: membershipError } = await admin
      .from("organization_members")
      .upsert(
        {
          organization_id: parsed.data.organizationId,
          user_id: userId,
          role: "member",
          is_active: true,
        },
        {
          onConflict: "organization_id,user_id",
        },
      );

    if (membershipError) {
      return {
        status: "error",
        message: "Nao foi possivel vincular este usuario a organizacao selecionada.",
      };
    }
  }

  await recordAdminActivity({
    action: wasInvitedNow ? "user_invited" : "user_access_updated",
    entity: "user",
    entityId: userId,
    metadata: {
      accessType: parsed.data.accessType,
      email: normalizedEmail,
      fullName: parsed.data.fullName,
      organizationId: parsed.data.organizationId ?? null,
      summary: wasInvitedNow
        ? `Convite enviado para ${parsed.data.fullName}.`
        : `Acesso atualizado para ${parsed.data.fullName}.`,
    },
    organizationId: parsed.data.organizationId ?? null,
    userId: context.userId,
  });

  revalidateAdminManagementPaths();

  return {
    status: "success",
    message:
      parsed.data.accessType === "internal"
        ? wasInvitedNow
          ? "Convite enviado para o colaborador interno."
          : "Acesso interno atualizado com sucesso."
        : wasInvitedNow
          ? "Convite enviado e usuario vinculado a organizacao."
          : "Usuario vinculado a organizacao com sucesso.",
  };
}

export async function toggleAdminUserActiveAction(
  formData: FormData,
): Promise<AdminManagementActionState> {
  const context = await requirePanelAccess("admin");
  const parsed = toggleUserSchema.safeParse({
    userId: formData.get("userId"),
    nextIsActive: formData.get("nextIsActive"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  if (parsed.data.userId === context.userId && !parsed.data.nextIsActive) {
    return {
      status: "error",
      message: "Voce nao pode desativar a sua propria conta por aqui.",
    };
  }

  const admin = createAdminClient();
  const [profileResponse, membershipsResponse] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", parsed.data.userId)
      .maybeSingle<{ id: string; email: string | null; full_name: string | null }>(),
    admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", parsed.data.userId)
      .returns<Array<{ organization_id: string }>>(),
  ]);

  if (profileResponse.error || !profileResponse.data || membershipsResponse.error) {
    return {
      status: "error",
      message: "Usuario nao encontrado para esta alteracao.",
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      is_active: parsed.data.nextIsActive,
    })
    .eq("id", parsed.data.userId);

  if (profileError) {
    return {
      status: "error",
      message: "Nao foi possivel alterar o status deste usuario.",
    };
  }

  const organizationIds = (membershipsResponse.data ?? []).map(
    (membership) => membership.organization_id,
  );

  if (organizationIds.length > 0) {
    const { error: membershipsError } = await admin
      .from("organization_members")
      .update({
        is_active: parsed.data.nextIsActive,
      })
      .eq("user_id", parsed.data.userId);

    if (membershipsError) {
      return {
        status: "error",
        message: "O status principal mudou, mas os vinculos da conta nao foram sincronizados.",
      };
    }
  }

  await recordAdminActivity({
    action: parsed.data.nextIsActive ? "user_activated" : "user_deactivated",
    entity: "user",
    entityId: parsed.data.userId,
    metadata: {
      email: profileResponse.data.email,
      fullName: profileResponse.data.full_name,
      organizationIds,
      summary: parsed.data.nextIsActive
        ? `Conta reativada para ${profileResponse.data.full_name ?? profileResponse.data.email ?? "usuario"}.`
        : `Conta desativada para ${profileResponse.data.full_name ?? profileResponse.data.email ?? "usuario"}.`,
    },
    userId: context.userId,
  });

  revalidateAdminManagementPaths();

  return {
    status: "success",
    message: parsed.data.nextIsActive ? "Usuario reativado." : "Usuario desativado.",
  };
}

export async function sendAdminUserPasswordResetAction(
  formData: FormData,
): Promise<AdminManagementActionState> {
  const context = await requirePanelAccess("admin");
  const parsed = passwordResetSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", parsed.data.userId)
    .maybeSingle<{ id: string; email: string | null; full_name: string | null }>();

  if (profileError || !profile?.email) {
    return {
      status: "error",
      message: "Nao foi possivel localizar o e-mail deste usuario.",
    };
  }

  try {
    const appUrl = getAppUrl();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: {
        redirectTo: `${appUrl}/auth/reset-password`,
      },
    });

    if (error) {
      return {
        status: "error",
        message: "Nao foi possivel gerar o link de redefinicao agora.",
      };
    }

    if (data.properties.hashed_token) {
      const recoveryUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=${encodeURIComponent("/auth/reset-password")}`;

      await sendPasswordRecoveryEmail({
        to: profile.email,
        recoveryUrl,
      });
    }
  } catch {
    return {
      status: "error",
      message: "Nao foi possivel enviar o reset de senha agora.",
    };
  }

  await recordAdminActivity({
    action: "password_reset_sent",
    entity: "user",
    entityId: parsed.data.userId,
    metadata: {
      email: profile.email,
      fullName: profile.full_name,
      summary: `Reset de senha enviado para ${profile.full_name ?? profile.email}.`,
    },
    userId: context.userId,
  });

  revalidatePath("/admin/activities");

  return {
    status: "success",
    message: "Link de redefinicao enviado por e-mail.",
  };
}
