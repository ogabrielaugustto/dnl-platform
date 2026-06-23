import "server-only";

import { requirePanelAccess, type OrganizationMemberRole } from "@/lib/auth";
import type { MonitoringRuleFrequency } from "@/lib/dal/assets";
import { createAdminClient } from "@/lib/supabase/admin";

type OrganizationRow = {
  id: string;
  name: string;
  billing_email: string | null;
  is_active: boolean;
  created_at: string;
};

type OrganizationSubscriptionRow = {
  id: string;
  organization_id: string;
  status: string;
  scan_frequency_cap_snapshot: MonitoringRuleFrequency | null;
  subscription_plans: {
    code: string;
    name: string;
    scan_frequency_cap: MonitoringRuleFrequency | null;
  } | null;
};

type MembershipRow = {
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  is_active: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  last_signed_in_at: string | null;
  created_at: string;
  system_role: "user" | "admin" | "super_admin";
};

export type AdminClientAccessListItem = {
  userId: string;
  email: string | null;
  fullName: string | null;
  isActive: boolean;
  role: OrganizationMemberRole;
  createdAt: string;
  lastSignedInAt: string | null;
};

export type AdminClientListItem = {
  id: string;
  name: string;
  billingEmail: string | null;
  isActive: boolean;
  createdAt: string;
  subscriptionStatus: string | null;
  planName: string | null;
  scanFrequency: MonitoringRuleFrequency;
  clientUsers: AdminClientAccessListItem[];
  totalClientUsers: number;
  activeClientUsers: number;
};

export async function listAdminClients(): Promise<AdminClientListItem[]> {
  await requirePanelAccess("admin");
  const admin = createAdminClient();

  const [organizationsResponse, subscriptionsResponse, membershipsResponse] =
    await Promise.all([
      admin
        .from("organizations")
        .select("id, name, billing_email, is_active, created_at")
        .order("created_at", { ascending: false })
        .returns<OrganizationRow[]>(),
      admin
        .from("organization_subscriptions")
        .select(
          "id, organization_id, status, scan_frequency_cap_snapshot, subscription_plans(code, name, scan_frequency_cap)",
        )
        .order("created_at", { ascending: false })
        .returns<OrganizationSubscriptionRow[]>(),
      admin
        .from("organization_members")
        .select("organization_id, user_id, role, is_active, created_at")
        .order("created_at", { ascending: true })
        .returns<MembershipRow[]>(),
    ]);

  if (
    organizationsResponse.error ||
    subscriptionsResponse.error ||
    membershipsResponse.error
  ) {
    throw new Error("Nao foi possivel carregar os clientes.");
  }

  const clientUserIds = Array.from(
    new Set(
      (membershipsResponse.data ?? [])
        .map((membership) => membership.user_id)
        .filter(Boolean),
    ),
  );

  const { data: profiles, error: profilesError } = clientUserIds.length
    ? await admin
        .from("profiles")
        .select("id, email, full_name, is_active, last_signed_in_at, created_at, system_role")
        .in("id", clientUserIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[], error: null };

  if (profilesError) {
    throw new Error("Nao foi possivel carregar os acessos dos clientes.");
  }

  const clientProfilesById = new Map(
    (profiles ?? [])
      .filter((profile) => profile.system_role === "user")
      .map((profile) => [profile.id, profile]),
  );
  const subscriptionsByOrganizationId = new Map<string, OrganizationSubscriptionRow>();
  const membershipsByOrganizationId = new Map<string, AdminClientAccessListItem[]>();

  for (const subscription of subscriptionsResponse.data ?? []) {
    if (!subscriptionsByOrganizationId.has(subscription.organization_id)) {
      subscriptionsByOrganizationId.set(subscription.organization_id, subscription);
    }
  }

  for (const membership of membershipsResponse.data ?? []) {
    const profile = clientProfilesById.get(membership.user_id);

    if (!profile) {
      continue;
    }

    const current = membershipsByOrganizationId.get(membership.organization_id) ?? [];
    current.push({
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      isActive: profile.is_active && membership.is_active,
      role: membership.role,
      createdAt: profile.created_at,
      lastSignedInAt: profile.last_signed_in_at,
    });
    membershipsByOrganizationId.set(membership.organization_id, current);
  }

  return (organizationsResponse.data ?? []).map((organization) => {
    const subscription = subscriptionsByOrganizationId.get(organization.id);
    const clientUsers = membershipsByOrganizationId.get(organization.id) ?? [];

    return {
      id: organization.id,
      name: organization.name,
      billingEmail: organization.billing_email,
      isActive: organization.is_active,
      createdAt: organization.created_at,
      subscriptionStatus: subscription?.status ?? null,
      planName: subscription?.subscription_plans?.name ?? null,
      scanFrequency:
        subscription?.scan_frequency_cap_snapshot ??
        subscription?.subscription_plans?.scan_frequency_cap ??
        "daily",
      clientUsers,
      totalClientUsers: clientUsers.length,
      activeClientUsers: clientUsers.filter((user) => user.isActive).length,
    };
  });
}
