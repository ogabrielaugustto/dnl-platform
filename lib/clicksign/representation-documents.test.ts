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

test("builds SRA template data with the exact Clicksign variables", () => {
  const templateData = representationDocuments.buildSraTemplateData({
    notifiedLegalName: " Empresa Notificada Ltda ",
    notifiedCnpj: "12.345.678/0001-95",
    notifiedAddress: "Avenida Central, 100 - Sao Paulo/SP",
    notifiedDomain: "example.com",
    notifiedSignerName: "Joao da Silva",
    notifiedSignerRole: "Diretor",
    photographerName: "Ana Maria Souza",
    photographerMaritalStatus: "solteira",
    photographerCpf: "123.456.789-09",
    photographerAddress: "Rua das Flores, 123 - Sao Paulo/SP",
    dnlCnpj: "44.755.191/0001-77",
    caseId: "000123",
    imageIds: ["000456", "000789"],
    amountCents: 150000,
    amountInWords: "mil e quinhentos reais",
    paymentDueDate: "2026-08-10",
    witness1Name: "Maria Oliveira",
    witness1Cpf: "529.982.247-25",
    witness2Name: "",
    witness2Cpf: "",
    agreementDate: new Date("2026-07-23T15:00:00-03:00"),
  });

  assert.deepEqual(templateData, {
    DIA: "23",
    MES: "julho",
    RAZAO_SOCIAL_NOTIFICADO: "Empresa Notificada Ltda",
    CNPJ_NOTIFICADO: "12.345.678/0001-95",
    ENDERECO: "Avenida Central, 100 - Sao Paulo/SP",
    DOMINIO_NOTIFICADO: "example.com",
    NOME_FOTOGRAFO: "Ana Maria Souza",
    ESTADO_CIVIL_FOTOGRAFO: "solteira",
    DOCUMENTO_FOTOGRAFO: "123.456.789-09",
    ENDERECO_FOTOGRAFO: "Rua das Flores, 123 - Sao Paulo/SP",
    CNPJ_DNL: "44.755.191/0001-77",
    ID_CASO: "000123",
    IDS_IMAGEM: "000456, 000789",
    VALOR: "R$ 1.500,00",
    VALOR_EXTENSO: "mil e quinhentos reais",
    DIA_VENCIMENTO: "10",
    MES_VENCIMENTO: "agosto",
    ANO_VENCIMENTO: "2026",
    RAZAO_NOTIFICADO: "Empresa Notificada Ltda",
    NOME_NOTIFICADO: "Joao da Silva",
    CARGO_NOTIFICADO: "Diretor",
    NOME_TESTEMUNHA_1: "Maria Oliveira",
    CPF_TESTEMUNHA_1: "529.982.247-25",
    NOME_TESTEMUNHA_2: "",
    CPF_TESTEMUNHA_2: "",
  });
});

test("accepts an SRA without witnesses", () => {
  const result = representationDocuments.validateSraSignatureRequest({
    notifiedLegalName: "Empresa Notificada Ltda",
    notifiedCnpj: "12.345.678/0001-95",
    notifiedAddress: "Avenida Central, 100 - Sao Paulo/SP",
    notifiedDomain: "example.com",
    notifiedSignerName: "Joao da Silva",
    notifiedSignerEmail: "joao@example.com",
    notifiedSignerCpf: "529.982.247-25",
    notifiedSignerRole: "Diretor",
    photographerName: "Ana Maria Souza",
    photographerMaritalStatus: "solteira",
    photographerCpf: "123.456.789-09",
    photographerAddress: "Rua das Flores, 123 - Sao Paulo/SP",
    dnlCnpj: "44.755.191/0001-77",
    dnlSignerName: "Marcos Andre Cabral",
    dnlSignerEmail: "andre@direitonalente.com.br",
    dnlSignerCpf: "363.350.578-40",
    caseId: "000123",
    imageIds: ["000456"],
    amountCents: 150000,
    amountInWords: "mil e quinhentos reais",
    paymentDueDate: "2026-08-10",
    witness1Name: "",
    witness1Email: "",
    witness1Cpf: "",
    witness2Name: "",
    witness2Email: "",
    witness2Cpf: "",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      representationDocuments
        .buildSraSigners(result.data)
        .map((signer: { kind: string }) => signer.kind),
      ["notified", "dnl"],
    );
  }
});

test("requires every field when an optional SRA witness is provided", () => {
  const result = representationDocuments.validateSraSignatureRequest({
    notifiedLegalName: "Empresa Notificada Ltda",
    notifiedCnpj: "12.345.678/0001-95",
    notifiedAddress: "Avenida Central, 100 - Sao Paulo/SP",
    notifiedDomain: "example.com",
    notifiedSignerName: "Joao da Silva",
    notifiedSignerEmail: "joao@example.com",
    notifiedSignerCpf: "529.982.247-25",
    notifiedSignerRole: "Diretor",
    photographerName: "Ana Maria Souza",
    photographerMaritalStatus: "solteira",
    photographerCpf: "123.456.789-09",
    photographerAddress: "Rua das Flores, 123 - Sao Paulo/SP",
    dnlCnpj: "44.755.191/0001-77",
    dnlSignerName: "Marcos Andre Cabral",
    dnlSignerEmail: "andre@direitonalente.com.br",
    dnlSignerCpf: "363.350.578-40",
    caseId: "000123",
    imageIds: ["000456"],
    amountCents: 150000,
    amountInWords: "mil e quinhentos reais",
    paymentDueDate: "2026-08-10",
    witness1Name: "Maria Oliveira",
    witness1Email: "",
    witness1Cpf: "529.982.247-25",
    witness2Name: "",
    witness2Email: "",
    witness2Cpf: "",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.field, "witness1Email");
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
