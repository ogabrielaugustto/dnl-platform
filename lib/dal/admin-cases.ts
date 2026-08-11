import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import {
  ALL_DOCUMENT_KINDS,
  DOCUMENT_KIND_LABELS,
  buildCaseWorkflowReadiness,
  inferWorkflowStageFromStatus,
  resolveSettlementDisplayStatus,
  type CaseEventKind,
  type DocumentKind,
  type DocumentStatus,
  type SettlementStatus,
  type WorkflowStage,
} from "@/lib/admin-case-workflow";
import {
  buildAdminEvidenceImageUrl,
  buildAdminEvidenceMatchedImageUrl,
} from "@/lib/admin-evidence-assets";
import {
  type DetectionEvidenceCoverage,
  type DetectionSiteSnapshot,
} from "@/lib/dal/detections";
import {
  buildCaseSiteSignals,
  isMissingSiteIntelDomainOwnerSchemaError,
  type CaseSiteIntelForSignals,
  type CaseSiteSignals,
} from "@/lib/dal/admin-case-site-signals";
import { buildAssetPublicUrl } from "@/lib/r2";
import { createClient } from "@/lib/server";

type OrganizationRow = {
  id: string;
  name: string;
  billing_email: string | null;
};

type AssetRow = {
  id: string;
  public_id: number;
  organization_id: string;
  title: string;
};

type AssetFileRow = {
  asset_id: string;
  public_url: string | null;
  storage_key: string | null;
  original_file_name: string | null;
};

type DetectionRow = {
  id: string;
  public_id: number;
  case_public_id: number;
  organization_id: string;
  asset_id: string;
  source_url: string;
  canonical_source_url: string;
  matched_image_url: string | null;
  page_title: string | null;
  domain: string | null;
  confidence_score: number | null;
  vision_payload: Record<string, unknown> | null;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
  last_scanned_at: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  created_at: string;
};

type DetectionEvidenceRow = {
  id: string;
  detection_id: string;
  scan_run_id: string | null;
  screenshot_storage_key: string | null;
  matched_image_storage_key: string | null;
  captured_at: string | null;
  capture_status: string;
  capture_error_message: string | null;
  metadata: Record<string, unknown> | null;
  source_url_snapshot: string | null;
  matched_image_url_snapshot: string | null;
  created_at: string;
};

type SiteIntelInvestigationRow = {
  detection_id: string;
  status: string;
  primary_email: string | null;
  primary_phone: string | null;
  primary_cnpj: string | null;
  contact_candidates: Array<Record<string, unknown>> | null;
  domain_owner_name: string | null;
  domain_owner_organization: string | null;
  domain_owner_document: string | null;
  domain_owner_email: string | null;
  domain_owner_source_type: string | null;
  domain_owner_source_url: string | null;
  domain_owner_contact_status: string | null;
  completed_at: string | null;
  requested_at: string;
};

type DetectionActionRow = {
  id: string;
  detection_id: string;
  user_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RightsOwnershipConfirmationRow = {
  id: string;
  detection_id: string;
  asset_public_id: number;
  case_public_id: number;
  signer_full_name: string;
  signer_cpf: string;
  signer_role: string;
  signing_city: string;
  statement_date: string;
  signature_svg: string;
  template_version: string;
  body_snapshot: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type CaseWorkflowRow = {
  id: string;
  organization_id: string;
  case_public_id: number;
  representative_detection_id: string | null;
  stage: WorkflowStage;
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to_user_id: string | null;
  next_action: string | null;
  next_action_due_at: string | null;
  notified_name: string | null;
  notified_email: string | null;
  notified_phone: string | null;
  notified_document: string | null;
  notified_domain: string | null;
  notified_website_url: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

type CaseDocumentRow = {
  id: string;
  organization_id: string;
  case_public_id: number;
  workflow_id: string | null;
  detection_id: string | null;
  rights_ownership_confirmation_id: string | null;
  platform_legal_document_id: string | null;
  document_kind: DocumentKind;
  status: DocumentStatus;
  title: string;
  notes: string | null;
  storage_key: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  external_url: string | null;
  provider: string | null;
  external_envelope_id: string | null;
  external_status: string | null;
  signed_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

type CaseEventRow = {
  id: string;
  organization_id: string;
  case_public_id: number;
  workflow_id: string | null;
  detection_id: string | null;
  user_id: string | null;
  event_kind: CaseEventKind;
  direction: "internal" | "outbound" | "inbound" | "system";
  title: string;
  body_snapshot: string | null;
  notes: string | null;
  communication_subject: string | null;
  communication_body_snapshot: string | null;
  occurred_at: string;
  created_at: string;
};

type CaseSettlementRow = {
  id: string;
  organization_id: string;
  case_public_id: number;
  workflow_id: string | null;
  status: SettlementStatus;
  proposed_amount_cents: number | null;
  currency: string;
  proposal_sent_at: string | null;
  sra_document_id: string | null;
  payment_method: string | null;
  payment_due_date: string | null;
  payment_reference: string | null;
  payment_url: string | null;
  paid_amount_cents: number | null;
  paid_at: string | null;
  receipt_document_id: string | null;
  collections_started_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PlatformLegalDocumentRow = {
  id: string;
  document_kind: Extract<DocumentKind, "dnl_cnpj" | "dnl_social_contract" | "other">;
  title: string;
  description: string | null;
  storage_key: string | null;
  public_url: string | null;
  external_url: string | null;
  status: DocumentStatus;
  version_label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DetectionMatchType = "full" | "partial" | "page" | "unknown";

export type AdminCasePlacementEvidence = {
  id: string;
  scanRunId: string | null;
  screenshotUrl: string | null;
  matchedImageUrl: string | null;
  matchedImageSourceUrl: string | null;
  capturedAt: string | null;
  captureStatus: string;
  captureErrorMessage: string | null;
  sourceUrlSnapshot: string | null;
  createdAt: string;
  finalUrl: string | null;
  siteSnapshot: DetectionSiteSnapshot | null;
};

export type AdminCasePlacement = {
  id: string;
  publicId: number;
  casePublicId: number;
  organizationId: string;
  asset: {
    id: string;
    publicId: number;
    title: string;
    primaryImageUrl: string | null;
    originalFileName: string | null;
  };
  sourceUrl: string;
  canonicalSourceUrl: string;
  matchedImageUrl: string | null;
  pageTitle: string | null;
  domain: string | null;
  normalizedDomain: string;
  confidenceScore: number | null;
  status: string;
  matchType: DetectionMatchType;
  firstSeenAt: string;
  lastSeenAt: string;
  reviewedAt: string | null;
  latestEvidence: AdminCasePlacementEvidence | null;
};

export type AdminCasePlacementSummary = {
  id: string;
  publicId: number;
  sourceUrl: string;
  pageTitle: string | null;
  status: string;
  matchType: DetectionMatchType;
  confidenceScore: number | null;
  lastSeenAt: string;
  reviewedAt: string | null;
  matchedImageUrl: string | null;
  latestEvidence: AdminCasePlacementEvidence | null;
};

export type AdminCasePageGroup = {
  key: string;
  sourceUrl: string;
  canonicalSourceUrl: string;
  pageTitle: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  placementsCount: number;
  capturedEvidenceCount: number;
  evidenceCoverage: DetectionEvidenceCoverage;
  representativeDetectionId: string;
  placements: AdminCasePlacementSummary[];
};

export type AdminCaseActionHistoryItem = {
  id: string;
  detectionId: string;
  userId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  notes: string | null;
  reason: string | null;
  createdAt: string;
};

export type AdminSignedDeclarationItem = {
  id: string;
  detectionId: string;
  assetPublicId: number;
  casePublicId: number;
  signerFullName: string;
  signerCpf: string;
  signerRole: string;
  signingCity: string;
  statementDate: string;
  signatureSvg: string;
  templateVersion: string;
  body: string;
  createdAt: string;
};

export type AdminCaseWorkflowDocument = {
  id: string;
  kind: DocumentKind;
  status: DocumentStatus;
  title: string;
  source: "case_document" | "rights_ownership_confirmation" | "platform_legal_document" | "missing";
  notes: string | null;
  downloadUrl: string | null;
  externalUrl: string | null;
  provider: string | null;
  externalEnvelopeId: string | null;
  externalStatus: string | null;
  signedAt: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  fileName: string | null;
  createdAt: string | null;
};

export type AdminCaseWorkflowEvent = {
  id: string;
  kind: CaseEventKind | string;
  direction: "internal" | "outbound" | "inbound" | "system";
  title: string;
  body: string | null;
  notes: string | null;
  communicationSubject: string | null;
  communicationBody: string | null;
  actorName: string | null;
  actorEmail: string | null;
  occurredAt: string;
  source: "workflow" | "detection_action";
};

export type AdminCaseSettlement = {
  id: string;
  status: SettlementStatus;
  displayStatus: SettlementStatus;
  proposedAmountCents: number | null;
  proposedAmountFormatted: string | null;
  currency: string;
  proposalSentAt: string | null;
  paymentMethod: string | null;
  paymentDueDate: string | null;
  paymentReference: string | null;
  paymentUrl: string | null;
  paidAmountCents: number | null;
  paidAmountFormatted: string | null;
  paidAt: string | null;
  collectionsStartedAt: string | null;
  notes: string | null;
};

export type AdminCaseWorkflowState = {
  id: string | null;
  stage: WorkflowStage;
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  notified: {
    name: string | null;
    email: string | null;
    phone: string | null;
    document: string | null;
    domain: string | null;
    websiteUrl: string | null;
  };
  summary: string | null;
  documents: AdminCaseWorkflowDocument[];
  events: AdminCaseWorkflowEvent[];
  settlement: AdminCaseSettlement | null;
  readiness: ReturnType<typeof buildCaseWorkflowReadiness>;
  updatedAt: string | null;
};

export type AdminCaseListItem = {
  key: string;
  publicId: number;
  representativeDetectionId: string;
  detectionPublicIds: number[];
  organization: {
    id: string;
    name: string;
    billingEmail: string | null;
  };
  asset: AdminCasePlacement["asset"];
  domain: string;
  normalizedDomain: string;
  primaryPageTitle: string | null;
  sourceUrl: string;
  finalUrl: string | null;
  matchedImageUrl: string | null;
  screenshotUrl: string | null;
  status: string;
  firstSeenAt: string;
  latestSeenAt: string;
  clientReviewedAt: string | null;
  evidenceCoverage: DetectionEvidenceCoverage;
  pagesCount: number;
  placementsCount: number;
  capturedEvidenceCount: number;
  siteSignals: CaseSiteSignals;
  latestAction: {
    action: string;
    actorName: string | null;
    actorEmail: string | null;
    createdAt: string;
    fromStatus: string | null;
    toStatus: string | null;
    notes: string | null;
    reason: string | null;
  } | null;
  latestSignedDeclaration: AdminSignedDeclarationItem | null;
  signedDeclarations: AdminSignedDeclarationItem[];
  actionHistory: AdminCaseActionHistoryItem[];
  workflow: AdminCaseWorkflowState;
  pages: AdminCasePageGroup[];
  placements: AdminCasePlacement[];
};

export type AdminCaseDetails = AdminCaseListItem;

function getMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  return metadata[key] ?? null;
}

function getEvidenceFinalUrl(metadata: Record<string, unknown> | null | undefined) {
  const finalUrl = getMetadataValue(metadata, "finalUrl");
  return typeof finalUrl === "string" && finalUrl.length > 0 ? finalUrl : null;
}

function getSiteSnapshot(
  metadata: Record<string, unknown> | null | undefined,
): DetectionSiteSnapshot | null {
  const candidate = getMetadataValue(metadata, "siteSnapshot");

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const snapshot = candidate as Record<string, unknown>;
  const rdapCandidate = snapshot.rdap;
  const rdap =
    rdapCandidate && typeof rdapCandidate === "object"
      ? (rdapCandidate as DetectionSiteSnapshot["rdap"])
      : null;

  return {
    domain: typeof snapshot.domain === "string" ? snapshot.domain : null,
    finalUrl: typeof snapshot.finalUrl === "string" ? snapshot.finalUrl : "",
    title: typeof snapshot.title === "string" ? snapshot.title : null,
    description: typeof snapshot.description === "string" ? snapshot.description : null,
    siteName: typeof snapshot.siteName === "string" ? snapshot.siteName : null,
    cnpjCandidates: Array.isArray(snapshot.cnpjCandidates)
      ? snapshot.cnpjCandidates.filter((item): item is string => typeof item === "string")
      : [],
    emails: Array.isArray(snapshot.emails)
      ? snapshot.emails.filter((item): item is string => typeof item === "string")
      : [],
    phones: Array.isArray(snapshot.phones)
      ? snapshot.phones.filter((item): item is string => typeof item === "string")
      : [],
    rdap,
  };
}

function mapSiteIntelForSignals(row: SiteIntelInvestigationRow): CaseSiteIntelForSignals {
  const hasDomainOwner =
    row.domain_owner_name ||
    row.domain_owner_organization ||
    row.domain_owner_document ||
    row.domain_owner_email ||
    row.domain_owner_source_type ||
    row.domain_owner_source_url ||
    row.domain_owner_contact_status;

  return {
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    primaryCnpj: row.primary_cnpj,
    contactCandidates: Array.isArray(row.contact_candidates) ? row.contact_candidates : [],
    domainOwner: hasDomainOwner
      ? {
          name: row.domain_owner_name,
          organization: row.domain_owner_organization,
          document: row.domain_owner_document,
          email: row.domain_owner_email,
          sourceType: row.domain_owner_source_type,
          sourceUrl: row.domain_owner_source_url,
          contactStatus: row.domain_owner_contact_status,
        }
      : null,
  };
}

async function loadSiteIntelInvestigations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  detectionIds: string[],
) {
  const currentResult = await supabase
    .from("detection_site_intel_investigations")
    .select(
      "detection_id, status, primary_email, primary_phone, primary_cnpj, contact_candidates, domain_owner_name, domain_owner_organization, domain_owner_document, domain_owner_email, domain_owner_source_type, domain_owner_source_url, domain_owner_contact_status, completed_at, requested_at",
    )
    .in("detection_id", detectionIds)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("requested_at", { ascending: false })
    .returns<SiteIntelInvestigationRow[]>();

  if (!isMissingSiteIntelDomainOwnerSchemaError(currentResult.error)) {
    return currentResult;
  }

  const legacyResult = await supabase
    .from("detection_site_intel_investigations")
    .select(
      "detection_id, status, primary_email, primary_phone, primary_cnpj, contact_candidates, completed_at, requested_at",
    )
    .in("detection_id", detectionIds)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("requested_at", { ascending: false })
    .returns<
      Array<
        Pick<
          SiteIntelInvestigationRow,
          | "detection_id"
          | "status"
          | "primary_email"
          | "primary_phone"
          | "primary_cnpj"
          | "contact_candidates"
          | "completed_at"
          | "requested_at"
        >
      >
    >();

  return {
    data:
      legacyResult.data?.map((row) => ({
        ...row,
        domain_owner_name: null,
        domain_owner_organization: null,
        domain_owner_document: null,
        domain_owner_email: null,
        domain_owner_source_type: null,
        domain_owner_source_url: null,
        domain_owner_contact_status: null,
      })) ?? null,
    error: legacyResult.error,
  };
}

function parseNormalizedDomain(
  params: Pick<DetectionRow, "domain" | "source_url" | "canonical_source_url">,
) {
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

function parseMatchType(visionPayload: Record<string, unknown> | null | undefined): DetectionMatchType {
  const matchType = visionPayload?.matchType;

  if (matchType === "full" || matchType === "partial" || matchType === "page") {
    return matchType;
  }

  return "unknown";
}

function compareOptionalNumbersDesc(left: number | null, right: number | null) {
  return (right ?? -1) - (left ?? -1);
}

function compareIsoDatesDesc(left: string | null, right: string | null) {
  return new Date(right ?? 0).getTime() - new Date(left ?? 0).getTime();
}

function comparePlacementsDesc(
  left: Pick<AdminCasePlacement, "lastSeenAt" | "confidenceScore" | "id">,
  right: Pick<AdminCasePlacement, "lastSeenAt" | "confidenceScore" | "id">,
) {
  const byDate = compareIsoDatesDesc(left.lastSeenAt, right.lastSeenAt);

  if (byDate !== 0) {
    return byDate;
  }

  const byScore = compareOptionalNumbersDesc(left.confidenceScore, right.confidenceScore);

  if (byScore !== 0) {
    return byScore;
  }

  return left.id.localeCompare(right.id);
}

function pickEarliestIsoDate(left: string, right: string) {
  return new Date(left).getTime() <= new Date(right).getTime() ? left : right;
}

function getPageEvidenceCoverage(
  placements: Array<Pick<AdminCasePlacement, "latestEvidence">>,
): DetectionEvidenceCoverage {
  const total = placements.length;
  const capturedCount = placements.filter(
    (placement) => placement.latestEvidence?.captureStatus === "captured",
  ).length;
  const hasPending = placements.some((placement) => {
    const status = placement.latestEvidence?.captureStatus;
    return !status || status === "pending" || status === "processing";
  });

  if (capturedCount === total) {
    return "captured";
  }

  if (capturedCount > 0) {
    return "partial";
  }

  if (hasPending) {
    return "pending";
  }

  return "failed";
}

function getIncidentEvidenceCoverage(
  pageCoverages: DetectionEvidenceCoverage[],
): DetectionEvidenceCoverage {
  if (pageCoverages.length === 0) {
    return "pending";
  }

  if (pageCoverages.every((coverage) => coverage === "captured")) {
    return "captured";
  }

  if (pageCoverages.some((coverage) => coverage === "captured" || coverage === "partial")) {
    return "partial";
  }

  if (pageCoverages.some((coverage) => coverage === "pending")) {
    return "pending";
  }

  return "failed";
}

function resolveCaseStatus(statuses: string[]) {
  if (statuses.includes("unauthorized")) {
    return "unauthorized";
  }

  if (statuses.includes("takedown_sent")) {
    return "takedown_sent";
  }

  if (statuses.includes("resolved")) {
    return "resolved";
  }

  return statuses[0] ?? "unauthorized";
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))),
  );
}

function buildCaseKey(params: { organizationId: string; casePublicId: number }) {
  return `${params.organizationId}:${params.casePublicId}`;
}

function buildCaseDocumentDownloadUrl(params: {
  organizationId: string;
  casePublicId: number;
  documentId: string;
}) {
  return `/api/admin/cases/${params.organizationId}/${params.casePublicId}/documents/${params.documentId}`;
}

function formatMoney(cents: number | null, currency: string) {
  if (typeof cents !== "number") {
    return null;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function sortDocuments(left: AdminCaseWorkflowDocument, right: AdminCaseWorkflowDocument) {
  const leftIndex = ALL_DOCUMENT_KINDS.indexOf(left.kind);
  const rightIndex = ALL_DOCUMENT_KINDS.indexOf(right.kind);

  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }

  return (right.createdAt ?? "").localeCompare(left.createdAt ?? "");
}

function parseActionReason(metadata: Record<string, unknown> | null | undefined) {
  const reason = getMetadataValue(metadata, "reason");
  return typeof reason === "string" && reason.trim().length > 0 ? reason : null;
}

function mapEvidence(evidence: DetectionEvidenceRow): AdminCasePlacementEvidence {
  return {
    id: evidence.id,
    scanRunId: evidence.scan_run_id,
    screenshotUrl: evidence.screenshot_storage_key
      ? buildAdminEvidenceImageUrl(evidence.detection_id, evidence.id)
      : null,
    matchedImageUrl: evidence.matched_image_storage_key
      ? buildAdminEvidenceMatchedImageUrl(evidence.detection_id, evidence.id)
      : null,
    matchedImageSourceUrl: evidence.matched_image_url_snapshot,
    capturedAt: evidence.captured_at,
    captureStatus: evidence.capture_status,
    captureErrorMessage: evidence.capture_error_message,
    sourceUrlSnapshot: evidence.source_url_snapshot,
    createdAt: evidence.created_at,
    finalUrl: getEvidenceFinalUrl(evidence.metadata),
    siteSnapshot: getSiteSnapshot(evidence.metadata),
  };
}

function mapCaseDocument(
  document: CaseDocumentRow,
  organizationId: string,
): AdminCaseWorkflowDocument {
  return {
    id: document.id,
    kind: document.document_kind,
    status: document.status,
    title: document.title,
    source: "case_document",
    notes: document.notes,
    downloadUrl: document.storage_key
      ? buildCaseDocumentDownloadUrl({
          organizationId,
          casePublicId: document.case_public_id,
          documentId: document.id,
        })
      : null,
    externalUrl: document.external_url,
    provider: document.provider,
    externalEnvelopeId: document.external_envelope_id,
    externalStatus: document.external_status,
    signedAt: document.signed_at,
    sentAt: document.sent_at,
    expiresAt: document.expires_at,
    fileName: document.file_name,
    createdAt: document.created_at,
  };
}

function mapPlatformDocument(document: PlatformLegalDocumentRow): AdminCaseWorkflowDocument {
  return {
    id: `platform:${document.id}`,
    kind: document.document_kind,
    status: document.status,
    title: document.title,
    source: "platform_legal_document",
    notes: document.description,
    downloadUrl: null,
    externalUrl: document.external_url ?? document.public_url,
    provider: null,
    externalEnvelopeId: null,
    externalStatus: null,
    signedAt: null,
    sentAt: null,
    expiresAt: null,
    fileName: document.version_label,
    createdAt: document.created_at,
  };
}

function mapSignedDeclarationDocument(
  declaration: AdminSignedDeclarationItem,
): AdminCaseWorkflowDocument {
  return {
    id: `rhf:${declaration.id}`,
    kind: "rhf",
    status: "signed",
    title: "RHF assinado no portal",
    source: "rights_ownership_confirmation",
    notes: `Assinado por ${declaration.signerFullName}`,
    downloadUrl: null,
    externalUrl: null,
    provider: "portal_dnl",
    externalEnvelopeId: declaration.id,
    externalStatus: "signed",
    signedAt: declaration.createdAt,
    sentAt: null,
    expiresAt: null,
    fileName: null,
    createdAt: declaration.createdAt,
  };
}

function mapSettlement(settlement: CaseSettlementRow | undefined): AdminCaseSettlement | null {
  if (!settlement) {
    return null;
  }

  const displayStatus = resolveSettlementDisplayStatus({
    status: settlement.status,
    paymentDueDate: settlement.payment_due_date,
    paidAt: settlement.paid_at,
  });

  return {
    id: settlement.id,
    status: settlement.status,
    displayStatus,
    proposedAmountCents: settlement.proposed_amount_cents,
    proposedAmountFormatted: formatMoney(
      settlement.proposed_amount_cents,
      settlement.currency,
    ),
    currency: settlement.currency,
    proposalSentAt: settlement.proposal_sent_at,
    paymentMethod: settlement.payment_method,
    paymentDueDate: settlement.payment_due_date,
    paymentReference: settlement.payment_reference,
    paymentUrl: settlement.payment_url,
    paidAmountCents: settlement.paid_amount_cents,
    paidAmountFormatted: formatMoney(settlement.paid_amount_cents, settlement.currency),
    paidAt: settlement.paid_at,
    collectionsStartedAt: settlement.collections_started_at,
    notes: settlement.notes,
  };
}

function buildWorkflowDocuments(params: {
  organizationId: string;
  casePublicId: number;
  caseDocuments: CaseDocumentRow[];
  latestSignedDeclaration: AdminSignedDeclarationItem | null;
  platformDocumentsByKind: Map<DocumentKind, PlatformLegalDocumentRow>;
  visibleKinds: DocumentKind[];
}) {
  const documentsByKind = new Map<DocumentKind, AdminCaseWorkflowDocument>();

  for (const document of params.caseDocuments.filter((item) => item.is_current)) {
    documentsByKind.set(document.document_kind, mapCaseDocument(document, params.organizationId));
  }

  if (params.latestSignedDeclaration) {
    documentsByKind.set("rhf", mapSignedDeclarationDocument(params.latestSignedDeclaration));
  }

  for (const kind of ["dnl_cnpj", "dnl_social_contract"] as DocumentKind[]) {
    if (!documentsByKind.has(kind)) {
      const platformDocument = params.platformDocumentsByKind.get(kind);

      if (platformDocument) {
        documentsByKind.set(kind, mapPlatformDocument(platformDocument));
      }
    }
  }

  for (const kind of params.visibleKinds) {
    if (!documentsByKind.has(kind)) {
      documentsByKind.set(kind, {
        id: `missing:${kind}`,
        kind,
        status: "missing",
        title: DOCUMENT_KIND_LABELS[kind],
        source: "missing",
        notes: null,
        downloadUrl: null,
        externalUrl: null,
        provider: null,
        externalEnvelopeId: null,
        externalStatus: null,
        signedAt: null,
        sentAt: null,
        expiresAt: null,
        fileName: null,
        createdAt: null,
      });
    }
  }

  return [...documentsByKind.values()].sort(sortDocuments);
}

function mapDetection(
  detection: DetectionRow,
  organization: OrganizationRow | undefined,
  asset: AssetRow | undefined,
  primaryFile: AssetFileRow | undefined,
  latestEvidence: DetectionEvidenceRow | undefined,
) {
  return {
    organization: {
      id: detection.organization_id,
      name: organization?.name ?? "Cliente nao identificado",
      billingEmail: organization?.billing_email ?? null,
    },
    placement: {
      id: detection.id,
      publicId: detection.public_id,
      casePublicId: detection.case_public_id,
      organizationId: detection.organization_id,
      asset: {
        id: detection.asset_id,
        publicId: asset?.public_id ?? 0,
        title: asset?.title ?? "Imagem monitorada",
        primaryImageUrl: primaryFile?.storage_key
          ? buildAssetPublicUrl(primaryFile.storage_key)
          : (primaryFile?.public_url ?? null),
        originalFileName: primaryFile?.original_file_name ?? null,
      },
      sourceUrl: detection.source_url,
      canonicalSourceUrl: detection.canonical_source_url,
      matchedImageUrl: detection.matched_image_url,
      pageTitle: detection.page_title,
      domain: detection.domain,
      normalizedDomain: parseNormalizedDomain(detection),
      confidenceScore: detection.confidence_score,
      status: detection.status,
      matchType: parseMatchType(detection.vision_payload),
      firstSeenAt: detection.first_seen_at,
      lastSeenAt: detection.last_seen_at,
      reviewedAt: detection.reviewed_at,
      latestEvidence: latestEvidence ? mapEvidence(latestEvidence) : null,
    } satisfies AdminCasePlacement,
  };
}

function buildCaseWorkflowState(params: {
  organizationId: string;
  casePublicId: number;
  detectionStatus: string;
  workflow: CaseWorkflowRow | undefined;
  documents: CaseDocumentRow[];
  caseEvents: CaseEventRow[];
  actionHistory: AdminCaseActionHistoryItem[];
  latestSignedDeclaration: AdminSignedDeclarationItem | null;
  settlement: CaseSettlementRow | undefined;
  profilesById: Map<string, ProfileRow>;
  platformDocumentsByKind: Map<DocumentKind, PlatformLegalDocumentRow>;
}): AdminCaseWorkflowState {
  const settlement = mapSettlement(params.settlement);
  const stage =
    params.workflow?.stage ??
    inferWorkflowStageFromStatus({
      detectionStatus: params.detectionStatus,
      latestEventKind: params.caseEvents[0]?.event_kind,
      settlementStatus: settlement?.displayStatus ?? settlement?.status ?? null,
    });
  const visibleKinds = buildCaseWorkflowReadiness({
    stage,
    documents: params.documents.map((document) => ({
      kind: document.document_kind,
      status: document.status,
    })),
    settlement: settlement
      ? {
          status: settlement.status,
          paymentDueDate: settlement.paymentDueDate,
          paidAt: settlement.paidAt,
        }
      : null,
  }).visibleDocumentKinds;
  const documents = buildWorkflowDocuments({
    organizationId: params.organizationId,
    casePublicId: params.casePublicId,
    caseDocuments: params.documents,
    latestSignedDeclaration: params.latestSignedDeclaration,
    platformDocumentsByKind: params.platformDocumentsByKind,
    visibleKinds,
  });
  const readiness = buildCaseWorkflowReadiness({
    stage,
    documents: documents.map((document) => ({
      kind: document.kind,
      status: document.status,
    })),
    settlement: settlement
      ? {
          status: settlement.status,
          paymentDueDate: settlement.paymentDueDate,
          paidAt: settlement.paidAt,
        }
      : null,
  });
  const assignedProfile = params.workflow?.assigned_to_user_id
    ? params.profilesById.get(params.workflow.assigned_to_user_id)
    : null;
  const workflowEvents = params.caseEvents.map((event) => {
    const actor = event.user_id ? params.profilesById.get(event.user_id) : null;

    return {
      id: event.id,
      kind: event.event_kind,
      direction: event.direction,
      title: event.title,
      body: event.body_snapshot,
      notes: event.notes,
      communicationSubject: event.communication_subject,
      communicationBody: event.communication_body_snapshot,
      actorName: actor?.full_name ?? actor?.email ?? null,
      actorEmail: actor?.email ?? null,
      occurredAt: event.occurred_at,
      source: "workflow",
    } satisfies AdminCaseWorkflowEvent;
  });
  const detectionActionEvents = params.actionHistory.map(
    (action) =>
      ({
        id: `action:${action.id}`,
        kind: action.action,
        direction: "system",
        title: action.action,
        body: null,
        notes: action.notes,
        communicationSubject: null,
        communicationBody: null,
        actorName: action.actorName,
        actorEmail: action.actorEmail,
        occurredAt: action.createdAt,
        source: "detection_action",
      }) satisfies AdminCaseWorkflowEvent,
  );

  return {
    id: params.workflow?.id ?? null,
    stage,
    priority: params.workflow?.priority ?? "normal",
    assignedTo:
      params.workflow?.assigned_to_user_id && assignedProfile
        ? {
            id: params.workflow.assigned_to_user_id,
            name: assignedProfile.full_name,
            email: assignedProfile.email,
          }
        : null,
    nextAction: params.workflow?.next_action ?? null,
    nextActionDueAt: params.workflow?.next_action_due_at ?? null,
    notified: {
      name: params.workflow?.notified_name ?? null,
      email: params.workflow?.notified_email ?? null,
      phone: params.workflow?.notified_phone ?? null,
      document: params.workflow?.notified_document ?? null,
      domain: params.workflow?.notified_domain ?? null,
      websiteUrl: params.workflow?.notified_website_url ?? null,
    },
    summary: params.workflow?.summary ?? null,
    documents,
    events: [...workflowEvents, ...detectionActionEvents].sort((left, right) =>
      compareIsoDatesDesc(left.occurredAt, right.occurredAt),
    ),
    settlement,
    readiness,
    updatedAt: params.workflow?.updated_at ?? null,
  };
}

async function loadCaseRows(filters?: {
  organizationId?: string;
  casePublicId?: number;
}) {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  let query = supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
    )
    .in("status", ["unauthorized", "takedown_sent", "resolved"])
    .is("archived_at", null)
    .order("last_seen_at", { ascending: false });

  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  }

  if (typeof filters?.casePublicId === "number") {
    query = query.eq("case_public_id", filters.casePublicId);
  }

  const { data: detections, error: detectionsError } = await query.returns<DetectionRow[]>();

  if (detectionsError) {
    throw new Error("Nao foi possivel carregar os casos do painel administrativo.");
  }

  return detections ?? [];
}

async function buildAdminCases(filters?: {
  organizationId?: string;
  casePublicId?: number;
}): Promise<AdminCaseListItem[]> {
  const rows = await loadCaseRows(filters);

  if (rows.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const organizationIds = Array.from(new Set(rows.map((item) => item.organization_id)));
  const assetIds = Array.from(new Set(rows.map((item) => item.asset_id)));
  const casePublicIds = Array.from(new Set(rows.map((item) => item.case_public_id)));
  const detectionIds = rows.map((item) => item.id);

  const [
    { data: organizations, error: organizationsError },
    { data: assets, error: assetsError },
    { data: files, error: filesError },
    { data: evidences, error: evidencesError },
    { data: actions, error: actionsError },
    { data: declarations, error: declarationsError },
    { data: workflows, error: workflowsError },
    { data: caseDocuments, error: caseDocumentsError },
    { data: caseEvents, error: caseEventsError },
    { data: settlements, error: settlementsError },
    { data: platformDocuments, error: platformDocumentsError },
    { data: siteIntelInvestigations, error: siteIntelInvestigationsError },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, billing_email")
      .in("id", organizationIds)
      .returns<OrganizationRow[]>(),
    supabase
      .from("assets")
      .select("id, public_id, organization_id, title")
      .in("id", assetIds)
      .returns<AssetRow[]>(),
    supabase
      .from("asset_files")
      .select("asset_id, public_url, storage_key, original_file_name")
      .eq("is_primary", true)
      .in("asset_id", assetIds)
      .returns<AssetFileRow[]>(),
    supabase
      .from("detection_evidences")
      .select(
        "id, detection_id, scan_run_id, screenshot_storage_key, matched_image_storage_key, captured_at, capture_status, capture_error_message, metadata, source_url_snapshot, matched_image_url_snapshot, created_at",
      )
      .in("detection_id", detectionIds)
      .order("created_at", { ascending: false })
      .returns<DetectionEvidenceRow[]>(),
    supabase
      .from("detection_actions")
      .select("id, detection_id, user_id, action, from_status, to_status, notes, metadata, created_at")
      .in("detection_id", detectionIds)
      .order("created_at", { ascending: false })
      .returns<DetectionActionRow[]>(),
    supabase
      .from("rights_ownership_confirmations")
      .select(
        "id, detection_id, asset_public_id, case_public_id, signer_full_name, signer_cpf, signer_role, signing_city, statement_date, signature_svg, template_version, body_snapshot, created_at",
      )
      .in("detection_id", detectionIds)
      .order("created_at", { ascending: false })
      .returns<RightsOwnershipConfirmationRow[]>(),
    supabase
      .from("case_workflows")
      .select(
        "id, organization_id, case_public_id, representative_detection_id, stage, priority, assigned_to_user_id, next_action, next_action_due_at, notified_name, notified_email, notified_phone, notified_document, notified_domain, notified_website_url, summary, created_at, updated_at",
      )
      .in("organization_id", organizationIds)
      .in("case_public_id", casePublicIds)
      .returns<CaseWorkflowRow[]>(),
    supabase
      .from("case_documents")
      .select(
        "id, organization_id, case_public_id, workflow_id, detection_id, rights_ownership_confirmation_id, platform_legal_document_id, document_kind, status, title, notes, storage_key, file_name, mime_type, size_bytes, external_url, provider, external_envelope_id, external_status, signed_at, sent_at, expires_at, is_current, created_at, updated_at",
      )
      .in("organization_id", organizationIds)
      .in("case_public_id", casePublicIds)
      .order("created_at", { ascending: false })
      .returns<CaseDocumentRow[]>(),
    supabase
      .from("case_events")
      .select(
        "id, organization_id, case_public_id, workflow_id, detection_id, user_id, event_kind, direction, title, body_snapshot, notes, communication_subject, communication_body_snapshot, occurred_at, created_at",
      )
      .in("organization_id", organizationIds)
      .in("case_public_id", casePublicIds)
      .order("occurred_at", { ascending: false })
      .returns<CaseEventRow[]>(),
    supabase
      .from("case_settlements")
      .select(
        "id, organization_id, case_public_id, workflow_id, status, proposed_amount_cents, currency, proposal_sent_at, sra_document_id, payment_method, payment_due_date, payment_reference, payment_url, paid_amount_cents, paid_at, receipt_document_id, collections_started_at, notes, created_at, updated_at",
      )
      .in("organization_id", organizationIds)
      .in("case_public_id", casePublicIds)
      .returns<CaseSettlementRow[]>(),
    supabase
      .from("platform_legal_documents")
      .select(
        "id, document_kind, title, description, storage_key, public_url, external_url, status, version_label, is_active, created_at, updated_at",
      )
      .eq("is_active", true)
      .in("document_kind", ["dnl_cnpj", "dnl_social_contract", "other"])
      .order("created_at", { ascending: false })
      .returns<PlatformLegalDocumentRow[]>(),
    loadSiteIntelInvestigations(supabase, detectionIds),
  ]);

  if (
    organizationsError ||
    assetsError ||
    filesError ||
    evidencesError ||
    actionsError ||
    declarationsError ||
    workflowsError ||
    caseDocumentsError ||
    caseEventsError ||
    settlementsError ||
    platformDocumentsError ||
    siteIntelInvestigationsError
  ) {
    throw new Error("Nao foi possivel consolidar os dados dos casos.");
  }

  const profileIds = uniqueStrings([
    ...(actions ?? []).map((item) => item.user_id),
    ...(workflows ?? []).map((item) => item.assigned_to_user_id),
    ...(caseEvents ?? []).map((item) => item.user_id),
  ]);
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", profileIds)
        .returns<ProfileRow[]>()
    : { data: [], error: null };

  if (profilesError) {
    throw new Error("Nao foi possivel carregar o historico dos responsaveis pelos casos.");
  }

  const organizationsById = new Map((organizations ?? []).map((item) => [item.id, item]));
  const assetsById = new Map((assets ?? []).map((item) => [item.id, item]));
  const filesByAssetId = new Map((files ?? []).map((item) => [item.asset_id, item]));
  const profilesById = new Map((profiles ?? []).map((item) => [item.id, item]));

  const latestEvidenceByDetectionId = new Map<string, DetectionEvidenceRow>();
  for (const evidence of evidences ?? []) {
    if (!latestEvidenceByDetectionId.has(evidence.detection_id)) {
      latestEvidenceByDetectionId.set(evidence.detection_id, evidence);
    }
  }

  const latestSiteIntelByDetectionId = new Map<string, SiteIntelInvestigationRow>();
  for (const investigation of siteIntelInvestigations ?? []) {
    if (!latestSiteIntelByDetectionId.has(investigation.detection_id)) {
      latestSiteIntelByDetectionId.set(investigation.detection_id, investigation);
    }
  }

  const actionsByDetectionId = new Map<string, DetectionActionRow[]>();
  const declarationsByDetectionId = new Map<string, AdminSignedDeclarationItem[]>();
  const workflowsByCaseKey = new Map<string, CaseWorkflowRow>();
  const documentsByCaseKey = new Map<string, CaseDocumentRow[]>();
  const eventsByCaseKey = new Map<string, CaseEventRow[]>();
  const settlementsByCaseKey = new Map<string, CaseSettlementRow>();
  const platformDocumentsByKind = new Map<DocumentKind, PlatformLegalDocumentRow>();

  for (const action of actions ?? []) {
    const current = actionsByDetectionId.get(action.detection_id) ?? [];
    current.push(action);
    actionsByDetectionId.set(action.detection_id, current);
  }

  for (const declaration of declarations ?? []) {
    const current = declarationsByDetectionId.get(declaration.detection_id) ?? [];
    current.push({
      id: declaration.id,
      detectionId: declaration.detection_id,
      assetPublicId: declaration.asset_public_id,
      casePublicId: declaration.case_public_id,
      signerFullName: declaration.signer_full_name,
      signerCpf: declaration.signer_cpf,
      signerRole: declaration.signer_role,
      signingCity: declaration.signing_city,
      statementDate: declaration.statement_date,
      signatureSvg: declaration.signature_svg,
      templateVersion: declaration.template_version,
      body: declaration.body_snapshot,
      createdAt: declaration.created_at,
    });
    declarationsByDetectionId.set(declaration.detection_id, current);
  }

  for (const workflow of workflows ?? []) {
    workflowsByCaseKey.set(
      buildCaseKey({
        organizationId: workflow.organization_id,
        casePublicId: workflow.case_public_id,
      }),
      workflow,
    );
  }

  for (const document of caseDocuments ?? []) {
    const caseKey = buildCaseKey({
      organizationId: document.organization_id,
      casePublicId: document.case_public_id,
    });
    const current = documentsByCaseKey.get(caseKey) ?? [];
    current.push(document);
    documentsByCaseKey.set(caseKey, current);
  }

  for (const event of caseEvents ?? []) {
    const caseKey = buildCaseKey({
      organizationId: event.organization_id,
      casePublicId: event.case_public_id,
    });
    const current = eventsByCaseKey.get(caseKey) ?? [];
    current.push(event);
    eventsByCaseKey.set(caseKey, current);
  }

  for (const settlement of settlements ?? []) {
    settlementsByCaseKey.set(
      buildCaseKey({
        organizationId: settlement.organization_id,
        casePublicId: settlement.case_public_id,
      }),
      settlement,
    );
  }

  for (const document of platformDocuments ?? []) {
    if (!platformDocumentsByKind.has(document.document_kind)) {
      platformDocumentsByKind.set(document.document_kind, document);
    }
  }

  const groupedCases = new Map<
    string,
    {
      casePublicId: number;
      organization: AdminCaseListItem["organization"];
      placements: AdminCasePlacement[];
      actions: DetectionActionRow[];
      declarations: AdminSignedDeclarationItem[];
      siteIntelInvestigations: CaseSiteIntelForSignals[];
    }
  >();

  for (const row of rows) {
    const mapped = mapDetection(
      row,
      organizationsById.get(row.organization_id),
      assetsById.get(row.asset_id),
      filesByAssetId.get(row.asset_id),
      latestEvidenceByDetectionId.get(row.id),
    );
    const caseKey = buildCaseKey({
      organizationId: row.organization_id,
      casePublicId: row.case_public_id,
    });
    const current = groupedCases.get(caseKey) ?? {
      casePublicId: row.case_public_id,
      organization: mapped.organization,
      placements: [],
      actions: [],
      declarations: [],
      siteIntelInvestigations: [],
    };

    current.placements.push(mapped.placement);
    const siteIntel = latestSiteIntelByDetectionId.get(row.id);
    if (siteIntel) {
      current.siteIntelInvestigations.push(mapSiteIntelForSignals(siteIntel));
    }
    current.actions.push(...(actionsByDetectionId.get(row.id) ?? []));
    current.declarations.push(...(declarationsByDetectionId.get(row.id) ?? []));
    groupedCases.set(caseKey, current);
  }

  return [...groupedCases.entries()]
    .map(([caseKey, group]) => {
      const placements = [...group.placements].sort(comparePlacementsDesc);
      const representative = placements[0];
      const pageMap = new Map<string, AdminCasePlacement[]>();

      for (const placement of placements) {
        const key = placement.canonicalSourceUrl || placement.sourceUrl;
        const current = pageMap.get(key) ?? [];
        current.push(placement);
        pageMap.set(key, current);
      }

      const pages = [...pageMap.entries()]
        .map(([pageKey, pagePlacements]) => {
          const sortedPlacements = [...pagePlacements].sort(comparePlacementsDesc);
          const pageRepresentative = sortedPlacements[0];
          const evidenceCoverage = getPageEvidenceCoverage(sortedPlacements);

          return {
            key: pageKey,
            sourceUrl: pageRepresentative.sourceUrl,
            canonicalSourceUrl: pageRepresentative.canonicalSourceUrl,
            pageTitle: pageRepresentative.pageTitle,
            firstSeenAt: sortedPlacements.reduce(
              (current, placement) => pickEarliestIsoDate(current, placement.firstSeenAt),
              pageRepresentative.firstSeenAt,
            ),
            lastSeenAt: pageRepresentative.lastSeenAt,
            placementsCount: sortedPlacements.length,
            capturedEvidenceCount: sortedPlacements.filter(
              (placement) => placement.latestEvidence?.captureStatus === "captured",
            ).length,
            evidenceCoverage,
            representativeDetectionId: pageRepresentative.id,
            placements: sortedPlacements.map((placement) => ({
      id: placement.id,
      publicId: placement.publicId,
              sourceUrl: placement.sourceUrl,
              pageTitle: placement.pageTitle,
              status: placement.status,
              matchType: placement.matchType,
              confidenceScore: placement.confidenceScore,
              lastSeenAt: placement.lastSeenAt,
              reviewedAt: placement.reviewedAt,
              matchedImageUrl:
                placement.latestEvidence?.matchedImageUrl ?? placement.matchedImageUrl,
              latestEvidence: placement.latestEvidence,
            })),
          } satisfies AdminCasePageGroup;
        })
        .sort((left, right) => compareIsoDatesDesc(left.lastSeenAt, right.lastSeenAt));

      const pageCoverages = pages.map((page) => page.evidenceCoverage);
      const siteSnapshots = placements
        .map((placement) => placement.latestEvidence?.siteSnapshot ?? null)
        .filter((snapshot): snapshot is DetectionSiteSnapshot => Boolean(snapshot));
      const actionHistory = [...group.actions]
        .sort((left, right) => compareIsoDatesDesc(left.created_at, right.created_at))
        .map((action) => {
          const actor = action.user_id ? profilesById.get(action.user_id) : null;

          return {
            id: action.id,
            detectionId: action.detection_id,
            userId: action.user_id,
            actorName: actor?.full_name ?? actor?.email ?? null,
            actorEmail: actor?.email ?? null,
            action: action.action,
            fromStatus: action.from_status,
            toStatus: action.to_status,
            notes: action.notes,
            reason: parseActionReason(action.metadata),
            createdAt: action.created_at,
          } satisfies AdminCaseActionHistoryItem;
        });
      const latestAction = actionHistory[0] ?? null;
      const signedDeclarations = [...group.declarations].sort((left, right) =>
        compareIsoDatesDesc(left.createdAt, right.createdAt),
      );
      const latestSignedDeclaration = signedDeclarations[0] ?? null;
      const caseStatus = resolveCaseStatus(placements.map((placement) => placement.status));

      return {
        key: caseKey,
        publicId: group.casePublicId,
        representativeDetectionId: representative.id,
        detectionPublicIds: Array.from(new Set(placements.map((placement) => placement.publicId))).sort(
          (left, right) => left - right,
        ),
        organization: group.organization,
        asset: representative.asset,
        domain:
          representative.domain && representative.domain !== "site-nao-identificado"
            ? representative.domain
            : representative.normalizedDomain,
        normalizedDomain: representative.normalizedDomain,
        primaryPageTitle: representative.pageTitle,
        sourceUrl: representative.sourceUrl,
        finalUrl: representative.latestEvidence?.finalUrl ?? null,
        matchedImageUrl:
          representative.latestEvidence?.matchedImageUrl ??
          representative.latestEvidence?.matchedImageSourceUrl ??
          representative.matchedImageUrl,
        screenshotUrl: representative.latestEvidence?.screenshotUrl ?? null,
        status: caseStatus,
        firstSeenAt: placements.reduce(
          (current, placement) => pickEarliestIsoDate(current, placement.firstSeenAt),
          representative.firstSeenAt,
        ),
        latestSeenAt: representative.lastSeenAt,
        clientReviewedAt: placements.reduce<string | null>((latest, placement) => {
          if (!placement.reviewedAt) {
            return latest;
          }

          if (!latest || new Date(placement.reviewedAt).getTime() > new Date(latest).getTime()) {
            return placement.reviewedAt;
          }

          return latest;
        }, null),
        evidenceCoverage: getIncidentEvidenceCoverage(pageCoverages),
        pagesCount: pageMap.size,
        placementsCount: placements.length,
        capturedEvidenceCount: placements.filter(
          (placement) => placement.latestEvidence?.captureStatus === "captured",
        ).length,
        siteSignals: buildCaseSiteSignals({
          siteSnapshots,
          investigations: group.siteIntelInvestigations,
        }),
        latestAction: latestAction
          ? {
              action: latestAction.action,
              actorName: latestAction.actorName,
              actorEmail: latestAction.actorEmail,
              createdAt: latestAction.createdAt,
              fromStatus: latestAction.fromStatus,
              toStatus: latestAction.toStatus,
              notes: latestAction.notes,
              reason: latestAction.reason,
            }
          : null,
        latestSignedDeclaration,
        signedDeclarations,
        actionHistory,
        workflow: buildCaseWorkflowState({
          organizationId: group.organization.id,
          casePublicId: group.casePublicId,
          detectionStatus: caseStatus,
          workflow: workflowsByCaseKey.get(caseKey),
          documents: documentsByCaseKey.get(caseKey) ?? [],
          caseEvents: eventsByCaseKey.get(caseKey) ?? [],
          actionHistory,
          latestSignedDeclaration,
          settlement: settlementsByCaseKey.get(caseKey),
          profilesById,
          platformDocumentsByKind,
        }),
        pages,
        placements,
      } satisfies AdminCaseListItem;
    })
    .sort((left, right) => compareIsoDatesDesc(left.latestSeenAt, right.latestSeenAt));
}

export async function listAdminCases(): Promise<AdminCaseListItem[]> {
  return buildAdminCases();
}

export async function getAdminCaseDetails(
  organizationId: string,
  casePublicId: number,
): Promise<AdminCaseDetails | null> {
  const cases = await buildAdminCases({ organizationId, casePublicId });
  return cases[0] ?? null;
}

export async function getAdminCaseDocumentStorageKey(params: {
  organizationId: string;
  casePublicId: number;
  documentId: string;
}) {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_documents")
    .select("id, storage_key, mime_type, file_name")
    .eq("organization_id", params.organizationId)
    .eq("case_public_id", params.casePublicId)
    .eq("id", params.documentId)
    .maybeSingle<{
      id: string;
      storage_key: string | null;
      mime_type: string | null;
      file_name: string | null;
    }>();

  if (error || !data?.storage_key) {
    return null;
  }

  return {
    storageKey: data.storage_key,
    mimeType: data.mime_type ?? "application/octet-stream",
    fileName: data.file_name ?? `documento-${params.documentId}`,
  };
}
