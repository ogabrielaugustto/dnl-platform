import assert from "node:assert/strict";
import test from "node:test";

const communications = await import(
  new URL("./admin-case-communications.ts", import.meta.url).href
);
const workflow = await import(new URL("./admin-case-workflow.ts", import.meta.url).href);

const context = {
  casePublicId: 123,
  casePublicIdLabel: "000123",
  clientName: "Cliente Exemplo",
  domain: "example.com",
  sourceUrl: "https://example.com/noticia",
  finalUrl: "https://example.com/noticia-final",
  assetTitle: "Foto editorial",
  notifiedName: "Empresa Notificada",
  notifiedEmail: "juridico@example.com",
};

test("builds an editable draft for every communication action", () => {
  const expectedKinds = new Map([
    ["first_communication", "first_notice"],
    ["documentation_notice", "documentation_notice"],
    ["c1", "c1"],
    ["c1p", "c1p"],
    ["c2", "c2"],
  ]);

  for (const [actionKind, communicationKind] of expectedKinds) {
    const draft = communications.buildAdminCaseCommunicationDraft(
      actionKind,
      context,
      workflow.buildCaseCommunicationSnapshot,
    );

    assert.equal(draft.actionKind, actionKind);
    assert.equal(draft.communicationKind, communicationKind);
    assert.equal(draft.to, "juridico@example.com");
    assert.match(draft.subject, /000123/);
    assert.match(draft.body, /example\.com/);
  }
});

test("selects only available documentation attachments in the legal order", () => {
  const selected = communications.selectCommunicationAttachmentPreviews([
    {
      id: "metadata-1",
      kind: "metadata",
      title: "Metadados técnicos",
      fileName: "metadados.json",
      source: "case_document",
      status: "attached",
      available: true,
    },
    {
      id: "receipt-1",
      kind: "receipt",
      title: "Comprovante",
      fileName: "recibo.pdf",
      source: "case_document",
      status: "attached",
      available: true,
    },
    {
      id: "rhf-1",
      kind: "rhf",
      title: "RHF assinado",
      fileName: null,
      source: "rights_ownership_confirmation",
      status: "signed",
      available: true,
    },
    {
      id: "soa-1",
      kind: "soa",
      title: "SOA assinado",
      fileName: null,
      source: "client_representation_document",
      status: "signed",
      available: true,
    },
    {
      id: "proof-1",
      kind: "proofdata",
      title: "Prova técnica",
      fileName: "prova.pdf",
      source: "case_document",
      status: "attached",
      available: true,
    },
  ]);

  assert.deepEqual(
    selected.map((item: { kind: string }) => item.kind),
    ["rhf", "soa", "proofdata", "metadata"],
  );
});

test("rejects an attachment over 10 MB", () => {
  assert.throws(
    () =>
      communications.validateCommunicationAttachmentSizes([
        { filename: "prova.pdf", sizeBytes: 10 * 1024 * 1024 + 1 },
      ]),
    /10 MB/,
  );
});

test("rejects attachments over the 35 MB message budget", () => {
  assert.throws(
    () =>
      communications.validateCommunicationAttachmentSizes([
        { filename: "a.pdf", sizeBytes: 9 * 1024 * 1024 },
        { filename: "b.pdf", sizeBytes: 9 * 1024 * 1024 },
        { filename: "c.pdf", sizeBytes: 9 * 1024 * 1024 },
        { filename: "d.pdf", sizeBytes: 9 * 1024 * 1024 },
      ]),
    /35 MB/,
  );
});

test("accepts attachments within individual and total limits", () => {
  const result = communications.validateCommunicationAttachmentSizes([
    { filename: "rhf.html", sizeBytes: 2_000 },
    { filename: "prova.pdf", sizeBytes: 8 * 1024 * 1024 },
  ]);

  assert.equal(result.totalSizeBytes, 8 * 1024 * 1024 + 2_000);
});
