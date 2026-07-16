export type DocumentKind =
  | "rhf"
  | "soa"
  | "dnl_cnpj"
  | "dnl_social_contract"
  | "proofdata"
  | "metadata"
  | "sra"
  | "receipt"
  | "other";

export type DocumentStatus =
  | "missing"
  | "draft"
  | "attached"
  | "signature_requested"
  | "signed"
  | "sent"
  | "rejected"
  | "expired";

export type WorkflowStage =
  | "intake"
  | "documents"
  | "first_notice"
  | "documentation_notice"
  | "treatment"
  | "negotiation"
  | "agreement_signature"
  | "payment"
  | "collections"
  | "legal"
  | "closed";

export type SettlementStatus =
  | "draft"
  | "proposal_sent"
  | "sra_signature_pending"
  | "sra_signed"
  | "payment_pending"
  | "paid"
  | "overdue"
  | "collections"
  | "cancelled";

export type CaseCommunicationKind =
  | "first_notice"
  | "documentation_notice"
  | "c1"
  | "c1p"
  | "c2"
  | "negotiation";

export type CaseTreatmentKind = "doubt" | "debate" | "follow_up" | "call" | "other";

export type AdminCaseActionKind =
  | "first_communication"
  | "documentation_notice"
  | "c1"
  | "c1p"
  | "c2"
  | "follow_up"
  | "call"
  | "internal_note"
  | "negotiation"
  | "register_sra"
  | "register_payment"
  | "collections"
  | "legal"
  | "close_resolved";

export type CaseEventKind =
  | CaseCommunicationKind
  | CaseTreatmentKind
  | "legal"
  | "note"
  | "status_change"
  | "payment"
  | "document";

export type CaseWorkflowDocumentSummary = {
  kind: DocumentKind;
  status: DocumentStatus;
};

export type CaseWorkflowReadinessInput = {
  stage: WorkflowStage;
  documents: CaseWorkflowDocumentSummary[];
  settlement:
    | {
        status: SettlementStatus;
        paymentDueDate?: string | null;
        paidAt?: string | null;
      }
    | null;
  now?: string | Date;
};

export type CaseCommunicationTemplateContext = {
  casePublicId: number;
  clientName: string;
  domain: string;
  sourceUrl: string;
  finalUrl?: string | null;
  assetTitle: string;
  notifiedName?: string | null;
  notifiedEmail?: string | null;
  amountFormatted?: string | null;
  portalReference?: string | null;
};

export type CaseCommunicationSnapshot = {
  kind: CaseCommunicationKind;
  subject: string;
  body: string;
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  rhf: "RHF",
  soa: "SOA",
  dnl_cnpj: "CNPJ DNL",
  dnl_social_contract: "Contrato social",
  proofdata: "ProofData",
  metadata: "Metadados",
  sra: "SRA",
  receipt: "Recibo",
  other: "Outro",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  missing: "Pendente",
  draft: "Rascunho",
  attached: "Anexado",
  signature_requested: "Assinatura solicitada",
  signed: "Assinado",
  sent: "Enviado",
  rejected: "Recusado",
  expired: "Expirado",
};

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStage, string> = {
  intake: "Entrada do caso",
  documents: "Documentos",
  first_notice: "Primeira comunicação",
  documentation_notice: "Segunda comunicação / documentação",
  treatment: "Tratativas",
  negotiation: "Negociação",
  agreement_signature: "Assinatura SRA",
  payment: "Pagamento",
  collections: "Cobrança",
  legal: "Jurídico",
  closed: "Encerrado",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  draft: "Rascunho",
  proposal_sent: "Proposta enviada",
  sra_signature_pending: "SRA pendente",
  sra_signed: "SRA assinado",
  payment_pending: "Pagamento pendente",
  paid: "Pago",
  overdue: "Inadimplencia",
  collections: "Cobranca",
  cancelled: "Cancelado",
};

export const COMMUNICATION_KIND_LABELS: Record<CaseCommunicationKind, string> = {
  first_notice: "Primeira comunicação",
  documentation_notice: "Segunda comunicação / documentação",
  c1: "C1 - primeira cobrança de retorno",
  c1p: "C1P - segunda cobrança de retorno",
  c2: "C2 - encerramento de tratativas",
  negotiation: "Negociação / proposta",
};

export const TREATMENT_KIND_LABELS: Record<CaseTreatmentKind, string> = {
  doubt: "Dúvida",
  debate: "Debate",
  follow_up: "Follow-up",
  call: "Ligação",
  other: "Outro",
};

export const DOCUMENTATION_REQUIRED_DOCUMENTS: DocumentKind[] = [
  "rhf",
  "soa",
  "proofdata",
  "metadata",
];

export const BASE_DOCUMENT_KINDS: DocumentKind[] = [
  "rhf",
  "soa",
  "dnl_cnpj",
  "dnl_social_contract",
  "proofdata",
  "metadata",
];

export const ALL_DOCUMENT_KINDS: DocumentKind[] = [
  ...BASE_DOCUMENT_KINDS,
  "sra",
  "receipt",
  "other",
];

export const ADMIN_CASE_ACTION_LABELS: Record<AdminCaseActionKind, string> = {
  first_communication: "Primeira comunicação",
  documentation_notice: "Documentação / segunda comunicação",
  c1: "C1 - primeira cobrança de retorno",
  c1p: "C1P - segunda cobrança de retorno",
  c2: "C2 - encerramento de tratativas",
  follow_up: "Follow-up",
  call: "Ligação",
  internal_note: "Nota interna",
  negotiation: "Negociação / proposta",
  register_sra: "Registrar SRA",
  register_payment: "Registrar pagamento",
  collections: "Inadimplência / cobrança",
  legal: "Encaminhar jurídico",
  close_resolved: "Fechar como resolvido",
};

export type AdminCaseActionEffect = {
  stage: WorkflowStage;
  communicationKind: CaseCommunicationKind | null;
  treatmentKind: CaseTreatmentKind | null;
  settlementStatus: SettlementStatus | null;
  detectionStatus: "takedown_sent" | "resolved" | null;
  sendsEmail: boolean;
};

export const WORKFLOW_STAGES: WorkflowStage[] = [
  "intake",
  "documents",
  "first_notice",
  "documentation_notice",
  "treatment",
  "negotiation",
  "agreement_signature",
  "payment",
  "collections",
  "legal",
  "closed",
];

const COMPLETE_DOCUMENT_STATUSES = new Set<DocumentStatus>(["attached", "signed", "sent"]);
const SIGNED_OR_ATTACHED_DOCUMENT_STATUSES = new Set<DocumentStatus>(["attached", "signed"]);

function formatPublicId(value: number) {
  return String(value).padStart(6, "0");
}

function normalizeText(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function resolveNow(value: string | Date | undefined) {
  if (!value) {
    return new Date();
  }

  return value instanceof Date ? value : new Date(value);
}

function stageIndex(stage: WorkflowStage) {
  return WORKFLOW_STAGES.indexOf(stage);
}

function isStageAtLeast(stage: WorkflowStage, expected: WorkflowStage) {
  return stageIndex(stage) >= stageIndex(expected);
}

function hasCompleteDocument(documents: CaseWorkflowDocumentSummary[], kind: DocumentKind) {
  return documents.some(
    (document) =>
      document.kind === kind && COMPLETE_DOCUMENT_STATUSES.has(document.status),
  );
}

function hasSignedOrAttachedDocument(
  documents: CaseWorkflowDocumentSummary[],
  kind: DocumentKind,
) {
  return documents.some(
    (document) =>
      document.kind === kind && SIGNED_OR_ATTACHED_DOCUMENT_STATUSES.has(document.status),
  );
}

export function resolveSettlementDisplayStatus(params: {
  status: SettlementStatus;
  paymentDueDate?: string | null;
  paidAt?: string | null;
  now?: string | Date;
}): SettlementStatus {
  if (params.paidAt || params.status === "paid") {
    return "paid";
  }

  if (
    params.status === "payment_pending" &&
    params.paymentDueDate &&
    resolveNow(params.now).getTime() > new Date(`${params.paymentDueDate}T23:59:59.999Z`).getTime()
  ) {
    return "overdue";
  }

  return params.status;
}

export function getVisibleDocumentKinds(params: {
  stage: WorkflowStage;
  settlementStatus: SettlementStatus | null;
}) {
  const kinds = [...BASE_DOCUMENT_KINDS];
  const settlementStatus = params.settlementStatus;

  if (
    isStageAtLeast(params.stage, "negotiation") ||
    Boolean(settlementStatus && settlementStatus !== "draft" && settlementStatus !== "cancelled")
  ) {
    kinds.push("sra");
  }

  if (
    params.stage === "closed" ||
    params.stage === "payment" ||
    settlementStatus === "paid"
  ) {
    kinds.push("receipt");
  }

  return kinds;
}

export function buildCaseWorkflowReadiness(input: CaseWorkflowReadinessInput) {
  const missingDocumentationKinds = DOCUMENTATION_REQUIRED_DOCUMENTS.filter(
    (kind) => !hasCompleteDocument(input.documents, kind),
  );
  const settlementStatus = input.settlement
    ? resolveSettlementDisplayStatus({
        status: input.settlement.status,
        paymentDueDate: input.settlement.paymentDueDate,
        paidAt: input.settlement.paidAt,
        now: input.now,
      })
    : null;
  const canPrepareSra =
    isStageAtLeast(input.stage, "negotiation") ||
    Boolean(settlementStatus && settlementStatus !== "draft" && settlementStatus !== "cancelled");
  const hasSra = hasSignedOrAttachedDocument(input.documents, "sra");

  return {
    canSendFirstNotice: hasCompleteDocument(input.documents, "rhf"),
    canSendDocumentation: missingDocumentationKinds.length === 0,
    canPrepareSra,
    canRegisterPayment:
      hasSra &&
      Boolean(
        settlementStatus === "sra_signed" ||
          settlementStatus === "payment_pending" ||
          settlementStatus === "overdue",
      ),
    canCloseAsPaid: settlementStatus === "paid",
    settlementStatus,
    missingDocumentationKinds,
    visibleDocumentKinds: getVisibleDocumentKinds({
      stage: input.stage,
      settlementStatus,
    }),
  };
}

export function inferWorkflowStageFromStatus(params: {
  detectionStatus: string;
  latestEventKind?: string | null;
  settlementStatus?: SettlementStatus | null;
}): WorkflowStage {
  if (params.detectionStatus === "resolved") {
    return "closed";
  }

  if (params.settlementStatus === "paid") {
    return "payment";
  }

  if (params.settlementStatus === "overdue" || params.settlementStatus === "collections") {
    return "collections";
  }

  if (params.settlementStatus === "sra_signature_pending") {
    return "agreement_signature";
  }

  if (params.settlementStatus && params.settlementStatus !== "draft") {
    return "negotiation";
  }

  switch (params.latestEventKind) {
    case "documentation_notice":
      return "documentation_notice";
    case "first_notice":
      return "first_notice";
    case "doubt":
    case "debate":
    case "follow_up":
    case "call":
    case "other":
      return "treatment";
    case "c2":
      return "legal";
    default:
      return "documents";
  }
}

export function resolveAdminCaseActionEffect(
  kind: AdminCaseActionKind,
): AdminCaseActionEffect {
  switch (kind) {
    case "first_communication":
      return {
        stage: "first_notice",
        communicationKind: "first_notice",
        treatmentKind: null,
        settlementStatus: null,
        detectionStatus: "takedown_sent",
        sendsEmail: true,
      };
    case "documentation_notice":
      return {
        stage: "documentation_notice",
        communicationKind: "documentation_notice",
        treatmentKind: null,
        settlementStatus: null,
        detectionStatus: "takedown_sent",
        sendsEmail: true,
      };
    case "c1":
    case "c1p":
      return {
        stage: "treatment",
        communicationKind: kind,
        treatmentKind: null,
        settlementStatus: null,
        detectionStatus: null,
        sendsEmail: true,
      };
    case "c2":
      return {
        stage: "legal",
        communicationKind: "c2",
        treatmentKind: null,
        settlementStatus: null,
        detectionStatus: null,
        sendsEmail: true,
      };
    case "follow_up":
      return {
        stage: "treatment",
        communicationKind: null,
        treatmentKind: "follow_up",
        settlementStatus: null,
        detectionStatus: null,
        sendsEmail: false,
      };
    case "call":
      return {
        stage: "treatment",
        communicationKind: null,
        treatmentKind: "call",
        settlementStatus: null,
        detectionStatus: null,
        sendsEmail: false,
      };
    case "internal_note":
      return {
        stage: "treatment",
        communicationKind: null,
        treatmentKind: "other",
        settlementStatus: null,
        detectionStatus: null,
        sendsEmail: false,
      };
    case "negotiation":
      return {
        stage: "negotiation",
        communicationKind: "negotiation",
        treatmentKind: null,
        settlementStatus: "proposal_sent",
        detectionStatus: null,
        sendsEmail: true,
      };
    case "register_sra":
      return {
        stage: "agreement_signature",
        communicationKind: null,
        treatmentKind: null,
        settlementStatus: "sra_signature_pending",
        detectionStatus: null,
        sendsEmail: false,
      };
    case "register_payment":
      return {
        stage: "payment",
        communicationKind: null,
        treatmentKind: null,
        settlementStatus: "paid",
        detectionStatus: null,
        sendsEmail: false,
      };
    case "collections":
      return {
        stage: "collections",
        communicationKind: null,
        treatmentKind: null,
        settlementStatus: "collections",
        detectionStatus: null,
        sendsEmail: true,
      };
    case "legal":
      return {
        stage: "legal",
        communicationKind: null,
        treatmentKind: null,
        settlementStatus: null,
        detectionStatus: null,
        sendsEmail: false,
      };
    case "close_resolved":
      return {
        stage: "closed",
        communicationKind: null,
        treatmentKind: null,
        settlementStatus: null,
        detectionStatus: "resolved",
        sendsEmail: false,
      };
    default:
      return kind satisfies never;
  }
}

export function buildCaseCommunicationSnapshot(
  kind: CaseCommunicationKind,
  context: CaseCommunicationTemplateContext,
): CaseCommunicationSnapshot {
  const reference = normalizeText(context.portalReference, formatPublicId(context.casePublicId));
  const notifiedName = normalizeText(context.notifiedName, "responsavel pelo site");
  const notifiedEmail = normalizeText(context.notifiedEmail, "e-mail nao informado");
  const finalUrl = normalizeText(context.finalUrl, context.sourceUrl);
  const amount = normalizeText(context.amountFormatted, "valor a definir");
  const commonFooter = [
    "",
    "Atenciosamente,",
    "Equipe Direito na Lente",
    `Referencia do caso: ${reference}`,
  ].join("\n");

  switch (kind) {
    case "first_notice":
      return {
        kind,
        subject: `Comunicacao inicial - caso ${reference}`,
        body: [
          `Ola, ${notifiedName}.`,
          "",
          `Identificamos o uso da imagem "${context.assetTitle}" no dominio ${context.domain}.`,
          `URL analisada: ${context.sourceUrl}`,
          `URL final registrada: ${finalUrl}`,
          "",
          "Esta mensagem e uma primeira comunicacao para que possamos entender a origem da publicacao e buscar uma resolucao administrativa.",
          "Pedimos retorno com informacoes sobre autorizacao, licenca ou retirada do conteudo.",
          commonFooter,
        ].join("\n"),
      };
    case "documentation_notice":
      return {
        kind,
        subject: `Documentacao do caso ${reference}`,
        body: [
          `Ola, ${notifiedName}.`,
          "",
          `Encaminhamos a documentacao relacionada ao caso ${reference}, referente ao uso da imagem "${context.assetTitle}" em ${context.domain}.`,
          "A documentacao operacional reune declaracao de titularidade, autorizacao de representacao, arquivos de prova e metadados disponiveis.",
          `Contato registrado: ${notifiedEmail}`,
          commonFooter,
        ].join("\n"),
      };
    case "c1":
      return {
        kind,
        subject: `Primeira cobranca de retorno - caso ${reference}`,
        body: [
          `Ola, ${notifiedName}.`,
          "",
          `Ainda nao recebemos retorno sobre o caso ${reference}, relacionado ao dominio ${context.domain}.`,
          "Solicitamos uma resposta para prosseguirmos com a tratativa administrativa.",
          commonFooter,
        ].join("\n"),
      };
    case "c1p":
      return {
        kind,
        subject: `Segunda cobranca de retorno - caso ${reference}`,
        body: [
          `Ola, ${notifiedName}.`,
          "",
          `Reforcamos a necessidade de retorno sobre o caso ${reference}.`,
          `A ocorrencia permanece registrada em ${context.sourceUrl} e aguardamos uma posicao objetiva para composicao ou encerramento da tratativa.`,
          commonFooter,
        ].join("\n"),
      };
    case "c2":
      return {
        kind,
        subject: `Encerramento de tratativas - caso ${reference}`,
        body: [
          `Ola, ${notifiedName}.`,
          "",
          `Como nao houve retorno suficiente para composicao administrativa do caso ${reference}, registraremos o encerramento desta fase de tratativas.`,
          `A ocorrencia segue vinculada ao dominio ${context.domain}, na URL ${context.sourceUrl}.`,
          "A Direito na Lente podera encaminhar o caso para avaliacao juridica e novas providencias.",
          commonFooter,
        ].join("\n"),
      };
    case "negotiation":
      return {
        kind,
        subject: `Proposta de composicao - caso ${reference}`,
        body: [
          `Ola, ${notifiedName}.`,
          "",
          `Para composicao administrativa do caso ${reference}, propomos o valor de ${amount}.`,
          `A proposta se refere ao uso identificado em ${context.domain}, na URL ${context.sourceUrl}.`,
          "A formalizacao depende de assinatura do termo SRA e confirmacao de pagamento por boleto ou PIX.",
          commonFooter,
        ].join("\n"),
      };
    default:
      return kind satisfies never;
  }
}
