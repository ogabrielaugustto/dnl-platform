"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getAppUrl,
  sendPasswordRecoveryEmail,
  sendWelcomeEmail,
} from "@/lib/email/service";
import { buildSupabaseAuthConfirmUrl } from "@/lib/email/links";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type AppPanel, getAuthContext, getDefaultPanelPath } from "@/lib/auth";
import {
  fetchBrasilApiCompany,
  parseRegistrationDocument,
  validateOnboardingAddress,
  validateRegistrationPhone,
} from "@/lib/customer-onboarding";
import {
  buildPendingSignupOnboardingFromMetadata,
  CUSTOMER_ONBOARDING_FLOW_VERSION,
  REGISTRATION_TERMS_VERSION,
  clearPendingSignupOnboarding,
  getPendingSignupOnboarding,
  setPendingSignupOnboarding,
} from "@/lib/signup-onboarding";

type AuthActionState = {
  message?: string;
  status?: "error" | "success";
};

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  panel: z.enum(["client", "admin"]),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido."),
  phone: z.string().trim().min(1, "Informe seu celular."),
  document: z.string().trim().min(1, "Informe seu CPF ou CNPJ."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres."),
  acceptRegistrationTerms: z.literal(true, {
    message:
      "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.",
  }),
});

const completeOnboardingSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(2, "Informe o nome do workspace.")
    .max(120, "Use até 120 caracteres para o nome do workspace."),
  profession: z
    .string()
    .trim()
    .min(2, "Informe sua profissão.")
    .max(120, "Use até 120 caracteres para a profissão."),
  postalCode: z.string().trim(),
  addressNumber: z
    .string()
    .trim()
    .min(1, "Informe o número do endereço.")
    .max(40, "Use até 40 caracteres para o número."),
  addressComplement: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? ""),
  hasNoComplement: z.boolean(),
  referralSource: z
    .string()
    .trim()
    .max(60, "Use até 60 caracteres para a origem.")
    .optional()
    .transform((value) => value ?? ""),
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

function normalizeOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getRequestIp(requestHeaders: Headers) {
  const candidates = [
    requestHeaders.get("cf-connecting-ip"),
    requestHeaders.get("x-real-ip"),
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];

  return (
    candidates.find((value) => typeof value === "string" && value.length > 0) ??
    null
  );
}

function hasMissingOnboardingProfileFieldsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42703" ||
    combinedMessage.includes("phone") ||
    combinedMessage.includes("profession") ||
    combinedMessage.includes("postal_code") ||
    combinedMessage.includes("address_number") ||
    combinedMessage.includes("address_complement")
  );
}

function hasMissingOnboardingOrganizationFieldsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42703" ||
    combinedMessage.includes("legal_name") ||
    combinedMessage.includes("trade_name") ||
    combinedMessage.includes("postal_code") ||
    combinedMessage.includes("street") ||
    combinedMessage.includes("number") ||
    combinedMessage.includes("complement") ||
    combinedMessage.includes("neighborhood") ||
    combinedMessage.includes("city") ||
    combinedMessage.includes("state")
  );
}

async function safelySendWelcomeEmail({
  email,
  fullName,
  actionLabel,
  actionUrl,
  accessContext,
  isFirstAccess,
}: {
  email: string;
  fullName: string;
  actionLabel?: string;
  actionUrl?: string;
  accessContext?: string;
  isFirstAccess?: boolean;
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
    console.error("welcome_email_failed", error);
  }
}

async function buildPendingOnboardingFromCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return buildPendingSignupOnboardingFromMetadata({
    userId: user.id,
    email: user.email,
    userMetadata: (user.user_metadata ?? {}) as Record<string, unknown>,
  });
}

function getPanelRedirect(panel: AppPanel, context: Awaited<ReturnType<typeof getAuthContext>>) {
  if (panel === "admin") {
    return "/admin";
  }

  if (!context) {
    return "/auth/login";
  }

  return getDefaultPanelPath(context);
}

async function upsertCustomerOrganization(params: {
  userId: string;
  workspaceName: string;
  documentType: "cpf" | "cnpj";
  documentValue: string;
  phone: string;
  email: string;
  address: {
    postalCode: string;
    number: string;
    complement: string | null;
  };
  company: NonNullable<Awaited<ReturnType<typeof getPendingSignupOnboarding>>>["company"];
}) {
  const admin = createAdminClient();
  const organizationPayload = {
    name: params.workspaceName,
    document: params.documentType === "cnpj" ? params.documentValue : null,
    billing_email: params.company?.billingEmail ?? params.email,
    contact_email: params.email,
    contact_phone: params.company?.contactPhone ?? params.phone,
    legal_name: params.company?.legalName ?? null,
    trade_name: params.company?.tradeName ?? null,
    postal_code: params.address.postalCode,
    street: params.company?.street ?? null,
    number: params.address.number,
    complement: params.address.complement,
    neighborhood: params.company?.neighborhood ?? null,
    city: params.company?.city ?? null,
    state: params.company?.state ?? null,
  };

  const { data: membership, error: membershipError } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", params.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ organization_id: string }>();

  if (membershipError) {
    return {
      ok: false as const,
      message:
        "Não foi possível verificar a organização vinculada a esta conta agora.",
    };
  }

  if (membership?.organization_id) {
    const { error } = await admin
      .from("organizations")
      .update(organizationPayload)
      .eq("id", membership.organization_id);

    if (error) {
      if (hasMissingOnboardingOrganizationFieldsError(error)) {
        const fallback = await admin
          .from("organizations")
          .update({
            name: organizationPayload.name,
            document: organizationPayload.document,
            billing_email: organizationPayload.billing_email,
            contact_email: organizationPayload.contact_email,
            contact_phone: organizationPayload.contact_phone,
          })
          .eq("id", membership.organization_id);

        if (fallback.error) {
          return {
            ok: false as const,
            message:
              "Não foi possível atualizar o workspace desta conta agora.",
          };
        }
      } else {
        return {
          ok: false as const,
          message: "Não foi possível atualizar o workspace desta conta agora.",
        };
      }
    }

    const { error: upsertMembershipError } = await admin
      .from("organization_members")
      .upsert(
        {
          organization_id: membership.organization_id,
          user_id: params.userId,
          role: "owner",
          is_active: true,
        },
        {
          onConflict: "organization_id,user_id",
        },
      );

    if (upsertMembershipError) {
      return {
        ok: false as const,
        message:
          "Não foi possível atualizar o acesso desta conta ao workspace agora.",
      };
    }

    return {
      ok: true as const,
      organizationId: membership.organization_id,
    };
  }

  const { data: insertedOrganization, error: organizationError } = await admin
    .from("organizations")
    .insert(organizationPayload)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (organizationError || !insertedOrganization) {
    if (organizationError && hasMissingOnboardingOrganizationFieldsError(organizationError)) {
      const fallback = await admin
        .from("organizations")
        .insert({
          name: organizationPayload.name,
          document: organizationPayload.document,
          billing_email: organizationPayload.billing_email,
          contact_email: organizationPayload.contact_email,
          contact_phone: organizationPayload.contact_phone,
        })
        .select("id")
        .maybeSingle<{ id: string }>();

      if (fallback.error || !fallback.data) {
        return {
          ok: false as const,
          message: "Não foi possível criar o workspace inicial da conta agora.",
        };
      }

      const { error: fallbackMembershipError } = await admin
        .from("organization_members")
        .upsert(
          {
            organization_id: fallback.data.id,
            user_id: params.userId,
            role: "owner",
            is_active: true,
          },
          {
            onConflict: "organization_id,user_id",
          },
        );

      if (fallbackMembershipError) {
        return {
          ok: false as const,
          message:
            "Não foi possível vincular a conta ao workspace recém-criado agora.",
        };
      }

      return {
        ok: true as const,
        organizationId: fallback.data.id,
      };
    }

    return {
      ok: false as const,
      message: "Não foi possível criar o workspace inicial da conta agora.",
    };
  }

  const { error: membershipInsertError } = await admin
    .from("organization_members")
    .upsert(
      {
        organization_id: insertedOrganization.id,
        user_id: params.userId,
        role: "owner",
        is_active: true,
      },
      {
        onConflict: "organization_id,user_id",
      },
    );

  if (membershipInsertError) {
    return {
      ok: false as const,
      message:
        "Não foi possível vincular a conta ao workspace recém-criado agora.",
    };
  }

  return {
    ok: true as const,
    organizationId: insertedOrganization.id,
  };
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

    redirect("/admin");
  }

  if (!context.membership) {
    const pendingOnboarding = buildPendingSignupOnboardingFromMetadata({
      userId: context.userId,
      email: context.email ?? email,
      userMetadata: (data.user.user_metadata ?? {}) as Record<string, unknown>,
    });

    if (!pendingOnboarding) {
      await supabase.auth.signOut();
      return {
        status: "error",
        message:
          "Não foi possível retomar o onboarding desta conta. Refaça o cadastro ou fale com a equipe DNL.",
      };
    }

    await setPendingSignupOnboarding(pendingOnboarding);
    redirect("/onboarding");
  }

  redirect(getPanelRedirect(panel, context));
}

export async function registerCustomerAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    document: formData.get("document"),
    password: formData.get("password"),
    acceptRegistrationTerms: formData.get("acceptRegistrationTerms") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const phoneResult = validateRegistrationPhone(parsed.data.phone);
  if (!phoneResult.ok) {
    return {
      status: "error",
      message: phoneResult.message,
    };
  }

  const documentResult = parseRegistrationDocument(parsed.data.document);
  if (!documentResult.ok) {
    return {
      status: "error",
      message: documentResult.message,
    };
  }

  const company =
    documentResult.document.type === "cnpj"
      ? await fetchBrasilApiCompany(documentResult.document.value)
      : null;

  const supabase = await createClient();
  const { fullName, email, password } = parsed.data;
  const registrationTermsAcceptedAt = new Date().toISOString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        customer_onboarding_flow_version: CUSTOMER_ONBOARDING_FLOW_VERSION,
        full_name: fullName,
        phone: phoneResult.phone,
        registration_document: documentResult.document.value,
        registration_document_type: documentResult.document.type,
        privacy_policy_accepted_at: registrationTermsAcceptedAt,
        registration_terms_accepted_at: registrationTermsAcceptedAt,
        registration_terms_version: REGISTRATION_TERMS_VERSION,
        company_legal_name: company?.legalName ?? null,
        company_trade_name: company?.tradeName ?? null,
        company_postal_code: company?.postalCode ?? null,
        company_street: company?.street ?? null,
        company_number: company?.number ?? null,
        company_complement: company?.complement ?? null,
        company_neighborhood: company?.neighborhood ?? null,
        company_city: company?.city ?? null,
        company_state: company?.state ?? null,
        company_billing_email: company?.billingEmail ?? null,
        company_contact_phone: company?.contactPhone ?? null,
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

  await setPendingSignupOnboarding({
    userId: data.user.id,
    email,
    fullName,
    phone: phoneResult.phone,
    documentType: documentResult.document.type,
    documentValue: documentResult.document.value,
    company,
    registrationTermsAcceptedAt,
    flowVersion: CUSTOMER_ONBOARDING_FLOW_VERSION,
  });

  await safelySendWelcomeEmail({
    email,
    fullName,
  });

  if (!data.session) {
    return {
      status: "success",
      message:
        "Conta criada. Entre novamente para continuar o onboarding inicial da sua conta.",
    };
  }

  redirect("/onboarding");
}

export async function completeCustomerOnboardingAction(
  _: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const pendingOnboarding =
    (await getPendingSignupOnboarding()) ?? (await buildPendingOnboardingFromCurrentUser());

  if (!pendingOnboarding) {
    return {
      status: "error",
      message:
        "Não encontramos o onboarding pendente desta conta. Refaça o cadastro ou entre novamente para continuar.",
    };
  }

  const parsed = completeOnboardingSchema.safeParse({
    workspaceName: formData.get("workspaceName"),
    profession: formData.get("profession"),
    postalCode: formData.get("postalCode"),
    addressNumber: formData.get("addressNumber"),
    addressComplement: formData.get("addressComplement"),
    hasNoComplement: formData.get("hasNoComplement") === "on",
    referralSource: formData.get("referralSource"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const addressResult = validateOnboardingAddress({
    postalCode: parsed.data.postalCode,
    number: parsed.data.addressNumber,
    complement: parsed.data.addressComplement,
    hasNoComplement: parsed.data.hasNoComplement,
  });

  if (!addressResult.ok) {
    return {
      status: "error",
      message: addressResult.message,
    };
  }

  const requestHeaders = await headers();
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.id !== pendingOnboarding.userId) {
    await clearPendingSignupOnboarding();
    await supabase.auth.signOut();

    return {
      status: "error",
      message:
        "Encontramos um conflito de sessão durante o onboarding. Entre novamente para concluir o cadastro.",
    };
  }

  const { data: authUserResponse, error: authUserError } =
    await admin.auth.admin.getUserById(pendingOnboarding.userId);

  if (authUserError || !authUserResponse.user) {
    return {
      status: "error",
      message:
        "Não foi possível recuperar os dados da conta para concluir o onboarding agora.",
    };
  }

  const profilePayload = {
    full_name: pendingOnboarding.fullName,
    cpf:
      pendingOnboarding.documentType === "cpf"
        ? pendingOnboarding.documentValue
        : null,
    phone: pendingOnboarding.phone,
    profession: parsed.data.profession,
    postal_code: addressResult.address.postalCode,
    address_number: addressResult.address.number,
    address_complement: addressResult.address.complement,
  };

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update(profilePayload)
    .eq("id", pendingOnboarding.userId);

  if (profileUpdateError) {
    if (hasMissingOnboardingProfileFieldsError(profileUpdateError)) {
      return {
        status: "error",
        message:
          "O onboarding ainda não pode ser concluído porque a migration nova do perfil não foi aplicada no banco.",
      };
    }

    return {
      status: "error",
      message: "Não foi possível salvar os dados do perfil agora.",
    };
  }

  const organizationResult = await upsertCustomerOrganization({
    userId: pendingOnboarding.userId,
    workspaceName: parsed.data.workspaceName,
    documentType: pendingOnboarding.documentType,
    documentValue: pendingOnboarding.documentValue,
    phone: pendingOnboarding.phone,
    email: pendingOnboarding.email,
    address: addressResult.address,
    company: pendingOnboarding.company,
  });

  if (!organizationResult.ok) {
    return {
      status: "error",
      message: organizationResult.message,
    };
  }

  const completedAt = new Date().toISOString();
  const ipAddress = getRequestIp(requestHeaders);
  const userAgent = requestHeaders.get("user-agent");
  const existingMetadata = authUserResponse.user.user_metadata ?? {};
  const referralSource = normalizeOptionalString(parsed.data.referralSource);

  const { error: auditError } = await admin.from("audit_logs").insert({
    action: "customer_onboarding_completed",
    entity: "customer_onboarding",
    metadata: {
      completed_at: completedAt,
      customer_onboarding_flow_version: pendingOnboarding.flowVersion,
      full_name: pendingOnboarding.fullName,
      phone: pendingOnboarding.phone,
      document_type: pendingOnboarding.documentType,
      profession: parsed.data.profession,
      workspace_name: parsed.data.workspaceName,
      postal_code: addressResult.address.postalCode,
      address_number: addressResult.address.number,
      address_complement: addressResult.address.complement,
      referral_source: referralSource,
      ip_address: ipAddress,
      user_agent: userAgent,
      registration_terms_accepted_at:
        pendingOnboarding.registrationTermsAcceptedAt,
      registration_terms_version: REGISTRATION_TERMS_VERSION,
    },
    organization_id: organizationResult.organizationId,
    user_id: pendingOnboarding.userId,
  });

  if (auditError) {
    return {
      status: "error",
      message:
        "Não foi possível registrar a trilha do onboarding agora. Tente novamente em instantes.",
    };
  }

  const { error: updateUserError } = await admin.auth.admin.updateUserById(
    pendingOnboarding.userId,
    {
      user_metadata: {
        ...existingMetadata,
        full_name: pendingOnboarding.fullName,
        phone: pendingOnboarding.phone,
        registration_document: pendingOnboarding.documentValue,
        registration_document_type: pendingOnboarding.documentType,
        customer_onboarding_completed_at: completedAt,
        customer_onboarding_flow_version: pendingOnboarding.flowVersion,
        workspace_name: parsed.data.workspaceName,
        profession: parsed.data.profession,
        referral_source: referralSource,
      },
    },
  );

  if (updateUserError) {
    return {
      status: "error",
      message:
        "Não foi possível concluir o onboarding da conta agora. Tente novamente em instantes.",
    };
  }

  await clearPendingSignupOnboarding();

  return {
    status: "success",
    message: "Onboarding concluído.",
  };
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
      const recoveryUrl = buildSupabaseAuthConfirmUrl({
        appUrl,
        hashedToken: data.properties.hashed_token,
        nextPath: "/auth/reset-password",
        type: "recovery",
      });

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
