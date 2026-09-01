import assert from "node:assert/strict";
import test from "node:test";

import type { CaseCommunicationKind } from "./admin-case-workflow";

const workflow = await import(new URL("./admin-case-workflow.ts", import.meta.url).href);

test("does not require DNL platform documents to send documentation", () => {
  const readiness = workflow.buildCaseWorkflowReadiness({
    stage: "documents",
    documents: [
      {
        kind: "rhf",
        status: "signed",
      },
      {
        kind: "soa",
        status: "signed",
      },
      {
        kind: "proofdata",
        status: "attached",
      },
      {
        kind: "metadata",
        status: "attached",
      },
    ],
    settlement: null,
    now: "2026-07-16T12:00:00.000Z",
  });

  assert.equal(readiness.canSendDocumentation, true);
  assert.deepEqual(readiness.missingDocumentationKinds, []);
});

test("blocks documentation while SOA is missing", () => {
  const readiness = workflow.buildCaseWorkflowReadiness({
    stage: "documents",
    documents: [
      {
        kind: "rhf",
        status: "signed",
      },
      {
        kind: "dnl_cnpj",
        status: "attached",
      },
      {
        kind: "dnl_social_contract",
        status: "attached",
      },
      {
        kind: "proofdata",
        status: "attached",
      },
      {
        kind: "metadata",
        status: "attached",
      },
    ],
    settlement: null,
    now: "2026-07-16T12:00:00.000Z",
  });

  assert.equal(readiness.canSendDocumentation, false);
  assert.deepEqual(readiness.missingDocumentationKinds, ["soa"]);
});

test("shows SRA only after negotiation starts", () => {
  assert.equal(
    workflow.getVisibleDocumentKinds({ stage: "treatment", settlementStatus: null }).includes("sra"),
    false,
  );
  assert.equal(
    workflow.getVisibleDocumentKinds({ stage: "negotiation", settlementStatus: "proposal_sent" }).includes("sra"),
    true,
  );
});

test("marks pending payment as overdue after due date", () => {
  const status = workflow.resolveSettlementDisplayStatus({
    status: "payment_pending",
    paymentDueDate: "2026-07-15",
    paidAt: null,
    now: "2026-07-16T12:00:00.000Z",
  });

  assert.equal(status, "overdue");
});

test("renders communication templates without unresolved placeholders", () => {
  const context = {
    casePublicId: 123,
    clientName: "Cliente Exemplo",
    domain: "example.com",
    sourceUrl: "https://example.com/noticia",
    finalUrl: "https://example.com/noticia",
    assetTitle: "Foto editorial",
    notifiedName: "Empresa Notificada",
    notifiedEmail: "juridico@example.com",
    amountFormatted: "R$ 1.000,00",
    portalReference: "000123",
  };
  const kinds: CaseCommunicationKind[] = [
    "first_notice",
    "documentation_notice",
    "c1",
    "c1p",
    "c2",
    "negotiation",
  ];

  for (const kind of kinds) {
    const template = workflow.buildCaseCommunicationSnapshot(kind, context);
    assert.match(template.subject, /000123|123/);
    assert.match(template.body, /example\.com/);
    assert.doesNotMatch(template.body, /\[|\]|\{|\}|PREENCHER|NOME COMPLETO/);

    if (kind === "negotiation") {
      assert.match(template.body, /R\$ 1\.000,00/);
    }
  }
});

test("maps admin case actions to workflow effects", () => {
  assert.deepEqual(workflow.resolveAdminCaseActionEffect("first_communication"), {
    stage: "first_notice",
    communicationKind: "first_notice",
    treatmentKind: null,
    settlementStatus: null,
    detectionStatus: "takedown_sent",
    sendsEmail: true,
  });
  assert.deepEqual(workflow.resolveAdminCaseActionEffect("documentation_notice"), {
    stage: "documentation_notice",
    communicationKind: "documentation_notice",
    treatmentKind: null,
    settlementStatus: null,
    detectionStatus: "takedown_sent",
    sendsEmail: true,
  });
  assert.deepEqual(workflow.resolveAdminCaseActionEffect("close_resolved"), {
    stage: "closed",
    communicationKind: null,
    treatmentKind: null,
    settlementStatus: null,
    detectionStatus: "resolved",
    sendsEmail: false,
  });
});

test("enables communication actions and the integrated SRA action", () => {
  const enabledActions = new Set([
    "first_communication",
    "documentation_notice",
    "c1",
    "c1p",
    "c2",
    "register_sra",
  ]);

  for (const action of Object.keys(workflow.ADMIN_CASE_ACTION_LABELS)) {
    assert.equal(
      workflow.isAdminCaseActionEnabled(action),
      enabledActions.has(action),
    );
  }
});
