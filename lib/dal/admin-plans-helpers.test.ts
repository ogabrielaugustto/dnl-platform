import assert from "node:assert/strict";
import test from "node:test";

const {
  parseAdminPlanForm,
}: typeof import("./admin-plans-helpers") = await import(
  new URL("./admin-plans-helpers.ts", import.meta.url).href
);

test("parseAdminPlanForm converts editable plan fields into database values", () => {
  const formData = new FormData();
  formData.set("planId", "2b5c6df4-6a7b-4f7b-bd30-05d06a6b65b5");
  formData.set("name", "Plano Growth");
  formData.set("description", "Monitoramento para times em crescimento.");
  formData.set("price", "299,90");
  formData.set("billingInterval", "monthly");
  formData.set("maxAssets", "500");
  formData.set("maxTeamMembers", "");
  formData.set("scanFrequencyCap", "weekly");
  formData.set("isActive", "true");

  const parsed = parseAdminPlanForm(formData);

  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, {
    planId: "2b5c6df4-6a7b-4f7b-bd30-05d06a6b65b5",
    values: {
      name: "Plano Growth",
      description: "Monitoramento para times em crescimento.",
      price_cents: 29990,
      currency: "BRL",
      billing_interval: "monthly",
      max_assets: 500,
      max_team_members: null,
      scan_frequency_cap: "weekly",
      is_active: true,
    },
  });
});

test("parseAdminPlanForm rejects invalid money and non-positive limits", () => {
  const formData = new FormData();
  formData.set("planId", "2b5c6df4-6a7b-4f7b-bd30-05d06a6b65b5");
  formData.set("name", "AB");
  formData.set("description", "");
  formData.set("price", "-1");
  formData.set("billingInterval", "monthly");
  formData.set("maxAssets", "0");
  formData.set("maxTeamMembers", "-2");
  formData.set("scanFrequencyCap", "daily");
  formData.set("isActive", "true");

  const parsed = parseAdminPlanForm(formData);

  assert.equal(parsed.success, false);
  assert.equal(parsed.message, "Informe um nome com pelo menos 3 caracteres.");
});
