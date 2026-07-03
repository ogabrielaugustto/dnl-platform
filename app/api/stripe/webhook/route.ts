import type Stripe from "stripe";
import {
  registerStripeWebhookEvent,
  syncCheckoutSession,
  upsertStripeSubscription,
} from "@/lib/billing/stripe-sync";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/server";

export const runtime = "nodejs";

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

function getInvoiceSubscriptionId(invoice: InvoiceWithSubscription) {
  if (typeof invoice.subscription === "string") {
    return invoice.subscription;
  }

  return invoice.subscription?.id ?? null;
}

async function syncInvoiceSubscription(invoice: InvoiceWithSubscription) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertStripeSubscription(subscription);
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    const shouldProcess = await registerStripeWebhookEvent(event);

    if (!shouldProcess) {
      return Response.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await syncInvoiceSubscription(event.data.object as InvoiceWithSubscription);
        break;
    }
  } catch (error) {
    console.error("stripe_webhook_processing_failed", error);
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
