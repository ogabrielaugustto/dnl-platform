import "server-only";

import { createClicksignSraEnvelope } from "@/lib/clicksign/client";
import {
  buildSraSigners,
  buildSraTemplateData,
  extractClicksignWebhookIdentifiers,
  extractClicksignWebhookOccurredAt,
  extractClicksignWebhookStatusInput,
  mapClicksignWebhookStatus,
  validateSraSignatureRequest,
  type SraSignatureRequest,
} from "@/lib/clicksign/representation-documents";
import { getAdminCaseDetails, type AdminCaseDetails } from "@/lib/dal/admin-cases";
import { formatPublicId } from "@/lib/public-id";
import { createAdminClient } from "@/lib/supabase/admin";

type SoaSnapshotRow = {
  signer_name: string;
  signer_document: string;
  signer_marital_status: string | null;
  signer_address: string | null;
};

type PlatformSettingsRow = {
  cnpj: string | null;
  legal_representative_name: string | null;
  legal_representative_document: string | null;
  legal_representative_email: string | null;
};

type CaseSraDocumentRow = {
  id: string;
  organization_id: string;
  case_public_id: number;
  workflow_id: string | null;
  detection_id: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
};

export type AdminCaseSraDefaults = {
  caseId: string;
  imageIds: string[];
  notifiedLegalName: string;
  notifiedCnpj: string;
  notifiedAddress: string;
  notifiedDomain: string;
  notifiedSignerName: string;
  notifiedSignerEmail: string;
  notifiedSignerCpf: string;
  notifiedSignerRole: string;
  photographerName: string;
  photographerMaritalStatus: string;
  photographerCpf: string;
  photographerAddress: string;
  dnlCnpj: string;
  dnlSignerName: string;
  dnlSignerEmail: string;
  dnlSignerCpf: string;
  amount: string;
  amountInWords: string;
  paymentDueDate: string;
  witness1Name: string;
  witness1Email: string;
  witness1Cpf: string;
  witness2Name: string;
  witness2Email: string;
  witness2Cpf: string;
};

export type AdminCaseSraFormInput = Omit<
  AdminCaseSraDefaults,
  "caseId" | "imageIds" | "dnlCnpj"
>;

function trim(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function formatAmountInput(cents: number | null | undefined) {
  if (!cents) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function parseAmountToCents(value: string) {
  const normalized = value
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

function getSraTemplateKey() {
  const templateKey = process.env.CLICKSIGN_SRA_TEMPLATE_KEY?.trim();
  if (!templateKey) {
    throw new Error("Configure CLICKSIGN_SRA_TEMPLATE_KEY antes de enviar o SRA.");
  }

  return templateKey;
}

async function loadLegalDefaults(organizationId: string) {
  const admin = createAdminClient();
  const [soaResult, platformResult] = await Promise.all([
    admin
      .from("client_representation_documents")
      .select("signer_name, signer_document, signer_marital_status, signer_address")
      .eq("organization_id", organizationId)
      .eq("document_kind", "soa")
      .eq("status", "signed")
      .eq("is_current", true)
      .limit(1)
      .maybeSingle<SoaSnapshotRow>(),
    admin
      .from("platform_settings")
      .select(
        "cnpj, legal_representative_name, legal_representative_document, legal_representative_email",
      )
      .eq("id", true)
      .maybeSingle<PlatformSettingsRow>(),
  ]);

  if (soaResult.error) {
    throw new Error("Nao foi possivel carregar o SOA assinado do cliente.");
  }
  if (platformResult.error) {
    throw new Error("Nao foi possivel carregar os dados institucionais da DNL.");
  }

  return {
    soa: soaResult.data,
    platform: platformResult.data,
  };
}

export async function getAdminCaseSraDefaults(
  adminCase: AdminCaseDetails,
): Promise<AdminCaseSraDefaults> {
  const { soa, platform } = await loadLegalDefaults(adminCase.organization.id);
  const domainOwner = adminCase.siteSignals.domainOwner;
  const notifiedLegalName =
    adminCase.workflow.notified.name ??
    domainOwner?.organization ??
    domainOwner?.name ??
    "";
  const imageIds = Array.from(
    new Set(adminCase.placements.map((placement) => formatPublicId(placement.asset.publicId))),
  );

  return {
    caseId: formatPublicId(adminCase.publicId),
    imageIds,
    notifiedLegalName,
    notifiedCnpj:
      adminCase.workflow.notified.document ??
      adminCase.siteSignals.cnpjCandidates[0] ??
      domainOwner?.document ??
      "",
    notifiedAddress: "",
    notifiedDomain: adminCase.domain === "site-nao-identificado" ? "" : adminCase.domain,
    notifiedSignerName: domainOwner?.name ?? adminCase.workflow.notified.name ?? "",
    notifiedSignerEmail:
      adminCase.workflow.notified.email ??
      domainOwner?.email ??
      adminCase.siteSignals.emails[0] ??
      "",
    notifiedSignerCpf: "",
    notifiedSignerRole: "",
    photographerName: trim(soa?.signer_name),
    photographerMaritalStatus: trim(soa?.signer_marital_status),
    photographerCpf: trim(soa?.signer_document),
    photographerAddress: trim(soa?.signer_address),
    dnlCnpj: trim(platform?.cnpj),
    dnlSignerName: trim(platform?.legal_representative_name),
    dnlSignerEmail: trim(platform?.legal_representative_email),
    dnlSignerCpf: trim(platform?.legal_representative_document),
    amount: formatAmountInput(adminCase.workflow.settlement?.proposedAmountCents),
    amountInWords: "",
    paymentDueDate: adminCase.workflow.settlement?.paymentDueDate ?? "",
    witness1Name: "",
    witness1Email: "",
    witness1Cpf: "",
    witness2Name: "",
    witness2Email: "",
    witness2Cpf: "",
  };
}

async function ensureCaseWorkflow(params: {
  adminCase: AdminCaseDetails;
  userId: string;
}) {
  const admin = createAdminClient();
  if (params.adminCase.workflow.id) {
    return params.adminCase.workflow.id;
  }

  const { data, error } = await admin
    .from("case_workflows")
    .insert({
      organization_id: params.adminCase.organization.id,
      case_public_id: params.adminCase.publicId,
      representative_detection_id: params.adminCase.representativeDetectionId,
      stage: "agreement_signature",
      created_by_user_id: params.userId,
      updated_by_user_id: params.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("Nao foi possivel preparar o workflow do caso.");
  }

  return data.id;
}

export async function requestAdminCaseSra(params: {
  organizationId: string;
  casePublicId: number;
  userId: string;
  form: AdminCaseSraFormInput;
}) {
  const adminCase = await getAdminCaseDetails(params.organizationId, params.casePublicId);
  if (!adminCase) {
    throw new Error("Caso nao encontrado.");
  }

  const pendingSra = adminCase.workflow.documents.find(
    (document) =>
      document.kind === "sra" &&
      document.status === "signature_requested" &&
      document.provider === "clicksign",
  );
  if (pendingSra) {
    return {
      status: "already_pending" as const,
      documentId: pendingSra.id,
      message: "Este caso ja possui um SRA aguardando assinaturas na Clicksign.",
    };
  }

  const defaults = await getAdminCaseSraDefaults(adminCase);
  const requestInput: Record<keyof SraSignatureRequest, unknown> = {
    ...params.form,
    dnlCnpj: defaults.dnlCnpj,
    caseId: defaults.caseId,
    imageIds: defaults.imageIds,
    amountCents: parseAmountToCents(params.form.amount),
  };
  const validation = validateSraSignatureRequest(requestInput);
  if (!validation.ok) {
    return {
      status: "validation_error" as const,
      field: validation.field,
      message: validation.message,
    };
  }

  const templateKey = getSraTemplateKey();
  const templateData = buildSraTemplateData(validation.data);
  const signers = buildSraSigners(validation.data);
  const clicksign = await createClicksignSraEnvelope({
    templateKey,
    fileName: `sra-caso-${defaults.caseId}.docx`,
    caseId: defaults.caseId,
    templateData,
    signers,
    metadata: {
      organizationId: params.organizationId,
      casePublicId: params.casePublicId,
      documentKind: "sra",
    },
  });
  const admin = createAdminClient();
  const workflowId = await ensureCaseWorkflow({ adminCase, userId: params.userId });
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { error: archiveError } = await admin
    .from("case_documents")
    .update({ is_current: false, updated_by_user_id: params.userId })
    .eq("organization_id", params.organizationId)
    .eq("case_public_id", params.casePublicId)
    .eq("document_kind", "sra")
    .eq("is_current", true);

  if (archiveError) {
    throw new Error("O SRA foi criado na Clicksign, mas a versao anterior nao pode ser arquivada.");
  }

  const { data: document, error: documentError } = await admin
    .from("case_documents")
    .insert({
      organization_id: params.organizationId,
      case_public_id: params.casePublicId,
      workflow_id: workflowId,
      detection_id: adminCase.representativeDetectionId,
      document_kind: "sra",
      status: "signature_requested",
      title: `SRA do caso ${defaults.caseId}`,
      provider: "clicksign",
      external_envelope_id: clicksign.envelopeId,
      external_status: "running",
      sent_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      metadata: {
        templateKey,
        providerEnvironment: clicksign.environment,
        providerDocumentId: clicksign.documentId,
        templateData,
        signerSnapshot: signers,
        providerSigners: clicksign.signers,
        providerPayload: clicksign.raw,
      },
      created_by_user_id: params.userId,
      updated_by_user_id: params.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (documentError || !document) {
    throw new Error("O SRA foi criado na Clicksign, mas nao foi registrado no caso.");
  }

  const [workflowResult, settlementResult, eventResult] = await Promise.all([
    admin
      .from("case_workflows")
      .update({
        stage: "agreement_signature",
        next_action: "Aguardar assinaturas do SRA",
        notified_name: validation.data.notifiedSignerName,
        notified_email: validation.data.notifiedSignerEmail,
        notified_document: validation.data.notifiedCnpj,
        notified_domain: validation.data.notifiedDomain,
        updated_by_user_id: params.userId,
      })
      .eq("organization_id", params.organizationId)
      .eq("id", workflowId),
    admin.from("case_settlements").upsert(
      {
        organization_id: params.organizationId,
        case_public_id: params.casePublicId,
        workflow_id: workflowId,
        status: "sra_signature_pending",
        proposed_amount_cents: validation.data.amountCents,
        payment_due_date: validation.data.paymentDueDate,
        sra_document_id: document.id,
        updated_by_user_id: params.userId,
        created_by_user_id: params.userId,
      },
      { onConflict: "organization_id,case_public_id" },
    ),
    admin.from("case_events").insert({
      organization_id: params.organizationId,
      case_public_id: params.casePublicId,
      workflow_id: workflowId,
      detection_id: adminCase.representativeDetectionId,
      user_id: params.userId,
      event_kind: "document",
      direction: "outbound",
      title: "SRA enviado para assinatura",
      metadata: {
        actionKind: "register_sra",
        documentId: document.id,
        provider: "clicksign",
        externalEnvelopeId: clicksign.envelopeId,
        signerKinds: signers.map((signer) => signer.kind),
      },
    }),
  ]);

  if (workflowResult.error || settlementResult.error || eventResult.error) {
    throw new Error("O SRA foi enviado, mas o andamento do caso nao foi atualizado por completo.");
  }

  return {
    status: "signature_requested" as const,
    documentId: document.id,
    message: `SRA enviado pela Clicksign para ${signers.length} signatario(s).`,
  };
}

export async function applyClicksignCaseSraWebhook(payload: unknown) {
  const ids = extractClicksignWebhookIdentifiers(payload);
  const statusInput = extractClicksignWebhookStatusInput(payload);
  const providerStatus = mapClicksignWebhookStatus(statusInput);

  if ((!ids.envelopeId && !ids.documentId) || !providerStatus) {
    return { matched: false, updated: false };
  }

  const nextStatus =
    providerStatus === "cancelled" || providerStatus === "failed"
      ? "rejected"
      : providerStatus;
  const admin = createAdminClient();
  const selectColumns =
    "id, organization_id, case_public_id, workflow_id, detection_id, status, metadata";
  const envelopeResult = ids.envelopeId
    ? await admin
        .from("case_documents")
        .select(selectColumns)
        .eq("document_kind", "sra")
        .eq("provider", "clicksign")
        .eq("external_envelope_id", ids.envelopeId)
        .eq("is_current", true)
        .limit(1)
        .maybeSingle<CaseSraDocumentRow>()
    : { data: null, error: null };
  const documentResult =
    !envelopeResult.data && ids.documentId
      ? await admin
          .from("case_documents")
          .select(selectColumns)
          .eq("document_kind", "sra")
          .eq("provider", "clicksign")
          .contains("metadata", { providerDocumentId: ids.documentId })
          .eq("is_current", true)
          .limit(1)
          .maybeSingle<CaseSraDocumentRow>()
      : { data: null, error: null };
  const document = envelopeResult.data ?? documentResult.data;
  const findError = envelopeResult.error ?? documentResult.error;

  if (findError) {
    throw new Error("Nao foi possivel localizar o SRA pelo envelope Clicksign.");
  }
  if (!document) {
    return { matched: false, updated: false };
  }

  const eventAt = extractClicksignWebhookOccurredAt(payload) ?? new Date().toISOString();
  const { error: updateError } = await admin
    .from("case_documents")
    .update({
      status: nextStatus,
      external_status:
        statusInput.documentStatus ?? statusInput.envelopeStatus ?? statusInput.eventName,
      signed_at: nextStatus === "signed" ? eventAt : undefined,
      metadata: {
        ...(document.metadata ?? {}),
        lastEventName: statusInput.eventName,
        lastEventAt: eventAt,
        webhookPayload: payload,
      },
    })
    .eq("id", document.id)
    .eq("organization_id", document.organization_id);

  if (updateError) {
    throw new Error("Nao foi possivel atualizar o SRA pelo webhook Clicksign.");
  }

  if (nextStatus === "signed") {
    const settlementResult = await admin
      .from("case_settlements")
      .update({ status: "sra_signed", sra_document_id: document.id })
      .eq("organization_id", document.organization_id)
      .eq("case_public_id", document.case_public_id);

    if (settlementResult.error) {
      throw new Error("O SRA foi assinado, mas o acordo do caso nao foi atualizado.");
    }

    if (document.status !== "signed") {
      const eventResult = await admin.from("case_events").insert({
          organization_id: document.organization_id,
          case_public_id: document.case_public_id,
          workflow_id: document.workflow_id,
          detection_id: document.detection_id,
          event_kind: "document",
          direction: "system",
          title: "SRA assinado",
          metadata: {
            documentId: document.id,
            provider: "clicksign",
            externalEnvelopeId: ids.envelopeId,
          },
        });
      if (eventResult.error) {
        throw new Error("O SRA foi assinado, mas o historico do caso nao foi atualizado.");
      }
    }
  }

  return { matched: true, updated: true, status: nextStatus };
}
