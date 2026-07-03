import assert from "node:assert/strict";
import test from "node:test";

const {
  buildSubscriptionCheckoutLineItem,
}: typeof import("./stripe-checkout") = await import(
  new URL("./stripe-checkout.ts", import.meta.url).href
);

test("builds a recurring Stripe line item from the database plan", () => {
  assert.deepEqual(
    buildSubscriptionCheckoutLineItem({
      code: "basic",
      name: "Basic",
      description: "Plano inicial",
      priceCents: 19700,
      currency: "BRL",
      billingInterval: "monthly",
    }),
    {
      price_data: {
        currency: "brl",
        product_data: {
          description: "Plano inicial",
          metadata: {
            planCode: "basic",
          },
          name: "Basic",
        },
        recurring: {
          interval: "month",
        },
        unit_amount: 19700,
      },
      quantity: 1,
    },
  );
});

test("rejects non-monthly or free plans for subscription checkout", () => {
  assert.throws(
    () =>
      buildSubscriptionCheckoutLineItem({
        code: "custom",
        name: "Custom",
        description: "Contato comercial",
        priceCents: null,
        currency: "BRL",
        billingInterval: "monthly",
      }),
    /plano selecionavel/i,
  );

  assert.throws(
    () =>
      buildSubscriptionCheckoutLineItem({
        code: "basic",
        name: "Basic",
        description: "Plano anual",
        priceCents: 19700,
        currency: "BRL",
        billingInterval: "yearly",
      }),
    /mensal/i,
  );
});
