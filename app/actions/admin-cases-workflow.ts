"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import {
  ADMIN_CASE_ACTION_LABELS,
  COMMUNICATION_KIND_LABELS,
  TREATMENT_KIND_LABELS,
  buildCaseCommunicationSnapshot,
  resolveAdminCaseActionEffect,
  type AdminCaseActionKind,
  type CaseCommunicationKind,
  type DocumentKind,
  type DocumentStatus,
  type SettlementStatus,
  type WorkflowStage,
} from "@/lib/admin-case-workflow";
import { buildCaseValidationUrl } from "@/lib/case-validation-code";
import { createCasePublicValidationCode } from "@/lib/dal/case-public-validation";
import { getAppUrl, sendCaseCommunicationEmail } from "@/lib/email/service";
import { uploadCaseDocumentToR2 } from "@/lib/r2";
import { createClient } from "@/lib/server";

const contextSchema = z.object({
  organizationId: z.uuid(),
  casePublicId: z.coerce.number().int().positive(),
  representativeDetectionId: z.uuid(),
});

const workflowStageSchema = z.enum([
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
]);

const documentKindSchema = z.enum([
  "rhf",
  "soa",
  "dnl_cnpj",
  "dnl_social_contract",
  "proofdata",
  "metadata",
  "sra",
  "receipt",
  "other",
]);

const documentStatusSchema = z.enum([
  "missing",
  "draft",
  "attached",
  "signature_requested",
  "signed",
  "sent",
  "rejected",
  "expired",
]);

const communicationKindSchema = z.enum([
  "first_notice",
  "documentation_notice",
  "c1",
  "c1p",
  "c2",
  "negotiation",
]);

const treatmentKindSchema = z.enum(["doubt", "debate", "follow_up", "call", "other"]);

const settlementStatusSchema = z.enum([
  "draft",
  "proposal_sent",
  "sra_signature_pending",
  "sra_signed",
  "payment_pending",
  "paid",
  "overdue",
  "collections",
  "cancelled",
]);

const adminCaseActionKindSchema = z.enum([
  "first_communication",
  "documentation_notice",
  "c1",
  "c1p",
  "c2",
  "follow_up",
  "call",
  "internal_note",
  "negotiation",
  "register_sra",
  "register_payment",
  "collections",
  "legal",
  "close_resolved",
]);

const executeAdminCaseActionSchema = contextSchema.extend({
  actionKind: adminCaseActionKindSchema,
  casePublicIdLabel: z.string().trim().min(1),
  clientName: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  sourceUrl: z.string().trim().min(1),
  finalUrl: z.string().trim().nullable(),
  assetTitle: z.string().trim().min(1),
  notifiedName: z.string().trim().max(160).nullable(),
  notifiedEmail: z.string().trim().max(254).nullable(),
  notifiedPhone: z.string().trim().max(40).nullable(),
  notifiedDocument: z.string().trim().max(40).nullable(),
  notifiedWebsiteUrl: z.string().trim().max(500).nullable(),
  title: z.string().trim().max(180).nullable(),
  notes: z.string().trim().max(4000).nullable(),
  proposedAmount: z.string().trim().nullable(),
  paymentDueDate: z.string().trim().nullable(),
  paymentMethod: z.string().trim().nullable(),
  paymentReference: z.string().trim().max(180).nullable(),
  paymentUrl: z.string().trim().max(500).nullable(),
  paidAmount: z.string().trim().nullable(),
  paidAt: z.string().trim().nullable(),
  documentStatus: documentStatusSchema.default("attached"),
  documentTitle: z.string().trim().max(180).nullable(),
  provider: z.string().trim().max(80).nullable(),
  externalEnvelopeId: z.string().trim().max(160).nullable(),
  externalUrl: z.string().trim().max(500).nullable(),
  externalStatus: z.string().trim().max(80).nullable(),
  signedAt: z.string().trim().max(40).nullable(),
  sentAt: z.string().trim().max(40).nullable(),
  expiresAt: z.string().trim().max(40).nullable(),
});

export type AdminCaseActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAdminCaseActionState: AdminCaseActionState = {
  status: "idle",
  message: "",
};

type CaseDetectionStatusRow = {
  id: string;
  case_public_id: number;
  organization_id: string;
  asset_id: string;
  source_url: string;
  canonical_source_url: string;
  domain: string | null;
  status: string;
};

const updateWorkflowSchema = contextSchema.extend({
  stage: workflowStageSchema,
  priority: z.enum(["low", "normal", "high", "urgent"]),
  assignedToUserId: z.uuid().nullable(),
  nextAction: z.string().trim().max(240).nullable(),
  nextActionDueAt: z.string().trim().max(40).nullable(),
  notifiedName: z.string().trim().max(160).nullable(),
  notifiedEmail: z.string().trim().max(254).nullable(),
  notifiedPhone: z.string().trim().max(40).nullable(),
  notifiedDocument: z.string().trim().max(40).nullable(),
  notifiedDomain: z.string().trim().max(160).nullable(),
  notifiedWebsiteUrl: z.string().trim().max(500).nullable(),
  summary: z.string().trim().max(2000).nullable(),
});

const documentSchema = contextSchema.extend({
  documentKind: documentKindSchema,
  status: documentStatusSchema,
  title: z.string().trim().min(2).max(180),
  notes: z.string().trim().max(2000).nullable(),
  provider: z.string().trim().max(80).nullable(),
  externalEnvelopeId: z.string().trim().max(160).nullable(),
  externalUrl: z.string().trim().max(500).nullable(),
  externalStatus: z.string().trim().max(80).nullable(),
  signedAt: z.string().trim().max(40).nullable(),
  sentAt: z.string().trim().max(40).nullable(),
  expiresAt: z.string().trim().max(40).nullable(),
});

const communicationSchema = contextSchema.extend({
  communicationKind: communicationKindSchema,
  casePublicIdLabel: z.string().trim().min(1),
  clientName: z.string().trim().min(1),
  domain: z.string().trim().min(1),
  sourceUrl: z.string().trim().min(1),
  finalUrl: z.string().trim().nullable(),
  assetTitle: z.string().trim().min(1),
  notifiedName: z.string().trim().nullable(),
  notifiedEmail: z.string().trim().nullable(),
  amountFormatted: z.string().trim().nullable(),
});

const treatmentSchema = contextSchema.extend({
  treatmentKind: treatmentKindSchema,
  title: z.string().trim().min(2).max(180),
  notes: z.string().trim().max(4000).nullable(),
});

const settlementSchema = contextSchema.extend({
  status: settlementStatusSchema,
  proposedAmount: z.string().trim().nullable(),
  paymentDueDate: z.string().trim().nullable(),
  paymentMethod: z.string().trim().nullable(),
  paymentReference: z.string().trim().max(180).nullable(),
  paymentUrl: z.string().trim().max(500).nullable(),
  paidAmount: z.string().trim().nullable(),
  paidAt: z.string().trim().nullable(),
  notes: z.string().trim().max(4000).nullable(),
});

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function parseAmountToCents(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function normalizeDatetime(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeDate(value: string | null) {
  if (!value) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parseNormalizedDomain(params: {
  domain: string | null;
  source_url: string;
  canonical_source_url: string;
}) {
  const candidates = [params.domain, params.source_url, params.canonical_source_url];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const host = candidate.includes("://") ? new URL(candidate).hostname : candidate;
      const normalized = host.trim().toLowerCase().replace(/^www\./, "");

      if (normalized) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  return "site-nao-identificado";
}

function getDetectionActionLabel(nextStatus: string) {
  switch (nextStatus) {
    case "takedown_sent":
      return "notificacao_enviada";
    case "resolved":
      return "marcada_como_resolvida";
    default:
      return "status_atualizado";
  }
}

function buildCaseDocumentStorageKey(params: {
  organizationId: string;
  casePublicId: number;
  documentKind: DocumentKind;
  fileName: string;
}) {
  const safeFileName = params.fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return [
    "organizations",
    params.organizationId,
    "cases",
    String(params.casePublicId),
    "documents",
    params.documentKind,
    `${randomUUID()}-${safeFileName || "documento"}`,
  ].join("/");
}

function communicationStage(kind: CaseCommunicationKind): WorkflowStage {
  switch (kind) {
    case "first_notice":
      return "first_notice";
    case "documentation_notice":
      return "documentation_notice";
    case "negotiation":
      return "negotiation";
    case "c2":
      return "legal";
    case "c1":
    case "c1p":
      return "treatment";
  }
}

function settlementStage(status: SettlementStatus): WorkflowStage {
  switch (status) {
    case "proposal_sent":
      return "negotiation";
    case "sra_signature_pending":
    case "sra_signed":
      return "agreement_signature";
    case "payment_pending":
    case "paid":
      return "payment";
    case "overdue":
    case "collections":
      return "collections";
    case "cancelled":
      return "treatment";
    case "draft":
      return "negotiation";
  }
}

function revalidateCasePaths(params: { organizationId: string; casePublicId: number }) {
  revalidatePath("/admin/cases");
  revalidatePath(`/admin/cases/${params.organizationId}/${params.casePublicId}`);
}

async function createCaseValidationEmailContext(params: {
  organizationId: string;
  casePublicId: number;
  userId: string;
}) {
  const validationCode = await createCasePublicValidationCode({
    organizationId: params.organizationId,
    casePublicId: params.casePublicId,
    createdByUserId: params.userId,
  });

  return {
    validationCode: validationCode.formatted,
    validationCodeHint: validationCode.hint,
    validationUrl: buildCaseValidationUrl({
      baseUrl: getAppUrl(),
      casePublicId: params.casePublicId,
      validationCode: validationCode.formatted,
    }),
  };
}

async function ensureWorkflow(params: {
  organizationId: string;
  casePublicId: number;
  representativeDetectionId: string;
  userId: string;
  stage?: WorkflowStage;
}) {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("case_workflows")
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("case_public_id", params.casePublicId)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error("Nao foi possivel preparar o workflow deste caso.");
  }

  if (existing) {
    const { error } = await supabase
      .from("case_workflows")
      .update({
        representative_detection_id: params.representativeDetectionId,
        updated_by_user_id: params.userId,
        ...(params.stage ? { stage: params.stage } : {}),
      })
      .eq("organization_id", params.organizationId)
      .eq("id", existing.id);

    if (error) {
      throw new Error("Nao foi possivel preparar o workflow deste caso.");
    }

    return existing.id;
  }

  const { data, error } = await supabase
    .from("case_workflows")
    .insert({
      organization_id: params.organizationId,
      case_public_id: params.casePublicId,
      representative_detection_id: params.representativeDetectionId,
      stage: params.stage ?? "documents",
      created_by_user_id: params.userId,
      updated_by_user_id: params.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("Nao foi possivel preparar o workflow deste caso.");
  }

  return data.id;
}

async function updateWorkflowStage(params: {
  workflowId: string;
  organizationId: string;
  stage: WorkflowStage;
  userId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("case_workflows")
    .update({
      stage: params.stage,
      updated_by_user_id: params.userId,
    })
    .eq("organization_id", params.organizationId)
    .eq("id", params.workflowId);

  if (error) {
    throw new Error("Nao foi possivel atualizar a etapa do caso.");
  }
}

async function updateWorkflowOperationalData(params: {
  workflowId: string;
  organizationId: string;
  stage: WorkflowStage;
  userId: string;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  notifiedName?: string | null;
  notifiedEmail?: string | null;
  notifiedPhone?: string | null;
  notifiedDocument?: string | null;
  notifiedDomain?: string | null;
  notifiedWebsiteUrl?: string | null;
  summary?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("case_workflows")
    .update({
      stage: params.stage,
      next_action: params.nextAction ?? null,
      next_action_due_at: normalizeDatetime(params.nextActionDueAt ?? null),
      notified_name: params.notifiedName ?? null,
      notified_email: params.notifiedEmail ?? null,
      notified_phone: params.notifiedPhone ?? null,
      notified_document: params.notifiedDocument ?? null,
      notified_domain: params.notifiedDomain ?? null,
      notified_website_url: params.notifiedWebsiteUrl ?? null,
      summary: params.summary ?? null,
      updated_by_user_id: params.userId,
    })
    .eq("organization_id", params.organizationId)
    .eq("id", params.workflowId);

  if (error) {
    throw new Error("Nao foi possivel atualizar o andamento do caso.");
  }
}

async function updateCaseDetectionsStatus(params: {
  organizationId: string;
  representativeDetectionId: string;
  casePublicId: number;
  nextStatus: "takedown_sent" | "resolved";
  reason: AdminCaseActionKind;
  userId: string;
}) {
  const supabase = await createClient();
  const { data: representative, error: detectionError } = await supabase
    .from("detections")
    .select("id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, domain, status")
    .eq("organization_id", params.organizationId)
    .eq("id", params.representativeDetectionId)
    .maybeSingle<CaseDetectionStatusRow>();

  if (detectionError || !representative) {
    throw new Error("Ocorrencia representativa nao encontrada.");
  }

  const representativeDomain = parseNormalizedDomain(representative);
  const { data: siblingDetections, error: siblingError } = await supabase
    .from("detections")
    .select("id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, domain, status")
    .eq("organization_id", representative.organization_id)
    .eq("asset_id", representative.asset_id)
    .eq("case_public_id", params.casePublicId)
    .is("archived_at", null)
    .returns<CaseDetectionStatusRow[]>();

  if (siblingError) {
    throw new Error("Nao foi possivel carregar as ocorrencias deste caso.");
  }

  const detectionsToUpdate = (siblingDetections ?? []).filter(
    (item) =>
      parseNormalizedDomain(item) === representativeDomain &&
      item.status !== params.nextStatus,
  );

  if (detectionsToUpdate.length === 0) {
    return;
  }

  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("detections")
    .update({
      status: params.nextStatus,
      reviewed_at: reviewedAt,
      reviewed_by_user_id: params.userId,
    })
    .eq("organization_id", representative.organization_id)
    .in(
      "id",
      detectionsToUpdate.map((item) => item.id),
    );

  if (updateError) {
    throw new Error("Nao foi possivel atualizar o status das ocorrencias do caso.");
  }

  const { error: actionError } = await supabase.from("detection_actions").insert(
    detectionsToUpdate.map((item) => ({
      organization_id: representative.organization_id,
      detection_id: item.id,
      user_id: params.userId,
      action: getDetectionActionLabel(params.nextStatus),
      from_status: item.status,
      to_status: params.nextStatus,
      metadata: {
        scope: "case_action",
        representativeDetectionId: representative.id,
        reason: params.reason,
      },
    })),
  );

  if (actionError) {
    throw new Error("Nao foi possivel registrar o historico das ocorrencias.");
  }
}

async function upsertCaseSettlement(params: {
  organizationId: string;
  casePublicId: number;
  workflowId: string;
  status: SettlementStatus;
  proposedAmount: string | null;
  paymentDueDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentUrl: string | null;
  paidAmount: string | null;
  paidAt: string | null;
  notes: string | null;
  userId: string;
}) {
  const supabase = await createClient();
  const proposedAmountCents = parseAmountToCents(params.proposedAmount);
  const paidAmountCents = parseAmountToCents(params.paidAmount);
  const { error } = await supabase.from("case_settlements").upsert(
    {
      organization_id: params.organizationId,
      case_public_id: params.casePublicId,
      workflow_id: params.workflowId,
      status: params.status,
      proposed_amount_cents: proposedAmountCents,
      proposal_sent_at:
        params.status === "proposal_sent" ? new Date().toISOString() : undefined,
      payment_method: params.paymentMethod,
      payment_due_date: normalizeDate(params.paymentDueDate),
      payment_reference: params.paymentReference,
      payment_url: params.paymentUrl,
      paid_amount_cents: paidAmountCents,
      paid_at: normalizeDatetime(params.paidAt),
      collections_started_at:
        params.status === "collections" ? new Date().toISOString() : undefined,
      notes: params.notes,
      updated_by_user_id: params.userId,
      created_by_user_id: params.userId,
    },
    { onConflict: "organization_id,case_public_id" },
  );

  if (error) {
    throw new Error("Nao foi possivel salvar a negociacao do caso.");
  }

  return { proposedAmountCents, paidAmountCents };
}

async function insertSraDocument(params: {
  organizationId: string;
  casePublicId: number;
  workflowId: string;
  representativeDetectionId: string;
  status: DocumentStatus;
  title: string;
  notes: string | null;
  provider: string | null;
  externalEnvelopeId: string | null;
  externalUrl: string | null;
  externalStatus: string | null;
  signedAt: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  file: File | null;
  userId: string;
}) {
  const supabase = await createClient();
  let storageKey: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let sizeBytes: number | null = null;

  if (params.file) {
    if (params.file.size > 20 * 1024 * 1024) {
      throw new Error("O documento deve ter ate 20MB.");
    }

    storageKey = buildCaseDocumentStorageKey({
      organizationId: params.organizationId,
      casePublicId: params.casePublicId,
      documentKind: "sra",
      fileName: params.file.name,
    });
    fileName = params.file.name;
    mimeType = params.file.type || "application/octet-stream";
    sizeBytes = params.file.size;

    await uploadCaseDocumentToR2({
      key: storageKey,
      body: Buffer.from(await params.file.arrayBuffer()),
      contentType: mimeType,
    });
  }

  const { error: archiveError } = await supabase
    .from("case_documents")
    .update({
      is_current: false,
      updated_by_user_id: params.userId,
    })
    .eq("organization_id", params.organizationId)
    .eq("case_public_id", params.casePublicId)
    .eq("document_kind", "sra")
    .eq("is_current", true);

  if (archiveError) {
    throw new Error("Nao foi possivel arquivar a versao anterior do SRA.");
  }

  const { data: document, error } = await supabase
    .from("case_documents")
    .insert({
      organization_id: params.organizationId,
      case_public_id: params.casePublicId,
      workflow_id: params.workflowId,
      detection_id: params.representativeDetectionId,
      document_kind: "sra",
      status: params.status,
      title: params.title,
      notes: params.notes,
      storage_key: storageKey,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      external_url: params.externalUrl,
      provider: params.provider,
      external_envelope_id: params.externalEnvelopeId,
      external_status: params.externalStatus,
      signed_at: normalizeDatetime(params.signedAt),
      sent_at: normalizeDatetime(params.sentAt),
      expires_at: normalizeDatetime(params.expiresAt),
      created_by_user_id: params.userId,
      updated_by_user_id: params.userId,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !document) {
    throw new Error("Nao foi possivel registrar o SRA.");
  }

  return document.id;
}

function getActionFieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function buildCollectionsSnapshot(params: {
  casePublicIdLabel: string;
  domain: string;
  sourceUrl: string;
  notifiedName: string | null;
  paymentDueDate: string | null;
  paymentReference: string | null;
  notes: string | null;
}) {
  const notifiedName = params.notifiedName?.trim() || "responsavel pelo site";
  const details = [
    params.paymentDueDate ? `Vencimento registrado: ${params.paymentDueDate}` : null,
    params.paymentReference ? `Referencia de pagamento: ${params.paymentReference}` : null,
    params.notes,
  ].filter(Boolean);

  return {
    subject: `Cobranca administrativa - caso ${params.casePublicIdLabel}`,
    body: [
      `Ola, ${notifiedName}.`,
      "",
      `Registramos pendencia de pagamento relacionada ao caso ${params.casePublicIdLabel}, vinculado ao dominio ${params.domain}.`,
      `URL analisada: ${params.sourceUrl}`,
      "",
      ...details,
      "",
      "Solicitamos retorno para regularizacao administrativa ou envio do comprovante de pagamento.",
      "",
      "Atenciosamente,",
      "Equipe Direito na Lente",
      `Referencia do caso: ${params.casePublicIdLabel}`,
    ].join("\n"),
  };
}

export async function executeAdminCaseAction(
  _previousState: AdminCaseActionState,
  formData: FormData,
): Promise<AdminCaseActionState> {
  const parsed = executeAdminCaseActionSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    representativeDetectionId: formData.get("representativeDetectionId"),
    actionKind: formData.get("actionKind"),
    casePublicIdLabel: requiredString(formData.get("casePublicIdLabel")),
    clientName: requiredString(formData.get("clientName")),
    domain: requiredString(formData.get("domain")),
    sourceUrl: requiredString(formData.get("sourceUrl")),
    finalUrl: optionalString(formData.get("finalUrl")),
    assetTitle: requiredString(formData.get("assetTitle")),
    notifiedName: optionalString(formData.get("notifiedName")),
    notifiedEmail: optionalString(formData.get("notifiedEmail")),
    notifiedPhone: optionalString(formData.get("notifiedPhone")),
    notifiedDocument: optionalString(formData.get("notifiedDocument")),
    notifiedWebsiteUrl: optionalString(formData.get("notifiedWebsiteUrl")),
    title: optionalString(formData.get("title")),
    notes: optionalString(formData.get("notes")),
    proposedAmount: optionalString(formData.get("proposedAmount")),
    paymentDueDate: optionalString(formData.get("paymentDueDate")),
    paymentMethod: optionalString(formData.get("paymentMethod")),
    paymentReference: optionalString(formData.get("paymentReference")),
    paymentUrl: optionalString(formData.get("paymentUrl")),
    paidAmount: optionalString(formData.get("paidAmount")),
    paidAt: optionalString(formData.get("paidAt")),
    documentStatus: formData.get("documentStatus") ?? "attached",
    documentTitle: optionalString(formData.get("documentTitle")),
    provider: optionalString(formData.get("provider")),
    externalEnvelopeId: optionalString(formData.get("externalEnvelopeId")),
    externalUrl: optionalString(formData.get("externalUrl")),
    externalStatus: optionalString(formData.get("externalStatus")),
    signedAt: optionalString(formData.get("signedAt")),
    sentAt: optionalString(formData.get("sentAt")),
    expiresAt: optionalString(formData.get("expiresAt")),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos da ação antes de continuar.",
      fieldErrors: getActionFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const effect = resolveAdminCaseActionEffect(data.actionKind);
  const emailValidation =
    effect.sendsEmail && data.notifiedEmail
      ? z.email().safeParse(data.notifiedEmail)
      : null;

  if (effect.sendsEmail && !data.notifiedEmail) {
    return {
      status: "error",
      message: "Informe o e-mail do notificado para enviar esta ação.",
      fieldErrors: {
        notifiedEmail: ["Informe o e-mail do notificado."],
      },
    };
  }

  if (emailValidation && !emailValidation.success) {
    return {
      status: "error",
      message: "Informe um e-mail válido para o notificado.",
      fieldErrors: {
        notifiedEmail: ["Informe um e-mail válido."],
      },
    };
  }

  try {
    const context = await requirePanelAccess("admin");
    const workflowId = await ensureWorkflow({
      organizationId: data.organizationId,
      casePublicId: data.casePublicId,
      representativeDetectionId: data.representativeDetectionId,
      userId: context.userId,
      stage: effect.stage,
    });

    await updateWorkflowOperationalData({
      workflowId,
      organizationId: data.organizationId,
      stage: effect.stage,
      userId: context.userId,
      nextAction: data.title ?? ADMIN_CASE_ACTION_LABELS[data.actionKind],
      notifiedName: data.notifiedName,
      notifiedEmail: data.notifiedEmail,
      notifiedPhone: data.notifiedPhone,
      notifiedDocument: data.notifiedDocument,
      notifiedDomain: data.domain,
      notifiedWebsiteUrl: data.notifiedWebsiteUrl ?? data.finalUrl ?? data.sourceUrl,
      summary: data.notes,
    });

    if (effect.settlementStatus) {
      await upsertCaseSettlement({
        organizationId: data.organizationId,
        casePublicId: data.casePublicId,
        workflowId,
        status:
          data.actionKind === "register_sra" && data.documentStatus === "signed"
            ? "sra_signed"
            : effect.settlementStatus,
        proposedAmount: data.proposedAmount,
        paymentDueDate: data.paymentDueDate,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        paymentUrl: data.paymentUrl,
        paidAmount: data.paidAmount,
        paidAt:
          data.actionKind === "register_payment" && !data.paidAt
            ? new Date().toISOString()
            : data.paidAt,
        notes: data.notes,
        userId: context.userId,
      });
    }

    const supabase = await createClient();
    let successMessage = `Ação registrada: ${ADMIN_CASE_ACTION_LABELS[data.actionKind]}.`;

    if (effect.communicationKind) {
      const snapshot = buildCaseCommunicationSnapshot(effect.communicationKind, {
        casePublicId: data.casePublicId,
        clientName: data.clientName,
        domain: data.domain,
        sourceUrl: data.sourceUrl,
        finalUrl: data.finalUrl,
        assetTitle: data.assetTitle,
        notifiedName: data.notifiedName,
        notifiedEmail: data.notifiedEmail,
        amountFormatted: data.proposedAmount,
        portalReference: data.casePublicIdLabel,
      });
      let validationCodeHint: string | null = null;

      if (data.notifiedEmail) {
        const validationContext = await createCaseValidationEmailContext({
          organizationId: data.organizationId,
          casePublicId: data.casePublicId,
          userId: context.userId,
        });
        validationCodeHint = validationContext.validationCodeHint;

        await sendCaseCommunicationEmail({
          to: data.notifiedEmail,
          subject: snapshot.subject,
          body: snapshot.body,
          casePublicIdLabel: data.casePublicIdLabel,
          clientName: data.clientName,
          domain: data.domain,
          sourceUrl: data.sourceUrl,
          validationUrl: validationContext.validationUrl,
          validationCode: validationContext.validationCode,
        });
      }

      const { error } = await supabase.from("case_events").insert({
        organization_id: data.organizationId,
        case_public_id: data.casePublicId,
        workflow_id: workflowId,
        detection_id: data.representativeDetectionId,
        user_id: context.userId,
        event_kind: effect.communicationKind,
        direction: "outbound",
        title: COMMUNICATION_KIND_LABELS[effect.communicationKind],
        notes: data.notes,
        communication_subject: snapshot.subject,
        communication_body_snapshot: snapshot.body,
        metadata: {
          actionKind: data.actionKind,
          emailTo: data.notifiedEmail,
          validationCodeHint,
        },
      });

      if (error) {
        throw new Error("Nao foi possivel registrar a comunicacao.");
      }

      successMessage = `E-mail enviado e ação registrada: ${COMMUNICATION_KIND_LABELS[effect.communicationKind]}.`;
    } else if (data.actionKind === "collections") {
      const snapshot = buildCollectionsSnapshot({
        casePublicIdLabel: data.casePublicIdLabel,
        domain: data.domain,
        sourceUrl: data.sourceUrl,
        notifiedName: data.notifiedName,
        paymentDueDate: data.paymentDueDate,
        paymentReference: data.paymentReference,
        notes: data.notes,
      });
      let validationCodeHint: string | null = null;

      if (data.notifiedEmail) {
        const validationContext = await createCaseValidationEmailContext({
          organizationId: data.organizationId,
          casePublicId: data.casePublicId,
          userId: context.userId,
        });
        validationCodeHint = validationContext.validationCodeHint;

        await sendCaseCommunicationEmail({
          to: data.notifiedEmail,
          subject: snapshot.subject,
          body: snapshot.body,
          casePublicIdLabel: data.casePublicIdLabel,
          clientName: data.clientName,
          domain: data.domain,
          sourceUrl: data.sourceUrl,
          validationUrl: validationContext.validationUrl,
          validationCode: validationContext.validationCode,
        });
      }

      const { error } = await supabase.from("case_events").insert({
        organization_id: data.organizationId,
        case_public_id: data.casePublicId,
        workflow_id: workflowId,
        detection_id: data.representativeDetectionId,
        user_id: context.userId,
        event_kind: "payment",
        direction: "outbound",
        title: ADMIN_CASE_ACTION_LABELS[data.actionKind],
        notes: data.notes,
        communication_subject: snapshot.subject,
        communication_body_snapshot: snapshot.body,
        metadata: {
          actionKind: data.actionKind,
          emailTo: data.notifiedEmail,
          validationCodeHint,
        },
      });

      if (error) {
        throw new Error("Nao foi possivel registrar a cobranca.");
      }

      successMessage = "Cobrança enviada e registrada no caso.";
    } else if (data.actionKind === "register_sra") {
      const rawFile = formData.get("file");
      const documentId = await insertSraDocument({
        organizationId: data.organizationId,
        casePublicId: data.casePublicId,
        workflowId,
        representativeDetectionId: data.representativeDetectionId,
        status: data.documentStatus,
        title: data.documentTitle ?? "SRA do caso",
        notes: data.notes,
        provider: data.provider,
        externalEnvelopeId: data.externalEnvelopeId,
        externalUrl: data.externalUrl,
        externalStatus: data.externalStatus,
        signedAt: data.signedAt,
        sentAt: data.sentAt,
        expiresAt: data.expiresAt,
        file: rawFile instanceof File && rawFile.size > 0 ? rawFile : null,
        userId: context.userId,
      });
      const { error } = await supabase.from("case_events").insert({
        organization_id: data.organizationId,
        case_public_id: data.casePublicId,
        workflow_id: workflowId,
        detection_id: data.representativeDetectionId,
        user_id: context.userId,
        event_kind: "document",
        direction: "internal",
        title: "SRA registrado",
        notes: data.notes,
        metadata: {
          actionKind: data.actionKind,
          documentId,
          documentKind: "sra",
          status: data.documentStatus,
        },
      });

      if (error) {
        throw new Error("Nao foi possivel registrar o historico do SRA.");
      }

      successMessage = "SRA registrado no caso.";
    } else {
      const eventKind =
        data.actionKind === "register_payment"
          ? "payment"
          : data.actionKind === "legal"
            ? "legal"
            : data.actionKind === "close_resolved"
              ? "status_change"
              : data.actionKind === "internal_note"
                ? "note"
                : effect.treatmentKind ?? "note";
      const { error } = await supabase.from("case_events").insert({
        organization_id: data.organizationId,
        case_public_id: data.casePublicId,
        workflow_id: workflowId,
        detection_id: data.representativeDetectionId,
        user_id: context.userId,
        event_kind: eventKind,
        direction: "internal",
        title: data.title ?? ADMIN_CASE_ACTION_LABELS[data.actionKind],
        notes: data.notes,
        metadata: {
          actionKind: data.actionKind,
          settlementStatus: effect.settlementStatus,
        },
      });

      if (error) {
        throw new Error("Nao foi possivel registrar o historico da acao.");
      }
    }

    if (effect.detectionStatus) {
      await updateCaseDetectionsStatus({
        organizationId: data.organizationId,
        representativeDetectionId: data.representativeDetectionId,
        casePublicId: data.casePublicId,
        nextStatus: effect.detectionStatus,
        reason: data.actionKind,
        userId: context.userId,
      });
    }

    revalidateCasePaths(data);

    return {
      status: "success",
      message: successMessage,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel executar a acao do caso.",
    };
  }
}

export async function updateCaseWorkflowAction(formData: FormData) {
  const parsed = updateWorkflowSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    representativeDetectionId: formData.get("representativeDetectionId"),
    stage: formData.get("stage"),
    priority: formData.get("priority"),
    assignedToUserId: optionalString(formData.get("assignedToUserId")),
    nextAction: optionalString(formData.get("nextAction")),
    nextActionDueAt: optionalString(formData.get("nextActionDueAt")),
    notifiedName: optionalString(formData.get("notifiedName")),
    notifiedEmail: optionalString(formData.get("notifiedEmail")),
    notifiedPhone: optionalString(formData.get("notifiedPhone")),
    notifiedDocument: optionalString(formData.get("notifiedDocument")),
    notifiedDomain: optionalString(formData.get("notifiedDomain")),
    notifiedWebsiteUrl: optionalString(formData.get("notifiedWebsiteUrl")),
    summary: optionalString(formData.get("summary")),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para atualizar o workflow do caso.");
  }

  const context = await requirePanelAccess("admin");
  const workflowId = await ensureWorkflow({
    organizationId: parsed.data.organizationId,
    casePublicId: parsed.data.casePublicId,
    representativeDetectionId: parsed.data.representativeDetectionId,
    userId: context.userId,
    stage: parsed.data.stage,
  });
  const supabase = await createClient();
  const { error } = await supabase
    .from("case_workflows")
    .update({
      stage: parsed.data.stage,
      priority: parsed.data.priority,
      assigned_to_user_id: parsed.data.assignedToUserId,
      next_action: parsed.data.nextAction,
      next_action_due_at: normalizeDatetime(parsed.data.nextActionDueAt),
      notified_name: parsed.data.notifiedName,
      notified_email: parsed.data.notifiedEmail,
      notified_phone: parsed.data.notifiedPhone,
      notified_document: parsed.data.notifiedDocument,
      notified_domain: parsed.data.notifiedDomain,
      notified_website_url: parsed.data.notifiedWebsiteUrl,
      summary: parsed.data.summary,
      updated_by_user_id: context.userId,
    })
    .eq("organization_id", parsed.data.organizationId)
    .eq("id", workflowId);

  if (error) {
    throw new Error("Nao foi possivel salvar o workflow do caso.");
  }

  revalidateCasePaths(parsed.data);
}

export async function upsertCaseDocumentAction(formData: FormData) {
  const parsed = documentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    representativeDetectionId: formData.get("representativeDetectionId"),
    documentKind: formData.get("documentKind"),
    status: formData.get("status"),
    title: formData.get("title"),
    notes: optionalString(formData.get("notes")),
    provider: optionalString(formData.get("provider")),
    externalEnvelopeId: optionalString(formData.get("externalEnvelopeId")),
    externalUrl: optionalString(formData.get("externalUrl")),
    externalStatus: optionalString(formData.get("externalStatus")),
    signedAt: optionalString(formData.get("signedAt")),
    sentAt: optionalString(formData.get("sentAt")),
    expiresAt: optionalString(formData.get("expiresAt")),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para salvar o documento do caso.");
  }

  const context = await requirePanelAccess("admin");
  const workflowId = await ensureWorkflow({
    organizationId: parsed.data.organizationId,
    casePublicId: parsed.data.casePublicId,
    representativeDetectionId: parsed.data.representativeDetectionId,
    userId: context.userId,
  });
  const rawFile = formData.get("file");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
  let storageKey: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let sizeBytes: number | null = null;

  if (file) {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("O documento deve ter ate 20MB.");
    }

    storageKey = buildCaseDocumentStorageKey({
      organizationId: parsed.data.organizationId,
      casePublicId: parsed.data.casePublicId,
      documentKind: parsed.data.documentKind,
      fileName: file.name,
    });
    fileName = file.name;
    mimeType = file.type || "application/octet-stream";
    sizeBytes = file.size;

    await uploadCaseDocumentToR2({
      key: storageKey,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: mimeType,
    });
  }

  const supabase = await createClient();

  if (parsed.data.documentKind !== "other") {
    const { error: archiveError } = await supabase
      .from("case_documents")
      .update({
        is_current: false,
        updated_by_user_id: context.userId,
      })
      .eq("organization_id", parsed.data.organizationId)
      .eq("case_public_id", parsed.data.casePublicId)
      .eq("document_kind", parsed.data.documentKind)
      .eq("is_current", true);

    if (archiveError) {
      throw new Error("Nao foi possivel arquivar a versao anterior do documento.");
    }
  }

  const { data: document, error } = await supabase
    .from("case_documents")
    .insert({
      organization_id: parsed.data.organizationId,
      case_public_id: parsed.data.casePublicId,
      workflow_id: workflowId,
      detection_id: parsed.data.representativeDetectionId,
      document_kind: parsed.data.documentKind satisfies DocumentKind,
      status: parsed.data.status satisfies DocumentStatus,
      title: parsed.data.title,
      notes: parsed.data.notes,
      storage_key: storageKey,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      external_url: parsed.data.externalUrl,
      provider: parsed.data.provider,
      external_envelope_id: parsed.data.externalEnvelopeId,
      external_status: parsed.data.externalStatus,
      signed_at: normalizeDatetime(parsed.data.signedAt),
      sent_at: normalizeDatetime(parsed.data.sentAt),
      expires_at: normalizeDatetime(parsed.data.expiresAt),
      created_by_user_id: context.userId,
      updated_by_user_id: context.userId,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !document) {
    throw new Error("Nao foi possivel salvar o documento do caso.");
  }

  await supabase.from("case_events").insert({
    organization_id: parsed.data.organizationId,
    case_public_id: parsed.data.casePublicId,
    workflow_id: workflowId,
    detection_id: parsed.data.representativeDetectionId,
    user_id: context.userId,
    event_kind: "document",
    direction: "internal",
    title: `Documento registrado: ${parsed.data.title}`,
    notes: parsed.data.notes,
    metadata: {
      documentId: document.id,
      documentKind: parsed.data.documentKind,
      status: parsed.data.status,
    },
  });

  revalidateCasePaths(parsed.data);
}

export async function recordCaseCommunicationAction(formData: FormData) {
  const parsed = communicationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    representativeDetectionId: formData.get("representativeDetectionId"),
    communicationKind: formData.get("communicationKind"),
    casePublicIdLabel: requiredString(formData.get("casePublicIdLabel")),
    clientName: requiredString(formData.get("clientName")),
    domain: requiredString(formData.get("domain")),
    sourceUrl: requiredString(formData.get("sourceUrl")),
    finalUrl: optionalString(formData.get("finalUrl")),
    assetTitle: requiredString(formData.get("assetTitle")),
    notifiedName: optionalString(formData.get("notifiedName")),
    notifiedEmail: optionalString(formData.get("notifiedEmail")),
    amountFormatted: optionalString(formData.get("amountFormatted")),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para registrar a comunicacao.");
  }

  const context = await requirePanelAccess("admin");
  const stage = communicationStage(parsed.data.communicationKind);
  const workflowId = await ensureWorkflow({
    organizationId: parsed.data.organizationId,
    casePublicId: parsed.data.casePublicId,
    representativeDetectionId: parsed.data.representativeDetectionId,
    userId: context.userId,
    stage,
  });
  const snapshot = buildCaseCommunicationSnapshot(parsed.data.communicationKind, {
    casePublicId: parsed.data.casePublicId,
    clientName: parsed.data.clientName,
    domain: parsed.data.domain,
    sourceUrl: parsed.data.sourceUrl,
    finalUrl: parsed.data.finalUrl,
    assetTitle: parsed.data.assetTitle,
    notifiedName: parsed.data.notifiedName,
    notifiedEmail: parsed.data.notifiedEmail,
    amountFormatted: parsed.data.amountFormatted,
    portalReference: parsed.data.casePublicIdLabel,
  });
  const supabase = await createClient();
  const { error } = await supabase.from("case_events").insert({
    organization_id: parsed.data.organizationId,
    case_public_id: parsed.data.casePublicId,
    workflow_id: workflowId,
    detection_id: parsed.data.representativeDetectionId,
    user_id: context.userId,
    event_kind: parsed.data.communicationKind,
    direction: "outbound",
    title: COMMUNICATION_KIND_LABELS[parsed.data.communicationKind],
    communication_subject: snapshot.subject,
    communication_body_snapshot: snapshot.body,
    metadata: {
      snapshotKind: snapshot.kind,
    },
  });

  if (error) {
    throw new Error("Nao foi possivel registrar a comunicacao.");
  }

  await updateWorkflowStage({
    workflowId,
    organizationId: parsed.data.organizationId,
    stage,
    userId: context.userId,
  });
  revalidateCasePaths(parsed.data);
}

export async function recordCaseTreatmentAction(formData: FormData) {
  const parsed = treatmentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    representativeDetectionId: formData.get("representativeDetectionId"),
    treatmentKind: formData.get("treatmentKind"),
    title: formData.get("title"),
    notes: optionalString(formData.get("notes")),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para registrar a tratativa.");
  }

  const context = await requirePanelAccess("admin");
  const workflowId = await ensureWorkflow({
    organizationId: parsed.data.organizationId,
    casePublicId: parsed.data.casePublicId,
    representativeDetectionId: parsed.data.representativeDetectionId,
    userId: context.userId,
    stage: "treatment",
  });
  const supabase = await createClient();
  const { error } = await supabase.from("case_events").insert({
    organization_id: parsed.data.organizationId,
    case_public_id: parsed.data.casePublicId,
    workflow_id: workflowId,
    detection_id: parsed.data.representativeDetectionId,
    user_id: context.userId,
    event_kind: parsed.data.treatmentKind,
    direction: "internal",
    title: parsed.data.title || TREATMENT_KIND_LABELS[parsed.data.treatmentKind],
    notes: parsed.data.notes,
  });

  if (error) {
    throw new Error("Nao foi possivel registrar a tratativa.");
  }

  revalidateCasePaths(parsed.data);
}

export async function upsertCaseSettlementAction(formData: FormData) {
  const parsed = settlementSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    representativeDetectionId: formData.get("representativeDetectionId"),
    status: formData.get("status"),
    proposedAmount: optionalString(formData.get("proposedAmount")),
    paymentDueDate: optionalString(formData.get("paymentDueDate")),
    paymentMethod: optionalString(formData.get("paymentMethod")),
    paymentReference: optionalString(formData.get("paymentReference")),
    paymentUrl: optionalString(formData.get("paymentUrl")),
    paidAmount: optionalString(formData.get("paidAmount")),
    paidAt: optionalString(formData.get("paidAt")),
    notes: optionalString(formData.get("notes")),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para salvar a negociacao.");
  }

  const context = await requirePanelAccess("admin");
  const stage = settlementStage(parsed.data.status);
  const workflowId = await ensureWorkflow({
    organizationId: parsed.data.organizationId,
    casePublicId: parsed.data.casePublicId,
    representativeDetectionId: parsed.data.representativeDetectionId,
    userId: context.userId,
    stage,
  });
  const supabase = await createClient();
  const proposedAmountCents = parseAmountToCents(parsed.data.proposedAmount);
  const paidAmountCents = parseAmountToCents(parsed.data.paidAmount);
  const { error } = await supabase.from("case_settlements").upsert(
    {
      organization_id: parsed.data.organizationId,
      case_public_id: parsed.data.casePublicId,
      workflow_id: workflowId,
      status: parsed.data.status,
      proposed_amount_cents: proposedAmountCents,
      proposal_sent_at:
        parsed.data.status === "proposal_sent" ? new Date().toISOString() : undefined,
      payment_method: parsed.data.paymentMethod,
      payment_due_date: normalizeDate(parsed.data.paymentDueDate),
      payment_reference: parsed.data.paymentReference,
      payment_url: parsed.data.paymentUrl,
      paid_amount_cents: paidAmountCents,
      paid_at: normalizeDatetime(parsed.data.paidAt),
      collections_started_at:
        parsed.data.status === "collections" ? new Date().toISOString() : undefined,
      notes: parsed.data.notes,
      updated_by_user_id: context.userId,
      created_by_user_id: context.userId,
    },
    { onConflict: "organization_id,case_public_id" },
  );

  if (error) {
    throw new Error("Nao foi possivel salvar a negociacao do caso.");
  }

  await supabase.from("case_events").insert({
    organization_id: parsed.data.organizationId,
    case_public_id: parsed.data.casePublicId,
    workflow_id: workflowId,
    detection_id: parsed.data.representativeDetectionId,
    user_id: context.userId,
    event_kind: parsed.data.status === "paid" ? "payment" : "negotiation",
    direction: "internal",
    title:
      parsed.data.status === "paid"
        ? "Pagamento registrado"
        : "Negociacao atualizada",
    notes: parsed.data.notes,
    metadata: {
      status: parsed.data.status,
      proposedAmountCents,
      paidAmountCents,
    },
  });

  await updateWorkflowStage({
    workflowId,
    organizationId: parsed.data.organizationId,
    stage,
    userId: context.userId,
  });
  revalidateCasePaths(parsed.data);
}
