"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/server";
import {
  type AppPanel,
  type AuthContext,
  getDefaultPanelPath,
} from "@/lib/auth";

type AuthActionState = {
  message?: string;
  status?: "error" | "success";
};

const loginSchema = z.object({
  email: z.email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
  panel: z.enum(["client", "admin"]),
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo."),
    organizationName: z
      .string()
      .trim()
      .min(2, "Informe o nome da organizacao."),
    email: z.email("Informe um e-mail valido."),
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "Confirme sua senha com pelo menos 8 caracteres."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

async function getActionContext(): Promise<AuthContext | null> {
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
      .select("email, full_name, avatar_url, system_role")
      .eq("id", user.id)
      .maybeSingle<{
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
        system_role: "user" | "admin" | "super_admin";
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
    isAdmin: systemRole === "admin" || systemRole === "super_admin",
    membership,
    organizations,
  };
}

async function ensureCustomerWorkspace(
  organizationName?: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const context = await getActionContext();

  if (!context) {
    return { ok: false, message: "Sessao nao encontrada apos a autenticacao." };
  }

  if (context.membership || context.isAdmin) {
    return { ok: true };
  }

  const normalizedOrganizationName =
    organizationName?.trim() ||
    context.fullName?.trim() ||
    "Minha organizacao";

  const { error } = await supabase.rpc("create_organization", {
    organization_name: normalizedOrganizationName,
    organization_document: null,
    organization_billing_email: context.email,
  });

  if (error) {
    return {
      ok: false,
      message:
        "Nao foi possivel criar a organizacao inicial da conta. Tente novamente.",
    };
  }

  return { ok: true };
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
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const supabase = await createClient();
  const { email, password, panel } = parsed.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: "Email ou senha invalidos.",
    };
  }

  const workspaceResult = await ensureCustomerWorkspace();

  if (!workspaceResult.ok) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: workspaceResult.message,
    };
  }

  const context = await getActionContext();

  if (!context) {
    return {
      status: "error",
      message: "Nao foi possivel carregar o contexto da conta autenticada.",
    };
  }

  if (panel === "admin" && !context.isAdmin) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Esta conta nao possui acesso ao painel administrativo.",
    };
  }

  if (panel === "client" && !context.membership) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Esta conta ainda nao possui uma organizacao vinculada.",
    };
  }

  redirect(getPanelRedirect(panel, context));
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
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const supabase = await createClient();
  const { fullName, organizationName, email, password } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("already registered")
        ? "Ja existe uma conta com este e-mail."
        : "Nao foi possivel concluir o cadastro.",
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Conta criada com sucesso. Confirme seu e-mail e depois faca login.",
    };
  }

  const workspaceResult = await ensureCustomerWorkspace(organizationName);

  if (!workspaceResult.ok) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: workspaceResult.message,
    };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
