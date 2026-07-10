import assert from "node:assert/strict";
import test from "node:test";

const {
  normalizeStripeWebhookSecrets,
}: typeof import("./webhook-secrets") = await import(
  new URL("./webhook-secrets.ts", import.meta.url).href
);

test("normalizes configured Stripe webhook secrets", () => {
  assert.deepEqual(
    normalizeStripeWebhookSecrets({
      STRIPE_WEBHOOK_SECRET: " whsec_dashboard ",
      STRIPE_CLI_WEBHOOK_SECRET: "whsec_cli",
    }),
    ["whsec_dashboard", "whsec_cli"],
  );
});

test("deduplicates Stripe webhook secrets and ignores blanks", () => {
  assert.deepEqual(
    normalizeStripeWebhookSecrets({
      STRIPE_WEBHOOK_SECRET: "whsec_same",
      STRIPE_CLI_WEBHOOK_SECRET: " whsec_same ",
    }),
    ["whsec_same"],
  );

  assert.deepEqual(
    normalizeStripeWebhookSecrets({
      STRIPE_WEBHOOK_SECRET: " ",
      STRIPE_CLI_WEBHOOK_SECRET: "",
    }),
    [],
  );
});
