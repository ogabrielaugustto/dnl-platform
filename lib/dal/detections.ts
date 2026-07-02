import "server-only";

import { notFound } from "next/navigation";
import { requireActiveOrganization } from "@/lib/dal/assets";
import {
  compareDetectionSourceScope,
  filterByDetectionSourceScope,
  parseDetectionSourceScope,
  type DetectionSourceScope,
} from "@/lib/dal/detection-source-scope";
import { buildAssetPublicUrl } from "@/lib/r2";
import { createClient } from "@/lib/server";

type AssetRow = {
  id: string;
  public_id: number;
  organization_id: string;
  title: string;
  created_at: string;
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
  source_scope: string | null;
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

type DetectionMatchType = "full" | "partial" | "page" | "unknown";

export type DetectionEvidenceCoverage = "captured" | "partial" | "failed" | "pending";

export type DetectionEvidenceListItem = {
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

export type DetectionPlacementListItem = {
  id: string;
  publicId: number;
  casePublicId: number;
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
  sourceScope: DetectionSourceScope;
  confidenceScore: number | null;
  status: string;
  matchType: DetectionMatchType;
  firstSeenAt: string;
  lastSeenAt: string;
  lastScannedAt: string | null;
  reviewedAt: string | null;
  latestEvidence: DetectionEvidenceListItem | null;
};

export type DetectionIncidentPlacementSummary = {
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
  latestEvidence: DetectionEvidenceListItem | null;
};

export type DetectionIncidentPageGroup = {
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
  placements: DetectionIncidentPlacementSummary[];
};

export type DetectionIncidentListItem = {
  key: string;
  publicId: number;
  casePublicId: number;
  asset: DetectionPlacementListItem["asset"];
  domain: string;
  normalizedDomain: string;
  sourceScope: DetectionSourceScope;
  primaryPageTitle: string | null;
  firstSeenAt: string;
  latestSeenAt: string;
  incidentStatus: string;
  statusNote: string | null;
  evidenceCoverage: DetectionEvidenceCoverage;
  pagesCount: number;
  placementsCount: number;
  capturedEvidenceCount: number;
  primaryDetectionId: string;
  bestMatchedImageUrl: string | null;
  pages: DetectionIncidentPageGroup[];
};

export type DetectionDetails = DetectionPlacementListItem & {
  reviewedByName: string | null;
  evidences: DetectionEvidenceListItem[];
  incident: DetectionIncidentListItem;
  currentPage: DetectionIncidentPageGroup | null;
};

export type DetectionCaseActionHistoryItem = {
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

export type DetectionSignedDeclarationItem = {
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

export type DetectionCaseListItem = {
  key: string;
  publicId: number;
  representativeDetectionId: string;
  detectionPublicIds: number[];
  asset: DetectionPlacementListItem["asset"];
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
  siteSignals: {
    cnpjCandidates: string[];
    emails: string[];
    phones: string[];
    siteName: string | null;
  };
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
  latestSignedDeclaration: DetectionSignedDeclarationItem | null;
  signedDeclarations: DetectionSignedDeclarationItem[];
  actionHistory: DetectionCaseActionHistoryItem[];
  pages: DetectionIncidentPageGroup[];
  placements: DetectionPlacementListItem[];
};

export type DetectionCaseDetails = DetectionCaseListItem;

function buildEvidenceImageUrl(detectionId: string, evidenceId: string) {
  return `/api/detections/${detectionId}/evidences/${evidenceId}/image`;
}

function buildEvidenceMatchedImageUrl(detectionId: string, evidenceId: string) {
  return `/api/detections/${detectionId}/evidences/${evidenceId}/matched-image`;
}

export type DetectionSiteSnapshot = {
  domain: string | null;
  finalUrl: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  cnpjCandidates: string[];
  emails: string[];
  phones: string[];
  rdap: {
    registrar: string | null;
    status: string[];
    entities: Array<{
      handle: string | null;
      roles: string[];
      name: string | null;
      organization: string | null;
      email: string | null;
    }>;
  } | null;
};

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

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))),
  );
}

function parseActionReason(metadata: Record<string, unknown> | null | undefined) {
  const reason = getMetadataValue(metadata, "reason");
  return typeof reason === "string" && reason.trim().length > 0 ? reason : null;
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

function pickEarliestIsoDate(left: string, right: string) {
  return new Date(left).getTime() <= new Date(right).getTime() ? left : right;
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

function comparePlacementsDesc(
  left: Pick<DetectionPlacementListItem, "lastSeenAt" | "confidenceScore" | "id">,
  right: Pick<DetectionPlacementListItem, "lastSeenAt" | "confidenceScore" | "id">,
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

function mapEvidence(
  detectionId: string,
  evidence: DetectionEvidenceRow,
): DetectionEvidenceListItem {
  return {
    id: evidence.id,
    scanRunId: evidence.scan_run_id,
    screenshotUrl: evidence.screenshot_storage_key
      ? buildEvidenceImageUrl(detectionId, evidence.id)
      : null,
    matchedImageUrl: evidence.matched_image_storage_key
      ? buildEvidenceMatchedImageUrl(detectionId, evidence.id)
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

async function listAssetRowsById(organizationId: string, assetIds: string[]) {
  if (assetIds.length === 0) {
    return new Map<string, AssetRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, public_id, organization_id, title, created_at")
    .eq("organization_id", organizationId)
    .in("id", assetIds);

  if (error) {
    throw new Error("Nao foi possivel carregar os assets das ocorrencias.");
  }

  return new Map((data ?? []).map((item) => [item.id, item as AssetRow]));
}

async function listPrimaryAssetFiles(organizationId: string, assetIds: string[]) {
  if (assetIds.length === 0) {
    return new Map<string, AssetFileRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_files")
    .select("asset_id, public_url, storage_key, original_file_name")
    .eq("organization_id", organizationId)
    .eq("is_primary", true)
    .in("asset_id", assetIds);

  if (error) {
    throw new Error("Nao foi possivel carregar os arquivos principais dos assets.");
  }

  return new Map((data ?? []).map((item) => [item.asset_id, item as AssetFileRow]));
}

async function listLatestEvidenceByDetectionId(
  organizationId: string,
  detectionIds: string[],
) {
  const evidencesByDetectionId = new Map<string, DetectionEvidenceRow>();

  if (detectionIds.length === 0) {
    return evidencesByDetectionId;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detection_evidences")
    .select(
      "id, detection_id, scan_run_id, screenshot_storage_key, matched_image_storage_key, captured_at, capture_status, capture_error_message, metadata, source_url_snapshot, matched_image_url_snapshot, created_at",
    )
    .eq("organization_id", organizationId)
    .in("detection_id", detectionIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Nao foi possivel carregar as evidencias das ocorrencias.");
  }

  for (const evidence of (data ?? []) as DetectionEvidenceRow[]) {
    if (!evidencesByDetectionId.has(evidence.detection_id)) {
      evidencesByDetectionId.set(evidence.detection_id, evidence);
    }
  }

  return evidencesByDetectionId;
}

function mapDetection(
  detection: DetectionRow,
  asset: AssetRow | undefined,
  primaryFile: AssetFileRow | undefined,
  latestEvidence: DetectionEvidenceRow | undefined,
): DetectionPlacementListItem {
  return {
    id: detection.id,
    publicId: detection.public_id,
    casePublicId: detection.case_public_id,
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
    sourceScope: parseDetectionSourceScope(detection.source_scope),
    confidenceScore: detection.confidence_score,
    status: detection.status,
    matchType: parseMatchType(detection.vision_payload),
    firstSeenAt: detection.first_seen_at,
    lastSeenAt: detection.last_seen_at,
    lastScannedAt: detection.last_scanned_at,
    reviewedAt: detection.reviewed_at,
    latestEvidence: latestEvidence ? mapEvidence(detection.id, latestEvidence) : null,
  };
}

async function listDetectionRows(
  organizationId: string,
  filters?: {
    assetId?: string | null;
    detectionId?: string | null;
  },
) {
  const supabase = await createClient();
  let query = supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, source_scope, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
    )
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("last_seen_at", { ascending: false });

  if (filters?.assetId) {
    query = query.eq("asset_id", filters.assetId);
  }

  if (filters?.detectionId) {
    query = query.eq("id", filters.detectionId);
  }

  const { data, error } = await query.limit(250);

  if (error) {
    throw new Error("Nao foi possivel carregar as ocorrencias.");
  }

  return (data ?? []) as DetectionRow[];
}

async function hydratePlacements(
  organizationId: string,
  detections: DetectionRow[],
): Promise<DetectionPlacementListItem[]> {
  const assetIds = Array.from(new Set(detections.map((item) => item.asset_id)));
  const detectionIds = detections.map((item) => item.id);
  const [assetsById, filesByAssetId, latestEvidenceByDetectionId] = await Promise.all([
    listAssetRowsById(organizationId, assetIds),
    listPrimaryAssetFiles(organizationId, assetIds),
    listLatestEvidenceByDetectionId(organizationId, detectionIds),
  ]);

  return detections
    .map((detection) =>
      mapDetection(
        detection,
        assetsById.get(detection.asset_id),
        filesByAssetId.get(detection.asset_id),
        latestEvidenceByDetectionId.get(detection.id),
      ),
    )
    .sort(comparePlacementsDesc);
}

function getPageEvidenceCoverage(
  placements: DetectionIncidentPlacementSummary[],
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
  pages: DetectionIncidentPageGroup[],
): DetectionEvidenceCoverage {
  if (pages.length === 0) {
    return "pending";
  }

  const allCaptured = pages.every((page) => page.evidenceCoverage === "captured");

  if (allCaptured) {
    return "captured";
  }

  const hasUsefulEvidence = pages.some(
    (page) => page.evidenceCoverage === "captured" || page.evidenceCoverage === "partial",
  );

  if (hasUsefulEvidence) {
    return "partial";
  }

  const hasPending = pages.some((page) => page.evidenceCoverage === "pending");

  if (hasPending) {
    return "pending";
  }

  return "failed";
}

function resolveIncidentStatus(statuses: string[]) {
  if (statuses.includes("unauthorized")) {
    return {
      status: "unauthorized",
      note: null,
    };
  }

  if (statuses.includes("possible_infringement")) {
    return {
      status: "possible_infringement",
      note: null,
    };
  }

  if (statuses.length > 0 && statuses.every((status) => status === "authorized")) {
    return {
      status: "authorized",
      note: null,
    };
  }

  const finalStatuses = new Set(["authorized", "resolved", "ignored", "takedown_sent"]);
  const uniqueStatuses = [...new Set(statuses)];
  const allFinal = uniqueStatuses.length > 0 && uniqueStatuses.every((status) => finalStatuses.has(status));

  if (allFinal) {
    return {
      status: "resolved",
      note: uniqueStatuses.length > 1 ? "Com decisoes mistas" : null,
    };
  }

  return {
    status: "pending",
    note: null,
  };
}

function buildIncidentPageGroups(
  placements: DetectionPlacementListItem[],
): DetectionIncidentPageGroup[] {
  const pageMap = new Map<string, DetectionPlacementListItem[]>();

  for (const placement of placements) {
    const pageKey = placement.canonicalSourceUrl || placement.sourceUrl;
    const currentPlacements = pageMap.get(pageKey) ?? [];
    currentPlacements.push(placement);
    pageMap.set(pageKey, currentPlacements);
  }

  return [...pageMap.entries()]
    .map(([key, pagePlacements]) => {
      const sortedPlacements = [...pagePlacements].sort(comparePlacementsDesc);
      const representativePlacement = sortedPlacements[0];
      const placementSummaries: DetectionIncidentPlacementSummary[] = sortedPlacements.map(
        (placement) => ({
          id: placement.id,
          publicId: placement.publicId,
          sourceUrl: placement.sourceUrl,
          pageTitle: placement.pageTitle,
          status: placement.status,
          matchType: placement.matchType,
          confidenceScore: placement.confidenceScore,
          lastSeenAt: placement.lastSeenAt,
          reviewedAt: placement.reviewedAt,
          matchedImageUrl: placement.matchedImageUrl,
          latestEvidence: placement.latestEvidence,
        }),
      );
      const capturedEvidenceCount = placementSummaries.filter(
        (placement) => placement.latestEvidence?.captureStatus === "captured",
      ).length;

      return {
        key,
        sourceUrl: representativePlacement.sourceUrl,
        canonicalSourceUrl: representativePlacement.canonicalSourceUrl,
        pageTitle: representativePlacement.pageTitle,
        firstSeenAt: sortedPlacements.reduce(
          (current, placement) => pickEarliestIsoDate(current, placement.firstSeenAt),
          representativePlacement.firstSeenAt,
        ),
        lastSeenAt: representativePlacement.lastSeenAt,
        placementsCount: placementSummaries.length,
        capturedEvidenceCount,
        evidenceCoverage: getPageEvidenceCoverage(placementSummaries),
        representativeDetectionId: representativePlacement.id,
        placements: placementSummaries,
      };
    })
    .sort((left, right) => compareIsoDatesDesc(left.lastSeenAt, right.lastSeenAt));
}

function buildDetectionIncidents(
  placements: DetectionPlacementListItem[],
): DetectionIncidentListItem[] {
  const incidentMap = new Map<string, DetectionPlacementListItem[]>();

  for (const placement of placements) {
    const incidentKey = `${placement.asset.id}:${placement.normalizedDomain}`;
    const currentPlacements = incidentMap.get(incidentKey) ?? [];
    currentPlacements.push(placement);
    incidentMap.set(incidentKey, currentPlacements);
  }

  return [...incidentMap.entries()]
    .map(([key, incidentPlacements]) => {
      const sortedPlacements = [...incidentPlacements].sort(comparePlacementsDesc);
      const pages = buildIncidentPageGroups(sortedPlacements);
      const representativePlacement = sortedPlacements[0];
      const latestSeenAt = representativePlacement.lastSeenAt;
      const firstSeenAt = sortedPlacements.reduce(
        (current, placement) =>
          new Date(placement.firstSeenAt).getTime() < new Date(current).getTime()
            ? placement.firstSeenAt
            : current,
        representativePlacement.firstSeenAt,
      );
      const capturedEvidenceCount = sortedPlacements.filter(
        (placement) => placement.latestEvidence?.captureStatus === "captured",
      ).length;
      const incidentStatus = resolveIncidentStatus(
        sortedPlacements.map((placement) => placement.status),
      );

      return {
        key,
        publicId: representativePlacement.publicId,
        casePublicId: representativePlacement.casePublicId,
        asset: representativePlacement.asset,
        domain: representativePlacement.domain ?? representativePlacement.normalizedDomain,
        normalizedDomain: representativePlacement.normalizedDomain,
        sourceScope: representativePlacement.sourceScope,
        primaryPageTitle: pages[0]?.pageTitle ?? representativePlacement.pageTitle,
        firstSeenAt,
        latestSeenAt,
        incidentStatus: incidentStatus.status,
        statusNote: incidentStatus.note,
        evidenceCoverage: getIncidentEvidenceCoverage(pages),
        pagesCount: pages.length,
        placementsCount: sortedPlacements.length,
        capturedEvidenceCount,
        primaryDetectionId: representativePlacement.id,
        bestMatchedImageUrl:
          representativePlacement.latestEvidence?.matchedImageUrl ??
          representativePlacement.matchedImageUrl,
        pages,
      };
    })
    .sort(compareDetectionSourceScope);
}

export async function listOrganizationDetections(filters?: {
  assetId?: string | null;
}): Promise<DetectionPlacementListItem[]> {
  const { organizationId } = await requireActiveOrganization();
  const detections = await listDetectionRows(organizationId, {
    assetId: filters?.assetId ?? null,
  });

  return hydratePlacements(organizationId, detections);
}

export async function listDetectionIncidents(filters?: {
  assetId?: string | null;
  status?: string | null;
  evidenceCoverage?: string | null;
  sourceScope?: DetectionSourceScope | null;
}): Promise<DetectionIncidentListItem[]> {
  const placements = await listOrganizationDetections({
    assetId: filters?.assetId ?? null,
  });
  const incidents = buildDetectionIncidents(placements);

  const filteredIncidents = incidents.filter((incident) => {
    if (filters?.status && incident.incidentStatus !== filters.status) {
      return false;
    }

    if (
      filters?.evidenceCoverage &&
      incident.evidenceCoverage !== filters.evidenceCoverage
    ) {
      return false;
    }

    return true;
  });

  return filterByDetectionSourceScope(filteredIncidents, filters?.sourceScope ?? null);
}

async function listCaseRows(filters?: {
  casePublicId?: number;
}): Promise<DetectionRow[]> {
  const { organizationId } = await requireActiveOrganization();
  const supabase = await createClient();
  let query = supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, source_scope, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
    )
    .eq("organization_id", organizationId)
    .in("status", ["unauthorized", "takedown_sent", "resolved"])
    .is("archived_at", null)
    .order("last_seen_at", { ascending: false });

  if (typeof filters?.casePublicId === "number") {
    query = query.eq("case_public_id", filters.casePublicId);
  }

  const { data, error } = await query.limit(250);

  if (error) {
    throw new Error("Nao foi possivel carregar os casos.");
  }

  return (data ?? []) as DetectionRow[];
}

async function buildDetectionCases(filters?: {
  casePublicId?: number;
}): Promise<DetectionCaseListItem[]> {
  const { organizationId } = await requireActiveOrganization();
  const rows = await listCaseRows(filters);

  if (rows.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const assetIds = Array.from(new Set(rows.map((row) => row.asset_id)));
  const detectionIds = rows.map((row) => row.id);

  const [assetsById, filesByAssetId, latestEvidenceByDetectionId, actionsResponse, declarationsResponse] =
    await Promise.all([
      listAssetRowsById(organizationId, assetIds),
      listPrimaryAssetFiles(organizationId, assetIds),
      listLatestEvidenceByDetectionId(organizationId, detectionIds),
      supabase
        .from("detection_actions")
        .select("id, detection_id, user_id, action, from_status, to_status, notes, metadata, created_at")
        .eq("organization_id", organizationId)
        .in("detection_id", detectionIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("rights_ownership_confirmations")
        .select(
          "id, detection_id, asset_public_id, case_public_id, signer_full_name, signer_cpf, signer_role, signing_city, statement_date, signature_svg, template_version, body_snapshot, created_at",
        )
        .eq("organization_id", organizationId)
        .in("detection_id", detectionIds)
        .order("created_at", { ascending: false }),
    ]);

  if (actionsResponse.error || declarationsResponse.error) {
    throw new Error("Nao foi possivel carregar o historico dos casos.");
  }

  const actions = (actionsResponse.data ?? []) as DetectionActionRow[];
  const declarations =
    (declarationsResponse.data ?? []) as RightsOwnershipConfirmationRow[];
  const profileIds = uniqueStrings(actions.map((action) => action.user_id));
  const profilesResponse = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profilesResponse.error) {
    throw new Error("Nao foi possivel carregar os responsaveis pelos casos.");
  }

  const profilesById = new Map(
    ((profilesResponse.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const actionsByDetectionId = new Map<string, DetectionActionRow[]>();
  const declarationsByDetectionId = new Map<string, DetectionSignedDeclarationItem[]>();

  for (const action of actions) {
    const current = actionsByDetectionId.get(action.detection_id) ?? [];
    current.push(action);
    actionsByDetectionId.set(action.detection_id, current);
  }

  for (const declaration of declarations) {
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

  const groupedCases = new Map<
    number,
    {
      placements: DetectionPlacementListItem[];
      actions: DetectionActionRow[];
      declarations: DetectionSignedDeclarationItem[];
    }
  >();

  for (const row of rows) {
    const placement = mapDetection(
      row,
      assetsById.get(row.asset_id),
      filesByAssetId.get(row.asset_id),
      latestEvidenceByDetectionId.get(row.id),
    );
    const current = groupedCases.get(row.case_public_id) ?? {
      placements: [],
      actions: [],
      declarations: [],
    };

    current.placements.push(placement);
    current.actions.push(...(actionsByDetectionId.get(row.id) ?? []));
    current.declarations.push(...(declarationsByDetectionId.get(row.id) ?? []));
    groupedCases.set(row.case_public_id, current);
  }

  return [...groupedCases.entries()]
    .map(([casePublicId, group]) => {
      const placements = [...group.placements].sort(comparePlacementsDesc);
      const pages = buildIncidentPageGroups(placements);
      const representative = placements[0];
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
          } satisfies DetectionCaseActionHistoryItem;
        });
      const latestAction = actionHistory[0] ?? null;
      const signedDeclarations = [...group.declarations].sort((left, right) =>
        compareIsoDatesDesc(left.createdAt, right.createdAt),
      );

      return {
        key: `${organizationId}:${casePublicId}`,
        publicId: casePublicId,
        representativeDetectionId: representative.id,
        detectionPublicIds: Array.from(new Set(placements.map((placement) => placement.publicId))).sort(
          (left, right) => left - right,
        ),
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
        status: resolveCaseStatus(placements.map((placement) => placement.status)),
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
        evidenceCoverage: getIncidentEvidenceCoverage(pages),
        pagesCount: pages.length,
        placementsCount: placements.length,
        capturedEvidenceCount: placements.filter(
          (placement) => placement.latestEvidence?.captureStatus === "captured",
        ).length,
        siteSignals: {
          cnpjCandidates: uniqueStrings(siteSnapshots.flatMap((snapshot) => snapshot.cnpjCandidates)),
          emails: uniqueStrings(siteSnapshots.flatMap((snapshot) => snapshot.emails)),
          phones: uniqueStrings(siteSnapshots.flatMap((snapshot) => snapshot.phones)),
          siteName: uniqueStrings(siteSnapshots.map((snapshot) => snapshot.siteName))[0] ?? null,
        },
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
        latestSignedDeclaration: signedDeclarations[0] ?? null,
        signedDeclarations,
        actionHistory,
        pages,
        placements,
      } satisfies DetectionCaseListItem;
    })
    .sort((left, right) => compareIsoDatesDesc(left.latestSeenAt, right.latestSeenAt));
}

export async function listClientCases(): Promise<DetectionCaseListItem[]> {
  return buildDetectionCases();
}

export async function getClientCaseDetails(
  casePublicId: number,
): Promise<DetectionCaseDetails | null> {
  const cases = await buildDetectionCases({ casePublicId });
  return cases[0] ?? null;
}

export async function getDetectionDetails(detectionId: string): Promise<DetectionDetails> {
  const { organizationId } = await requireActiveOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, source_scope, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
    )
    .eq("organization_id", organizationId)
    .eq("id", detectionId)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("Nao foi possivel carregar a ocorrencia.");
  }

  if (!data) {
    notFound();
  }

  const detection = data as DetectionRow;
  const siblingRowsPromise = supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, source_scope, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
    )
    .eq("organization_id", organizationId)
    .eq("asset_id", detection.asset_id)
    .is("archived_at", null)
    .order("last_seen_at", { ascending: false });

  const [{ data: evidences, error: evidencesError }, siblingRowsResponse, assetsById, filesByAssetId] =
    await Promise.all([
      supabase
        .from("detection_evidences")
        .select(
          "id, detection_id, scan_run_id, screenshot_storage_key, matched_image_storage_key, captured_at, capture_status, capture_error_message, metadata, source_url_snapshot, matched_image_url_snapshot, created_at",
        )
        .eq("organization_id", organizationId)
        .eq("detection_id", detectionId)
        .order("created_at", { ascending: false }),
      siblingRowsPromise,
      listAssetRowsById(organizationId, [detection.asset_id]),
      listPrimaryAssetFiles(organizationId, [detection.asset_id]),
    ]);

  if (evidencesError) {
    throw new Error("Nao foi possivel carregar as evidencias da ocorrencia.");
  }

  if (siblingRowsResponse.error) {
    throw new Error("Nao foi possivel carregar o contexto desta ocorrencia.");
  }

  const siblingRows = (siblingRowsResponse.data ?? []) as DetectionRow[];
  const latestEvidenceByDetectionId = await listLatestEvidenceByDetectionId(
    organizationId,
    siblingRows.map((item) => item.id),
  );
  const siblingPlacements = siblingRows
    .map((item) =>
      mapDetection(
        item,
        assetsById.get(item.asset_id),
        filesByAssetId.get(item.asset_id),
        latestEvidenceByDetectionId.get(item.id),
      ),
    )
    .sort(comparePlacementsDesc);
  const currentPlacement =
    siblingPlacements.find((item) => item.id === detectionId) ??
    mapDetection(
      detection,
      assetsById.get(detection.asset_id),
      filesByAssetId.get(detection.asset_id),
      latestEvidenceByDetectionId.get(detection.id),
    );
  const incident =
    buildDetectionIncidents(
      siblingPlacements.filter(
        (item) =>
          item.asset.id === currentPlacement.asset.id &&
          item.normalizedDomain === currentPlacement.normalizedDomain,
      ),
    )[0] ??
    buildDetectionIncidents([currentPlacement])[0];

  let reviewedByName: string | null = null;
  if (detection.reviewed_by_user_id) {
    const { data: reviewer } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", detection.reviewed_by_user_id)
      .maybeSingle<ProfileRow>();

    reviewedByName = reviewer?.full_name ?? reviewer?.email ?? null;
  }

  const mappedEvidences = ((evidences ?? []) as DetectionEvidenceRow[]).map((evidence) =>
    mapEvidence(detection.id, evidence),
  );

  return {
    ...currentPlacement,
    latestEvidence: mappedEvidences[0] ?? currentPlacement.latestEvidence,
    reviewedByName,
    evidences: mappedEvidences,
    incident,
    currentPage:
      incident.pages.find((page) => page.key === currentPlacement.canonicalSourceUrl) ?? null,
  };
}

export async function getDetectionEvidenceStorageKey(params: {
  detectionId: string;
  evidenceId: string;
}) {
  const { organizationId } = await requireActiveOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detection_evidences")
    .select("id, detection_id, screenshot_storage_key")
    .eq("organization_id", organizationId)
    .eq("detection_id", params.detectionId)
    .eq("id", params.evidenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Nao foi possivel acessar a evidencia.");
  }

  if (!data?.screenshot_storage_key) {
    notFound();
  }

  return data.screenshot_storage_key;
}

export async function getDetectionMatchedImageStorageKey(params: {
  detectionId: string;
  evidenceId: string;
}) {
  const { organizationId } = await requireActiveOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detection_evidences")
    .select("id, detection_id, matched_image_storage_key")
    .eq("organization_id", organizationId)
    .eq("detection_id", params.detectionId)
    .eq("id", params.evidenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Nao foi possivel acessar a imagem encontrada.");
  }

  if (!data?.matched_image_storage_key) {
    notFound();
  }

  return data.matched_image_storage_key;
}
