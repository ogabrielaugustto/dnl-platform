import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import type { MonitoringRuleFrequency } from "@/lib/dal/assets";
import { createClient } from "@/lib/server";

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

export type AdminClientListItem = {
  id: string;
  name: string;
  billingEmail: string | null;
  isActive: boolean;
  createdAt: string;
  subscriptionStatus: string | null;
  planName: string | null;
  scanFrequency: MonitoringRuleFrequency;
};

export async function listAdminClients(): Promise<AdminClientListItem[]> {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const [{ data: organizations, error: organizationsError }, { data: subscriptions, error: subscriptionsError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, billing_email, is_active, created_at")
        .order("created_at", { ascending: false })
        .returns<OrganizationRow[]>(),
      supabase
        .from("organization_subscriptions")
        .select(
          "id, organization_id, status, scan_frequency_cap_snapshot, subscription_plans(code, name, scan_frequency_cap)",
        )
        .order("created_at", { ascending: false })
        .returns<OrganizationSubscriptionRow[]>(),
    ]);

  if (organizationsError || subscriptionsError) {
    throw new Error("Nao foi possivel carregar os clientes.");
  }

  const subscriptionsByOrganizationId = new Map<string, OrganizationSubscriptionRow>();
  for (const subscription of subscriptions ?? []) {
    if (!subscriptionsByOrganizationId.has(subscription.organization_id)) {
      subscriptionsByOrganizationId.set(subscription.organization_id, subscription);
    }
  }

  return (organizations ?? []).map((organization) => {
    const subscription = subscriptionsByOrganizationId.get(organization.id);

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
    };
  });
}
