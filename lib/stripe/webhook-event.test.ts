import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";

const {
  constructStripeWebhookEvent,
}: typeof import("./webhook-event") = await import(
  new URL("./webhook-event.ts", import.meta.url).href
);

const payload = JSON.stringify({
  data: {
    object: {},
  },
  id: "evt_test",
  object: "event",
  type: "customer.subscription.updated",
});

test("constructs a Stripe webhook event with the first matching configured secret", () => {
  const stripe = new Stripe("sk_test_123");
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_cli",
  });

  const event = constructStripeWebhookEvent({
    payload,
    secrets: ["whsec_dashboard", "whsec_cli"],
    signature,
    stripe,
  });

  assert.equal(event?.id, "evt_test");
});

test("returns null when no configured Stripe webhook secret matches", () => {
  const stripe = new Stripe("sk_test_123");
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: "whsec_cli",
  });

  const event = constructStripeWebhookEvent({
    payload,
    secrets: ["whsec_dashboard"],
    signature,
    stripe,
  });

  assert.equal(event, null);
});
