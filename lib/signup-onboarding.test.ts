import assert from "node:assert/strict";
import test from "node:test";

const {
  buildPendingSignupOnboardingFromMetadata,
} = await import(new URL("./pending-signup-onboarding.ts", import.meta.url).href);

test("rebuilds pending onboarding state from auth metadata", () => {
  const pending = buildPendingSignupOnboardingFromMetadata({
    userId: "4f39243a-9828-49db-abec-f01d6f63cc4e",
    email: "ana@studio.com",
    userMetadata: {
      customer_onboarding_flow_version: "2026-07-01",
      full_name: "Ana Souza",
      phone: "11998765432",
      registration_document: "11222333000181",
      registration_document_type: "cnpj",
      registration_terms_accepted_at: "2026-07-01T12:00:00.000Z",
      company_legal_name: "Ana Souza Fotografia LTDA",
      company_trade_name: "Studio Ana",
      company_postal_code: "01310100",
      company_street: "Avenida Paulista",
      company_number: "1000",
      company_complement: "10 andar",
      company_neighborhood: "Bela Vista",
      company_city: "Sao Paulo",
      company_state: "SP",
      company_billing_email: "financeiro@studioana.com",
      company_contact_phone: "1133334444",
    },
  });

  assert.deepEqual(pending, {
    userId: "4f39243a-9828-49db-abec-f01d6f63cc4e",
    email: "ana@studio.com",
    fullName: "Ana Souza",
    phone: "11998765432",
    documentType: "cnpj",
    documentValue: "11222333000181",
    company: {
      cnpj: "11222333000181",
      legalName: "Ana Souza Fotografia LTDA",
      tradeName: "Studio Ana",
      postalCode: "01310100",
      street: "Avenida Paulista",
      number: "1000",
      complement: "10 andar",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
      billingEmail: "financeiro@studioana.com",
      contactPhone: "1133334444",
    },
    registrationTermsAcceptedAt: "2026-07-01T12:00:00.000Z",
    flowVersion: "2026-07-01",
  });
});

test("returns null when auth metadata lacks required onboarding fields", () => {
  const pending = buildPendingSignupOnboardingFromMetadata({
    userId: "4f39243a-9828-49db-abec-f01d6f63cc4e",
    email: "ana@studio.com",
    userMetadata: {
      full_name: "Ana Souza",
    },
  });

  assert.equal(pending, null);
});
