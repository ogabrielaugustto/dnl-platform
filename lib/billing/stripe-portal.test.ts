import assert from "node:assert/strict";
import test from "node:test";

const {
  buildBillingPortalSessionParams,
}: typeof import("./stripe-portal") = await import(
  new URL("./stripe-portal.ts", import.meta.url).href
);

test("builds a Stripe billing portal session for an existing customer", () => {
  assert.deepEqual(
    buildBillingPortalSessionParams({
      appUrl: "https://app.direitonalente.com.br/",
      customerId: "cus_123",
    }),
    {
      customer: "cus_123",
      return_url: "https://app.direitonalente.com.br/billing",
    },
  );
});
