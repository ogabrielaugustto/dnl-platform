import "server-only";

import type Stripe from "stripe";
import { mapStripeSubscriptionStatus } from "@/lib/billing/subscriptions";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

type StripeSubscriptionWithPeriod = Stripe.Subscription & {
  current_period_end?: number;
  current_period_start?: number;
};

function toIsoDate(seconds: number | null | undefined) {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

async function findPlanIdForSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const planCode = subscription.metadata.planCode;

  if (!planCode) {
    throw new Error("Assinatura Stripe sem codigo de plano nos metadados.");
  }

  const { data, error } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("code", planCode)
    .eq("is_active", true)
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    throw new Error("Plano local nao encontrado para a assinatura Stripe.");
  }

  return data.id;
}

async function findOrganizationIdForSubscription(
  subscription: Stripe.Subscription,
  fallbackOrganizationId?: string | null,
) {
  const metadataOrganizationId = subscription.metadata.organizationId;

  if (metadataOrganizationId) {
    return metadataOrganizationId;
  }

  if (fallbackOrganizationId) {
    return fallbackOrganizationId;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_subscriptions")
    .select("organization_id")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle<{ organization_id: string }>();

  if (!data?.organization_id) {
    throw new Error("Nao foi possivel identificar a organizacao da assinatura Stripe.");
  }

  return data.organization_id;
}

export async function upsertStripeSubscription(
  subscription: Stripe.Subscription,
  fallbackOrganizationId?: string | null,
) {
  const admin = createAdminClient();
  const typedSubscription = subscription as StripeSubscriptionWithPeriod;
  const organizationId = await findOrganizationIdForSubscription(
    subscription,
    fallbackOrganizationId,
  );
  const planId = await findPlanIdForSubscription(subscription);
  const status = mapStripeSubscriptionStatus(subscription.status);
  const payload = {
    organization_id: organizationId,
    plan_id: planId,
    status,
    provider: "stripe",
    provider_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    provider_subscription_id: subscription.id,
    current_period_started_at: toIsoDate(typedSubscription.current_period_start),
    current_period_ends_at: toIsoDate(typedSubscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    canceled_at: toIsoDate(subscription.canceled_at),
  };

  const { data: existingByProvider } = await admin
    .from("organization_subscriptions")
    .select("id")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle<{ id: string }>();

  if (existingByProvider?.id) {
    const { error } = await admin
      .from("organization_subscriptions")
      .update(payload)
      .eq("id", existingByProvider.id);

    if (error) {
      throw new Error("Nao foi possivel atualizar a assinatura Stripe.");
    }

    return;
  }

  const { data: existingByOrganization } = await admin
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingByOrganization?.id) {
    const { error } = await admin
      .from("organization_subscriptions")
      .update(payload)
      .eq("id", existingByOrganization.id);

    if (error) {
      throw new Error("Nao foi possivel vincular a assinatura Stripe a organizacao.");
    }

    return;
  }

  const { error } = await admin.from("organization_subscriptions").insert(payload);

  if (error) {
    throw new Error("Nao foi possivel criar a assinatura Stripe local.");
  }
}

export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  if (!session.subscription) {
    throw new Error("Checkout Stripe sem assinatura vinculada.");
  }

  const stripe = getStripeClient();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertStripeSubscription(
    subscription,
    session.metadata?.organizationId ?? session.client_reference_id,
  );
}

export async function syncCheckoutSessionById(sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  await syncCheckoutSession(session);
}

export async function registerStripeWebhookEvent(event: Stripe.Event) {
  const admin = createAdminClient();
  const { error } = await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  if (!error) {
    return true;
  }

  if ((error as { code?: string }).code === "23505") {
    return false;
  }

  throw new Error("Nao foi possivel registrar o webhook Stripe.");
}
