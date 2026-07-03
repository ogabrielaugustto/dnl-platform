import assert from "node:assert/strict";
import test from "node:test";

const {
  getBillingAccessState,
  mapStripeSubscriptionStatus,
}: typeof import("./subscriptions") = await import(
  new URL("./subscriptions.ts", import.meta.url).href
);

test("maps Stripe subscription statuses to local subscription statuses", () => {
  assert.equal(mapStripeSubscriptionStatus("trialing"), "trialing");
  assert.equal(mapStripeSubscriptionStatus("active"), "active");
  assert.equal(mapStripeSubscriptionStatus("past_due"), "past_due");
  assert.equal(mapStripeSubscriptionStatus("unpaid"), "unpaid");
  assert.equal(mapStripeSubscriptionStatus("incomplete"), "incomplete");
  assert.equal(mapStripeSubscriptionStatus("canceled"), "cancelled");
  assert.equal(mapStripeSubscriptionStatus("incomplete_expired"), "expired");
  assert.equal(mapStripeSubscriptionStatus("paused"), "paused");
});

test("allows operational access only for trialing or active subscriptions", () => {
  assert.deepEqual(getBillingAccessState(null), {
    hasAccess: false,
    reason: "missing_subscription",
  });
  assert.deepEqual(getBillingAccessState({ status: "trialing" }), {
    hasAccess: true,
    reason: "ok",
  });
  assert.deepEqual(getBillingAccessState({ status: "active" }), {
    hasAccess: true,
    reason: "ok",
  });
  assert.deepEqual(getBillingAccessState({ status: "past_due" }), {
    hasAccess: false,
    reason: "payment_required",
  });
});
