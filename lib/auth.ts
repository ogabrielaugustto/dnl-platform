import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";

export type SystemRole = "user" | "admin" | "super_admin";
export type OrganizationMemberRole = "owner" | "admin" | "member";
export type AppPanel = "client" | "admin";
export const ACTIVE_ORGANIZATION_COOKIE = "dnl_active_organization";

type ProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  system_role: SystemRole;
};

type MembershipRow = {
  organization_id: string;
  role: OrganizationMemberRole;
  organizations: {
    name: string;
  } | null;
};

export type OrganizationMembership = {
  organizationId: string;
  organizationName: string | null;
  role: OrganizationMemberRole;
};

export type AuthContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  systemRole: SystemRole;
  isAdmin: boolean;
  membership: OrganizationMembership | null;
  organizations: OrganizationMembership[];
};

async function readAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, system_role")
      .eq("id", user.id)
      .maybeSingle<ProfileRecord>(),
    supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .returns<MembershipRow[]>(),
  ]);

  const systemRole = profile?.system_role ?? "user";
  const organizations =
    memberships?.map((membership) => ({
      organizationId: membership.organization_id,
      organizationName: membership.organizations?.name ?? null,
      role: membership.role,
    })) ?? [];
  const membership =
    organizations.find(
      (organization) => organization.organizationId === activeOrganizationId,
    ) ?? organizations[0] ?? null;

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

export const getAuthContext = cache(readAuthContext);

export function getDefaultPanelPath(context: AuthContext): string {
  if (context.isAdmin) {
    return "/admin";
  }

  if (context.membership) {
    return "/dashboard";
  }

  return "/auth/login";
}

export async function redirectAuthenticatedUser(panel: AppPanel) {
  const context = await getAuthContext();

  if (!context) {
    return;
  }

  if (panel === "admin") {
    redirect(context.isAdmin ? "/admin" : "/dashboard");
  }

  redirect(getDefaultPanelPath(context));
}

export async function requirePanelAccess(panel: AppPanel): Promise<AuthContext> {
  const context = await getAuthContext();

  if (!context) {
    redirect(panel === "admin" ? "/admin/login" : "/auth/login");
  }

  if (panel === "admin" && !context.isAdmin) {
    redirect(context.membership ? "/dashboard" : "/auth/login");
  }

  if (panel === "client" && !context.membership) {
    redirect(context.isAdmin ? "/admin" : "/auth/login");
  }

  return context;
}
