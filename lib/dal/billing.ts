import "server-only";

import { redirect } from "next/navigation";
import { requirePanelAccess } from "@/lib/auth";
import {
  type BillingPlanCode,
  type BillingPlanDefinition,
  BILLING_PLAN_CODES,
  LISTED_BILLING_PLAN_CODES,
  getSelectableBillingPlanFromPlans,
  normalizeBillingPlanRows,
  type BillingPlanRow,
} from "@/lib/billing/plans";
import {
  getBillingAccessState,
  type BillingAccessState,
  type LocalSubscriptionStatus,
} from "@/lib/billing/subscriptions";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";

type OrganizationSubscriptionRow = {
  id: string;
  organization_id: string;
  status: LocalSubscriptionStatus | string;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  current_period_started_at: string | null;
  current_period_ends_at: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  subscription_plans: {
    code: string;
    name: string;
    price_cents: number;
    currency: string;
    billing_interval: string;
  } | null;
};

type OrganizationBillingRow = {
  id: string;
  name: string;
  billing_email: string | null;
};

export type BillingSubscription = {
  id: string;
  organizationId: string;
  status: string;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodStartedAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  planCode: string | null;
  planName: string | null;
};

export type BillingPageData = {
  organization: {
    id: string;
    name: string;
    billingEmail: string | null;
  };
  plans: BillingPlanDefinition[];
  subscription: BillingSubscription | null;
  access: BillingAccessState;
};

const billingPlanSelect =
  "id, code, name, description, price_cents, currency, billing_interval, is_active";

function normalizeSubscription(row: OrganizationSubscriptionRow): BillingSubscription {
  return {
    id: row.id,
    organizationId: row.organization_id,
    status: row.status,
    provider: row.provider,
    providerCustomerId: row.provider_customer_id,
    providerSubscriptionId: row.provider_subscription_id,
    currentPeriodStartedAt: row.current_period_started_at,
    currentPeriodEndsAt: row.current_period_ends_at,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    canceledAt: row.canceled_at,
    planCode: row.subscription_plans?.code ?? null,
    planName: row.subscription_plans?.name ?? null,
  };
}

export async function getCurrentOrganizationSubscription(
  organizationId: string,
): Promise<BillingSubscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      "id, organization_id, status, provider, provider_customer_id, provider_subscription_id, current_period_started_at, current_period_ends_at, cancel_at_period_end, canceled_at, subscription_plans(code, name, price_cents, currency, billing_interval)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<OrganizationSubscriptionRow>();

  if (error) {
    throw new Error("Nao foi possivel carregar a assinatura da organizacao.");
  }

  return data ? normalizeSubscription(data) : null;
}

export async function getClientBillingPageData(): Promise<BillingPageData> {
  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id, name, billing_email")
    .eq("id", membership.organizationId)
    .maybeSingle<OrganizationBillingRow>();

  if (error || !organization) {
    throw new Error("Nao foi possivel carregar a organizacao para faturamento.");
  }

  const subscription = await getCurrentOrganizationSubscription(organization.id);
  const plans = await listBillingPlansFromDatabase();

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      billingEmail: organization.billing_email,
    },
    plans,
    subscription,
    access: getBillingAccessState(subscription),
  };
}

export async function listBillingPlansFromDatabase() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_plans")
    .select(billingPlanSelect)
    .in("code", [...LISTED_BILLING_PLAN_CODES])
    .order("price_cents", { ascending: true })
    .returns<BillingPlanRow[]>();

  if (error) {
    throw new Error("Nao foi possivel carregar os planos de assinatura.");
  }

  return normalizeBillingPlanRows(data ?? []);
}

export async function getSelectableBillingPlanFromDatabase(
  code: string | null | undefined,
) {
  const plans = await listBillingPlansFromDatabase();
  return getSelectableBillingPlanFromPlans(plans, code);
}

export async function getOrganizationStripeCustomerId(organizationId: string) {
  const subscription = await getCurrentOrganizationSubscription(organizationId);
  return subscription?.providerCustomerId ?? null;
}

export async function requireOperationalBillingAccess(organizationId: string) {
  const subscription = await getCurrentOrganizationSubscription(organizationId);
  const access = getBillingAccessState(subscription);

  if (!access.hasAccess) {
    redirect(`/billing?reason=${access.reason}`);
  }
}

export async function resolvePreferredPlan(code: string | null | undefined) {
  if (!BILLING_PLAN_CODES.includes(code as BillingPlanCode)) {
    return null;
  }

  const plan = await getSelectableBillingPlanFromDatabase(code);
  return plan?.isSelectable ? (plan.code as BillingPlanCode) : null;
}
