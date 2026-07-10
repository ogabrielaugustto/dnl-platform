"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAdminActivity } from "@/lib/admin-activity";
import { requirePanelAccess } from "@/lib/auth";
import { buildSupabaseAuthConfirmUrl } from "@/lib/email/links";
import {
  getAppUrl,
  sendPasswordRecoveryEmail,
  sendWelcomeEmail,
} from "@/lib/email/service";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminManagementActionState = {
  credentials?: {
    email: string;
    password: string;
  };
  invited?: boolean;
  message?: string;
  status?: "error" | "success";
};

type ManagementScope = "internal" | "client";

const inviteUserSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe o nome completo."),
    email: z.email("Informe um e-mail valido."),
    accessType: z.enum(["internal", "client"]),
    sendInvite: z.enum(["true", "false"]).transform((value) => value === "true"),
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
  scope: z.enum(["internal", "client"]),
});

const passwordResetSchema = z.object({
  userId: z.uuid(),
  scope: z.enum(["internal", "client"]),
});

function getMutationErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const candidate = error as { message?: string };
  return candidate.message ?? fallback;
}

async function safelySendManagedUserWelcomeEmail({
  email,
  fullName,
  actionLabel,
  actionUrl,
  accessContext,
  isFirstAccess,
}: {
  email: string;
  fullName: string;
  actionLabel: string;
  actionUrl: string;
  accessContext?: string;
  isFirstAccess: boolean;
}) {
  try {
    await sendWelcomeEmail({
      to: email,
      fullName,
      actionLabel,
      actionUrl,
      accessContext,
      isFirstAccess,
    });
  } catch (error) {
    console.error("managed_welcome_email_failed", error);
  }
}

function revalidateAdminManagementPaths() {
  revalidatePath("/admin/platform");
  revalidatePath("/admin/users");
  revalidatePath("/admin/organizations");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/activities");
}

function getUserManagementScope(params: {
  systemRole: "user" | "admin" | "super_admin";
  membershipsCount: number;
}): ManagementScope | "unassigned" {
  if (params.systemRole === "admin" || params.systemRole === "super_admin") {
    return "internal";
  }

  if (params.membershipsCount > 0) {
    return "client";
  }

  return "unassigned";
}

async function loadManagedUserTarget(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const [profileResponse, membershipsResponse] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, system_role")
      .eq("id", userId)
      .maybeSingle<{
        id: string;
        email: string | null;
        full_name: string | null;
        system_role: "user" | "admin" | "super_admin";
      }>(),
    admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .returns<Array<{ organization_id: string }>>(),
  ]);

  if (profileResponse.error || !profileResponse.data || membershipsResponse.error) {
    return null;
  }

  const organizationIds = (membershipsResponse.data ?? []).map(
    (membership) => membership.organization_id,
  );

  return {
    profile: profileResponse.data,
    organizationIds,
    managementScope: getUserManagementScope({
      systemRole: profileResponse.data.system_role,
      membershipsCount: organizationIds.length,
    }),
  };
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
    sendInvite: formData.get("sendInvite") ?? "true",
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
  let welcomeEmailPayload:
    | {
        actionLabel: string;
        actionUrl: string;
        accessContext?: string;
        isFirstAccess: boolean;
      }
    | null = null;
  let generatedPassword: string | null = null;

  if (!userId) {
    const appUrl = getAppUrl();

    if (parsed.data.accessType === "internal" && !parsed.data.sendInvite) {
      generatedPassword = `Dnl@${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const createResponse = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: parsed.data.fullName,
        },
      });

      if (createResponse.error || !createResponse.data.user) {
        return {
          status: "error",
          message:
            getMutationErrorMessage(
              createResponse.error,
              "Nao foi possivel criar este usuario agora.",
            ),
        };
      }

      userId = createResponse.data.user.id;
      welcomeEmailPayload = {
        actionLabel: "Entrar na plataforma",
        actionUrl: `${appUrl}/auth/login`,
        accessContext:
          "Use a senha temporaria compartilhada pela equipe da Direito na Lente para concluir o primeiro acesso.",
        isFirstAccess: false,
      };
    } else {
      const inviteResponse = await admin.auth.admin.generateLink({
        type: "invite",
        email: normalizedEmail,
        options: {
          redirectTo: `${appUrl}/auth/login`,
        },
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
      const inviteActionUrl = inviteResponse.data.properties.action_link;
      const inviteHashedToken = inviteResponse.data.properties.hashed_token;

      if (!inviteActionUrl && !inviteHashedToken) {
        return {
          status: "error",
          message: "Nao foi possivel preparar o primeiro acesso deste usuario agora.",
        };
      }

      welcomeEmailPayload = {
        actionLabel: "Definir acesso",
        actionUrl:
          inviteActionUrl ??
          buildSupabaseAuthConfirmUrl({
            appUrl,
            hashedToken: inviteHashedToken ?? "",
            nextPath: "/auth/login",
            type: "invite",
          }),
        isFirstAccess: true,
      };
    }
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

  if (welcomeEmailPayload) {
    await safelySendManagedUserWelcomeEmail({
      email: normalizedEmail,
      fullName: parsed.data.fullName,
      ...welcomeEmailPayload,
    });
  }

  await recordAdminActivity({
    action: wasInvitedNow ? "user_invited" : "user_access_updated",
    entity: "user",
    entityId: userId,
    metadata: {
      accessType: parsed.data.accessType,
      sendInvite: parsed.data.sendInvite,
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
    credentials: generatedPassword
      ? {
          email: normalizedEmail,
          password: generatedPassword,
        }
      : undefined,
    invited: wasInvitedNow,
    status: "success",
    message:
      parsed.data.accessType === "internal" && generatedPassword
        ? `Usuario interno criado sem convite. E-mail: ${normalizedEmail} | Senha temporaria: ${generatedPassword}`
        : parsed.data.accessType === "internal"
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
    scope: formData.get("scope"),
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
  const target = await loadManagedUserTarget(admin, parsed.data.userId);

  if (!target) {
    return {
      status: "error",
      message: "Usuario nao encontrado para esta alteracao.",
    };
  }

  if (target.managementScope !== parsed.data.scope) {
    return {
      status: "error",
      message:
        parsed.data.scope === "internal"
          ? "Esta conta nao pertence a gestao de usuarios internos."
          : "Esta conta nao pertence a gestao de clientes.",
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

  const organizationIds = target.organizationIds;

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
      email: target.profile.email,
      fullName: target.profile.full_name,
      managementScope: parsed.data.scope,
      organizationIds,
      summary: parsed.data.nextIsActive
        ? `Conta reativada para ${target.profile.full_name ?? target.profile.email ?? "usuario"}.`
        : `Conta desativada para ${target.profile.full_name ?? target.profile.email ?? "usuario"}.`,
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
    scope: formData.get("scope"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const admin = createAdminClient();
  const target = await loadManagedUserTarget(admin, parsed.data.userId);

  if (!target?.profile.email) {
    return {
      status: "error",
      message: "Nao foi possivel localizar o e-mail deste usuario.",
    };
  }

  if (target.managementScope !== parsed.data.scope) {
    return {
      status: "error",
      message:
        parsed.data.scope === "internal"
          ? "Esta conta nao pertence a gestao de usuarios internos."
          : "Esta conta nao pertence a gestao de clientes.",
    };
  }

  try {
    const appUrl = getAppUrl();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: target.profile.email,
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
      const recoveryUrl = buildSupabaseAuthConfirmUrl({
        appUrl,
        hashedToken: data.properties.hashed_token,
        nextPath: "/auth/reset-password",
        type: "recovery",
      });

      await sendPasswordRecoveryEmail({
        to: target.profile.email,
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
      email: target.profile.email,
      fullName: target.profile.full_name,
      managementScope: parsed.data.scope,
      summary: `Reset de senha enviado para ${target.profile.full_name ?? target.profile.email}.`,
    },
    userId: context.userId,
  });

  revalidatePath("/admin/activities");

  return {
    status: "success",
    message: "Link de redefinicao enviado por e-mail.",
  };
}
