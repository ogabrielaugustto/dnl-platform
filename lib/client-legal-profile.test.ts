import assert from "node:assert/strict";
import test from "node:test";

const {
  formatCpf,
  normalizeCpf,
  validateClientLegalProfile,
} = await import(new URL("./client-legal-profile.ts", import.meta.url).href);

test("validates a complete client legal profile and formats cpf", () => {
  const result = validateClientLegalProfile({
    fullName: "  Andre   Cabral ",
    cpf: "12345678909",
    signerRole: "Fotografo profissional",
    signingCity: " Sao Paulo ",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.profile.fullName, "Andre Cabral");
  assert.equal(result.profile.cpf, "12345678909");
  assert.equal(result.profile.formattedCpf, "123.456.789-09");
  assert.equal(result.profile.signerRole, "Fotografo profissional");
  assert.equal(result.profile.signingCity, "Sao Paulo");
});

test("rejects invalid cpf values for the client legal profile", () => {
  const result = validateClientLegalProfile({
    fullName: "Andre Cabral",
    cpf: "111.111.111-11",
    signerRole: "Fotografo profissional",
    signingCity: "Sao Paulo",
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.message, "Informe um CPF valido para o signatario.");
});

test("normalizes and formats cpf helper values", () => {
  assert.equal(normalizeCpf("123.456.789-09"), "12345678909");
  assert.equal(formatCpf("12345678909"), "123.456.789-09");
});
