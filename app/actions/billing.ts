"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import { buildSubscriptionCheckoutLineItem } from "@/lib/billing/stripe-checkout";
import { buildBillingPortalSessionParams } from "@/lib/billing/stripe-portal";
import { getBillingAccessState } from "@/lib/billing/subscriptions";
import {
  getCurrentOrganizationSubscription,
  getOrganizationStripeCustomerId,
  getSelectableBillingPlanFromDatabase,
} from "@/lib/dal/billing";
import { getStripeAppUrl, getStripeClient } from "@/lib/stripe/server";
import { createClient } from "@/lib/server";

const checkoutSchema = z.object({
  planCode: z.enum(["basic", "professional"]),
});

type OrganizationCheckoutRow = {
  id: string;
  name: string;
  billing_email: string | null;
};

export async function createBillingCheckoutAction(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    planCode: formData.get("planCode"),
  });

  if (!parsed.success) {
    redirect("/billing?error=invalid-plan");
  }

  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    redirect("/onboarding");
  }

  const plan = await getSelectableBillingPlanFromDatabase(parsed.data.planCode);

  if (!plan) {
    redirect("/billing?error=invalid-plan");
  }

  const currentSubscription = await getCurrentOrganizationSubscription(
    membership.organizationId,
  );

  if (
    currentSubscription?.status === "trialing" ||
    currentSubscription?.status === "active"
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id, name, billing_email")
    .eq("id", membership.organizationId)
    .maybeSingle<OrganizationCheckoutRow>();

  if (error || !organization) {
    redirect("/billing?error=organization");
  }

  const stripe = getStripeClient();
  const appUrl = getStripeAppUrl();
  const existingCustomerId = await getOrganizationStripeCustomerId(organization.id);
  const lineItem = buildSubscriptionCheckoutLineItem(plan);
  const checkoutSession = await stripe.checkout.sessions.create({
    cancel_url: `${appUrl}/billing?checkout=cancelled`,
    client_reference_id: organization.id,
    customer: existingCustomerId ?? undefined,
    customer_email: existingCustomerId
      ? undefined
      : (organization.billing_email ?? context.email ?? undefined),
    line_items: [
      lineItem,
    ],
    metadata: {
      organizationId: organization.id,
      planCode: plan.code,
      userId: context.userId,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        organizationId: organization.id,
        planCode: plan.code,
        userId: context.userId,
      },
      trial_period_days: 7,
    },
    success_url: `${appUrl}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!checkoutSession.url) {
    redirect("/billing?error=checkout");
  }

  redirect(checkoutSession.url);
}

export async function createBillingPortalAction() {
  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    redirect("/onboarding");
  }

  const currentSubscription = await getCurrentOrganizationSubscription(
    membership.organizationId,
  );
  const access = getBillingAccessState(currentSubscription);

  if (!access.hasAccess) {
    redirect(`/billing?reason=${access.reason}`);
  }

  if (!currentSubscription?.providerCustomerId) {
    redirect("/billing?error=portal");
  }

  const stripe = getStripeClient();
  const appUrl = getStripeAppUrl();
  const portalSession = await stripe.billingPortal.sessions.create(
    buildBillingPortalSessionParams({
      appUrl,
      customerId: currentSubscription.providerCustomerId,
    }),
  );

  if (!portalSession.url) {
    redirect("/billing?error=portal");
  }

  redirect(portalSession.url);
}
