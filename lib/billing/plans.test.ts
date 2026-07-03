import assert from "node:assert/strict";
import test from "node:test";

const {
  BILLING_PLAN_CODES,
  formatPlanPrice,
  getSelectableBillingPlanFromRows,
  normalizeBillingPlanRows,
}: typeof import("./plans") = await import(
  new URL("./plans.ts", import.meta.url).href
);

const planRows = [
  {
    id: "plan-basic",
    code: "basic",
    name: "Basic",
    description: "Plano inicial vindo do banco.",
    price_cents: 19700,
    currency: "BRL",
    billing_interval: "monthly",
    is_active: true,
  },
  {
    id: "plan-professional",
    code: "professional",
    name: "Profissional",
    description: "Plano profissional vindo do banco.",
    price_cents: 39700,
    currency: "BRL",
    billing_interval: "monthly",
    is_active: true,
  },
  {
    id: "plan-custom",
    code: "custom",
    name: "Custom",
    description: "Plano customizado vindo do banco.",
    price_cents: 0,
    currency: "BRL",
    billing_interval: "monthly",
    is_active: false,
  },
] as const;

test("normalizes Basic, Profissional, and Custom plans from database rows", () => {
  const plans = normalizeBillingPlanRows(planRows);

  assert.deepEqual(
    plans.map((plan) => plan.code),
    ["basic", "professional", "custom"],
  );
  assert.equal(plans[0]?.name, "Basic");
  assert.equal(plans[0]?.priceCents, 19700);
  assert.equal(plans[0]?.description, "Plano inicial vindo do banco.");
  assert.equal(plans[1]?.name, "Profissional");
  assert.equal(plans[1]?.priceCents, 39700);
  assert.equal(plans[2]?.isComingSoon, true);
  assert.equal(plans[2]?.priceCents, null);
});

test("formats monthly plan prices in Brazilian reais", () => {
  assert.equal(formatPlanPrice(19700), "R$ 197");
  assert.equal(formatPlanPrice(39700), "R$ 397");
});

test("only Basic and Profissional are selectable", () => {
  assert.deepEqual(BILLING_PLAN_CODES, ["basic", "professional"]);
  assert.equal(getSelectableBillingPlanFromRows(planRows, "basic")?.code, "basic");
  assert.equal(
    getSelectableBillingPlanFromRows(planRows, "professional")?.code,
    "professional",
  );
  assert.equal(getSelectableBillingPlanFromRows(planRows, "custom"), null);
  assert.equal(getSelectableBillingPlanFromRows(planRows, "starter"), null);
});
