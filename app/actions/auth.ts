"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getAppUrl,
  sendPasswordRecoveryEmail,
  sendWelcomeEmail,
} from "@/lib/email/service";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type AppPanel,
  type AuthContext,
  getAuthContext,
  getDefaultPanelPath,
} from "@/lib/auth";
import {
  AUTHORIZATION_TERMS_VERSION,
  CUSTOMER_ONBOARDING_FLOW_VERSION,
  REGISTRATION_TERMS_VERSION,
  clearPendingSignupOnboarding,
  getPendingSignupOnboarding,
  setPendingSignupOnboarding,
} from "@/lib/signup-onboarding";

type AuthActionState = {
  message?: string;
  onboarding?: {
    email: string;
    fullName: string;
    organizationName: string;
    requiresEmailConfirmation: boolean;
  };
  status?: "error" | "success";
};

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  panel: z.enum(["client", "admin"]),
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    organizationName: z
      .string()
      .trim()
      .min(2, "Informe o nome da organização."),
    email: z.email("Informe um e-mail válido."),
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "Confirme sua senha com pelo menos 8 caracteres."),
    acceptRegistrationTerms: z.literal(true, {
      message:
        "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "Confirme a senha com pelo menos 8 caracteres."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

const signOutSchema = z.object({
  panel: z.enum(["client", "admin"]).default("client"),
});

async function getActionContextFresh(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name, avatar_url, system_role, is_active")
      .eq("id", user.id)
      .maybeSingle<{
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
        system_role: "user" | "admin" | "super_admin";
        is_active: boolean;
      }>(),
    supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          organization_id: string;
          role: "owner" | "admin" | "member";
          organizations: { name: string } | null;
        }>
      >(),
  ]);

  const systemRole = profile?.system_role ?? "user";
  const organizations =
    memberships?.map((membership) => ({
      organizationId: membership.organization_id,
      organizationName: membership.organizations?.name ?? null,
      role: membership.role,
    })) ?? [];
  const membership = organizations[0] ?? null;

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName:
      profile?.full_name ??
      (typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    avatarUrl:
      profile?.avatar_url ??
      (typeof user.user_metadata.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null),
    systemRole,
    isActive: profile?.is_active ?? true,
    isAdmin: systemRole === "admin" || systemRole === "super_admin",
    membership,
    organizations,
  };
}

async function ensureCustomerWorkspace(
  organizationName?: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const context = await getAuthContext();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!context) {
    return { ok: false, message: "Sessão não encontrada após a autenticação." };
  }

  if (context.membership || context.isAdmin) {
    return { ok: true };
  }

  const normalizedOrganizationName =
    organizationName?.trim() ||
    (typeof user?.user_metadata.organization_name === "string"
      ? user.user_metadata.organization_name.trim()
      : "") ||
    context.fullName?.trim() ||
    "Minha organização";

  const { error } = await supabase.rpc("create_organization", {
    organization_name: normalizedOrganizationName,
    organization_document: null,
    organization_billing_email: context.email,
  });

  if (error) {
    return {
      ok: false,
      message:
        "Não foi possível criar a organização inicial da conta. Tente novamente.",
    };
  }

  return { ok: true };
}

async function safelySendWelcomeEmail({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  try {
    await sendWelcomeEmail({
      to: email,
      fullName,
    });
  } catch (error) {
    console.error("welcome_email_failed", error);
  }
}

function getRequestIp(requestHeaders: Headers) {
  const candidates = [
    requestHeaders.get("cf-connecting-ip"),
    requestHeaders.get("x-real-ip"),
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];

  return candidates.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

async function getOnboardingOrganizationId(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ organization_id: string }>();

  if (error) {
    return null;
  }

  return data?.organization_id ?? null;
}

function getPanelRedirect(panel: AppPanel, context: AuthContext): string {
  if (panel === "admin") {
    return "/admin";
  }

  return getDefaultPanelPath(context);
}

export async function loginAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    panel: formData.get("panel"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const { email, password, panel } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: "E-mail ou senha inválidos.",
    };
  }

  const context = await getAuthContext();

  if (!context) {
    return {
      status: "error",
      message: "Não foi possível carregar o contexto da conta autenticada.",
    };
  }

  let resolvedContext: AuthContext = context;

  if (!context.isActive) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Esta conta esta desativada. Fale com um administrador da DNL.",
    };
  }

  if (panel === "client" && context.isAdmin) {
    redirect("/admin");
  }

  if (panel === "admin") {
    if (!context.isAdmin) {
      await supabase.auth.signOut();
      return {
        status: "error",
        message: "Esta conta não possui acesso ao painel administrativo.",
      };
    }
  } else {
    const workspaceResult = await ensureCustomerWorkspace();

    if (!workspaceResult.ok) {
      await supabase.auth.signOut();
      return {
        status: "error",
        message: workspaceResult.message,
      };
    }

    const refreshedContext = await getActionContextFresh();

    if (!refreshedContext) {
      await supabase.auth.signOut();
      return {
        status: "error",
        message: "Não foi possível recarregar o contexto da conta autenticada.",
      };
    }

    resolvedContext = refreshedContext;
  }

  const userMetadata = data.user.user_metadata;
  const hasRegistrationConsent =
    typeof userMetadata.registration_terms_accepted_at === "string";
  const hasAuthorizationConsent =
    typeof userMetadata.authorization_terms_accepted_at === "string";

  if (hasRegistrationConsent && !hasAuthorizationConsent) {
    await setPendingSignupOnboarding({
      userId: context.userId,
      email: context.email ?? email,
      fullName:
        context.fullName ??
        (typeof userMetadata.full_name === "string" ? userMetadata.full_name : email),
      organizationName:
        (typeof userMetadata.organization_name === "string"
          ? userMetadata.organization_name
          : null) ??
        context.membership?.organizationName ??
        "Minha organização",
      requiresEmailConfirmation: false,
      registrationTermsAcceptedAt: userMetadata.registration_terms_accepted_at,
      flowVersion:
        typeof userMetadata.customer_onboarding_flow_version === "string"
          ? userMetadata.customer_onboarding_flow_version
          : CUSTOMER_ONBOARDING_FLOW_VERSION,
    });

    redirect("/auth/register?onboarding=resume");
  }

  if (panel === "client" && !resolvedContext.membership) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Esta conta ainda não possui uma organização vinculada.",
    };
  }

  redirect(getPanelRedirect(panel, resolvedContext));
}

export async function registerCustomerAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptRegistrationTerms: formData.get("acceptRegistrationTerms") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const { fullName, organizationName, email, password } = parsed.data;
  const registrationTermsAcceptedAt = new Date().toISOString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        customer_onboarding_flow_version: CUSTOMER_ONBOARDING_FLOW_VERSION,
        full_name: fullName,
        organization_name: organizationName,
        privacy_policy_accepted_at: registrationTermsAcceptedAt,
        registration_terms_accepted_at: registrationTermsAcceptedAt,
        registration_terms_version: REGISTRATION_TERMS_VERSION,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("already registered")
        ? "Já existe uma conta com este e-mail."
        : "Não foi possível concluir o cadastro.",
    };
  }

  if (!data.user) {
    return {
      status: "error",
      message: "Não foi possível recuperar a conta criada para concluir o onboarding.",
    };
  }

  const onboardingState = {
    email,
    fullName,
    organizationName,
    requiresEmailConfirmation: !data.session,
  } as const;

  await setPendingSignupOnboarding({
    userId: data.user.id,
    email,
    fullName,
    organizationName,
    requiresEmailConfirmation: !data.session,
    registrationTermsAcceptedAt,
    flowVersion: CUSTOMER_ONBOARDING_FLOW_VERSION,
  });

  if (!data.session) {
    await safelySendWelcomeEmail({
      email,
      fullName,
    });

    return {
      status: "success",
      onboarding: onboardingState,
    };
  }

  const workspaceResult = await ensureCustomerWorkspace(organizationName);

  if (!workspaceResult.ok) {
    await clearPendingSignupOnboarding();
    await supabase.auth.signOut();
    return {
      status: "error",
      message: workspaceResult.message,
    };
  }

  await safelySendWelcomeEmail({
    email,
    fullName,
  });

  return {
    status: "success",
    onboarding: onboardingState,
  };
}

export async function completeCustomerOnboardingAction(
  currentState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  void currentState;
  void formData;

  const pendingOnboarding = await getPendingSignupOnboarding();

  if (!pendingOnboarding) {
    return {
      status: "error",
      message:
        "Não encontramos o onboarding pendente desta conta. Refaça o cadastro ou entre novamente para continuar.",
    };
  }

  const requestHeaders = await headers();
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id !== pendingOnboarding.userId) {
    await clearPendingSignupOnboarding();
    await supabase.auth.signOut();

    return {
      status: "error",
      message:
        "Encontramos um conflito de sessão durante o onboarding. Entre novamente para concluir o aceite.",
    };
  }

  const { data: authUserResponse, error: authUserError } =
    await admin.auth.admin.getUserById(pendingOnboarding.userId);

  if (authUserError || !authUserResponse.user) {
    return {
      status: "error",
      message:
        "Não foi possível recuperar os dados da conta para salvar o aceite agora.",
    };
  }

  const acceptedAt = new Date().toISOString();
  const ipAddress = getRequestIp(requestHeaders);
  const userAgent = requestHeaders.get("user-agent");
  const existingMetadata = authUserResponse.user.user_metadata ?? {};

  const { error: updateUserError } = await admin.auth.admin.updateUserById(
    pendingOnboarding.userId,
    {
      user_metadata: {
        ...existingMetadata,
        authorization_terms_accepted_at: acceptedAt,
        authorization_terms_ip: ipAddress,
        authorization_terms_user_agent: userAgent,
        authorization_terms_version: AUTHORIZATION_TERMS_VERSION,
        customer_onboarding_completed_at: acceptedAt,
        customer_onboarding_flow_version: pendingOnboarding.flowVersion,
      },
    },
  );

  if (updateUserError) {
    return {
      status: "error",
      message:
        "Não foi possível salvar o aceite obrigatório agora. Tente novamente em instantes.",
    };
  }

  const organizationId =
    user?.id === pendingOnboarding.userId
      ? (await getActionContextFresh())?.membership?.organizationId ?? null
      : await getOnboardingOrganizationId(pendingOnboarding.userId);

  const { error: auditError } = await admin.from("audit_logs").insert({
    action: "authorization_terms_accepted",
    entity: "customer_onboarding",
    metadata: {
      accepted_at: acceptedAt,
      authorization_terms_title:
        "Termo de Autorização para Monitoramento e Declaração de Titularidade",
      authorization_terms_version: AUTHORIZATION_TERMS_VERSION,
      customer_onboarding_flow_version: pendingOnboarding.flowVersion,
      ip_address: ipAddress,
      organization_name: pendingOnboarding.organizationName,
      registration_terms_accepted_at:
        pendingOnboarding.registrationTermsAcceptedAt,
      registration_terms_version: REGISTRATION_TERMS_VERSION,
      requires_email_confirmation:
        pendingOnboarding.requiresEmailConfirmation,
      user_agent: userAgent,
    },
    organization_id: organizationId,
    user_id: pendingOnboarding.userId,
  });

  if (auditError) {
    return {
      status: "error",
      message:
        "Não foi possível registrar a trilha do aceite agora. Tente novamente em instantes.",
    };
  }

  await clearPendingSignupOnboarding();

  if (user?.id === pendingOnboarding.userId) {
    redirect("/dashboard");
  }

  redirect("/auth/login?message=signup-complete");
}

export async function signOutAction(formData: FormData) {
  const parsed = signOutSchema.safeParse({
    panel: formData.get("panel") ?? "client",
  });
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(parsed.data?.panel === "admin" ? "/admin/login" : "/auth/login");
}

export async function requestPasswordResetAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const admin = createAdminClient();

  try {
    const appUrl = getAppUrl();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: parsed.data.email,
      options: {
        redirectTo: `${appUrl}/auth/reset-password`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("not found") ||
        message.includes("user not found") ||
        message.includes("email not found")
      ) {
        return {
          status: "success",
          message:
            "Se existir uma conta com este e-mail, você receberá um link de recuperação em instantes.",
        };
      }

      return {
        status: "error",
        message:
          "Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.",
      };
    }

    if (data.properties.hashed_token) {
      const recoveryUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery&next=${encodeURIComponent("/auth/reset-password")}`;

      await sendPasswordRecoveryEmail({
        to: parsed.data.email,
        recoveryUrl,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("not found") ||
      message.includes("user not found") ||
      message.includes("email not found")
    ) {
      return {
        status: "success",
        message:
          "Se existir uma conta com este e-mail, você receberá um link de recuperação em instantes.",
      };
    }

    return {
      status: "error",
      message:
        "Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.",
    };
  }

  return {
    status: "success",
    message:
      "Se existir uma conta com este e-mail, você receberá um link de recuperação em instantes.",
  };
}

export async function updatePasswordAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message:
        "Sua sessão de recuperação expirou. Solicite um novo link para continuar.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message:
        "Não foi possível atualizar a senha agora. Tente novamente em instantes.",
    };
  }

  await supabase.auth.signOut();
  redirect("/auth/login?reset=success");
}
