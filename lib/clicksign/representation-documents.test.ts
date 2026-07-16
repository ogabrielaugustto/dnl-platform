import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

const representationDocuments = await import(
  new URL("./representation-documents.ts", import.meta.url).href
);

test("builds SOA template data with the exact Clicksign variables", () => {
  const templateData = representationDocuments.buildSoaTemplateData({
    fullName: "  Ana Maria Souza  ",
    maritalStatus: " solteira ",
    cpf: "12345678909",
    address: " Rua das Flores, 123 - Sao Paulo/SP ",
    dnlCnpj: "12.345.678/0001-90",
    signedAt: new Date("2026-07-16T15:00:00-03:00"),
  });

  assert.deepEqual(templateData, {
    NOME_COMPLETO: "Ana Maria Souza",
    ESTADO_CIVIL: "solteira",
    DOCUMENTO: "123.456.789-09",
    ENDERECO: "Rua das Flores, 123 - Sao Paulo/SP",
    CNPJ_DNL: "12.345.678/0001-90",
    DIA: "16",
    MES: "julho",
  });
});

test("validates SOA signer data before creating a Clicksign envelope", () => {
  const result = representationDocuments.validateSoaSignatureRequest({
    fullName: "Ana Maria Souza",
    email: "ana@example.com",
    cpf: "123.456.789-09",
    maritalStatus: "solteira",
    address: "Rua das Flores, 123 - Sao Paulo/SP",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.cpf, "12345678909");
    assert.equal(result.data.email, "ana@example.com");
  }
});

test("rejects invalid SOA signer CPF", () => {
  const result = representationDocuments.validateSoaSignatureRequest({
    fullName: "Ana Maria Souza",
    email: "ana@example.com",
    cpf: "111.111.111-11",
    maritalStatus: "solteira",
    address: "Rua das Flores, 123 - Sao Paulo/SP",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, "Informe um CPF valido para gerar o SOA.");
  }
});

test("detects when upload must be blocked by missing or pending SOA", () => {
  assert.equal(representationDocuments.getRepresentationUploadBlockReason(null), "missing");
  assert.equal(
    representationDocuments.getRepresentationUploadBlockReason({
      status: "signature_requested",
    }),
    "pending",
  );
  assert.equal(
    representationDocuments.getRepresentationUploadBlockReason({ status: "signed" }),
    null,
  );
});

test("verifies Clicksign Content-Hmac and x-clicksign-signature headers", () => {
  const rawBody = JSON.stringify({ event: { name: "document_closed" } });
  const digest = createHmac("sha256", "top-secret").update(rawBody).digest("hex");

  assert.equal(
    representationDocuments.verifyClicksignWebhookSignature(
      rawBody,
      `sha256=${digest}`,
      "top-secret",
    ),
    true,
  );
  assert.equal(
    representationDocuments.verifyClicksignWebhookSignature(
      rawBody,
      digest,
      "top-secret",
    ),
    true,
  );
  assert.equal(
    representationDocuments.verifyClicksignWebhookSignature(
      rawBody,
      "sha256=invalid",
      "top-secret",
    ),
    false,
  );
});

test("maps Clicksign webhook events into internal representation statuses", () => {
  assert.equal(
    representationDocuments.mapClicksignWebhookStatus({
      eventName: "document_closed",
      envelopeStatus: "closed",
      documentStatus: "closed",
    }),
    "signed",
  );
  assert.equal(
    representationDocuments.mapClicksignWebhookStatus({
      eventName: "document_refused",
      envelopeStatus: "running",
      documentStatus: "refused",
    }),
    "rejected",
  );
});

test("extracts Clicksign envelope and document identifiers from nested webhook payloads", () => {
  const ids = representationDocuments.extractClicksignWebhookIdentifiers({
    event: {
      data: {
        envelope: { id: "env_123" },
        document: { key: "doc_456" },
      },
    },
  });

  assert.deepEqual(ids, {
    envelopeId: "env_123",
    documentId: "doc_456",
  });
});
