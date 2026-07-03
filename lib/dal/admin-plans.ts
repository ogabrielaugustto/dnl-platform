import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import {
  formatAdminPlanPriceInput,
  type AdminPlanBillingInterval,
  type AdminPlanScanFrequency,
} from "@/lib/dal/admin-plans-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscriptionPlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: AdminPlanBillingInterval;
  max_assets: number | null;
  max_team_members: number | null;
  scan_frequency_cap: AdminPlanScanFrequency | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OrganizationSubscriptionRow = {
  id: string;
  plan_id: string;
  status: string;
};

export type AdminPlanListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceCents: number;
  priceInput: string;
  currency: string;
  billingInterval: AdminPlanBillingInterval;
  maxAssets: number | null;
  maxTeamMembers: number | null;
  scanFrequencyCap: AdminPlanScanFrequency | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalSubscriptions: number;
  activeSubscriptions: number;
};

export async function listAdminPlans(): Promise<AdminPlanListItem[]> {
  await requirePanelAccess("admin");
  const admin = createAdminClient();

  const [plansResponse, subscriptionsResponse] = await Promise.all([
    admin
      .from("subscription_plans")
      .select(
        "id, code, name, description, price_cents, currency, billing_interval, max_assets, max_team_members, scan_frequency_cap, is_active, created_at, updated_at",
      )
      .order("price_cents", { ascending: true })
      .returns<SubscriptionPlanRow[]>(),
    admin
      .from("organization_subscriptions")
      .select("id, plan_id, status")
      .returns<OrganizationSubscriptionRow[]>(),
  ]);

  if (plansResponse.error || subscriptionsResponse.error) {
    throw new Error("Nao foi possivel carregar os planos administrativos.");
  }

  const subscriptionsByPlanId = new Map<string, OrganizationSubscriptionRow[]>();

  for (const subscription of subscriptionsResponse.data ?? []) {
    const current = subscriptionsByPlanId.get(subscription.plan_id) ?? [];
    current.push(subscription);
    subscriptionsByPlanId.set(subscription.plan_id, current);
  }

  return (plansResponse.data ?? []).map((plan) => {
    const subscriptions = subscriptionsByPlanId.get(plan.id) ?? [];

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceCents: plan.price_cents,
      priceInput: formatAdminPlanPriceInput(plan.price_cents),
      currency: plan.currency,
      billingInterval: plan.billing_interval,
      maxAssets: plan.max_assets,
      maxTeamMembers: plan.max_team_members,
      scanFrequencyCap: plan.scan_frequency_cap,
      isActive: plan.is_active,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((subscription) =>
        ["trialing", "active", "past_due", "paused"].includes(subscription.status),
      ).length,
    };
  });
}
