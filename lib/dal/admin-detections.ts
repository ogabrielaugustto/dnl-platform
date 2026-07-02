import "server-only";

import { notFound } from "next/navigation";
import { requirePanelAccess } from "@/lib/auth";
import type {
  DetectionDetails,
  DetectionEvidenceListItem,
  DetectionIncidentListItem,
  DetectionIncidentPageGroup,
  DetectionPlacementListItem,
  DetectionSiteSnapshot,
} from "@/lib/dal/detections";
import { parseDetectionSourceScope } from "@/lib/dal/detection-source-scope";
import { buildAssetPublicUrl } from "@/lib/r2";
import { createClient } from "@/lib/server";

type OrganizationRow = {
  id: string;
  name: string;
  document: string | null;
  billing_email: string | null;
  is_active: boolean;
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

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type DetectionMatchType = "full" | "partial" | "page" | "unknown";

export type AdminDetectionIncidentListItem = DetectionIncidentListItem & {
  organization: {
    id: string;
    name: string;
    document: string | null;
    billingEmail: string | null;
    isActive: boolean;
  };
  latestActionAt: string | null;
};

export type AdminDetectionDetails = DetectionDetails & {
  organization: AdminDetectionIncidentListItem["organization"];
};

function buildEvidenceImageUrl(detectionId: string, evidenceId: string) {
  return `/api/detections/${detectionId}/evidences/${evidenceId}/image`;
}

function buildEvidenceMatchedImageUrl(detectionId: string, evidenceId: string) {
  return `/api/detections/${detectionId}/evidences/${evidenceId}/matched-image`;
}

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

function getPageEvidenceCoverage(placements: DetectionIncidentPageGroup["placements"]) {
  const total = placements.length;
  const capturedCount = placements.filter(
    (placement) => placement.latestEvidence?.captureStatus === "captured",
  ).length;
  const hasPending = placements.some((placement) => {
    const status = placement.latestEvidence?.captureStatus;
    return !status || status === "pending" || status === "processing";
  });

  if (capturedCount === total) {
    return "captured" as const;
  }

  if (capturedCount > 0) {
    return "partial" as const;
  }

  if (hasPending) {
    return "pending" as const;
  }

  return "failed" as const;
}

function getIncidentEvidenceCoverage(pages: DetectionIncidentPageGroup[]) {
  if (pages.length === 0) {
    return "pending" as const;
  }

  if (pages.every((page) => page.evidenceCoverage === "captured")) {
    return "captured" as const;
  }

  if (
    pages.some(
      (page) => page.evidenceCoverage === "captured" || page.evidenceCoverage === "partial",
    )
  ) {
    return "partial" as const;
  }

  if (pages.some((page) => page.evidenceCoverage === "pending")) {
    return "pending" as const;
  }

  return "failed" as const;
}

function resolveIncidentStatus(statuses: string[]) {
  if (statuses.includes("unauthorized")) {
    return { status: "unauthorized", note: null };
  }

  if (statuses.includes("takedown_sent")) {
    return { status: "takedown_sent", note: null };
  }

  if (statuses.includes("possible_infringement")) {
    return { status: "possible_infringement", note: null };
  }

  if (statuses.length > 0 && statuses.every((status) => status === "authorized")) {
    return { status: "authorized", note: null };
  }

  const finalStatuses = new Set(["authorized", "resolved", "ignored"]);
  const uniqueStatuses = [...new Set(statuses)];
  if (uniqueStatuses.length > 0 && uniqueStatuses.every((status) => finalStatuses.has(status))) {
    return {
      status: "resolved",
      note: uniqueStatuses.length > 1 ? "Com decisoes mistas" : null,
    };
  }

  return { status: "pending", note: null };
}

async function loadAdminDetectionContext() {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const [{ data: organizations, error: organizationsError }, { data: detections, error: detectionsError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, document, billing_email, is_active")
        .order("name", { ascending: true })
        .returns<OrganizationRow[]>(),
      supabase
        .from("detections")
        .select(
          "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, source_scope, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
        )
        .is("archived_at", null)
        .order("last_seen_at", { ascending: false })
        .returns<DetectionRow[]>(),
    ]);

  if (organizationsError || detectionsError) {
    throw new Error("Nao foi possivel carregar as ocorrencias administrativas.");
  }

  const detectionRows = detections ?? [];
  const assetIds = Array.from(new Set(detectionRows.map((item) => item.asset_id)));
  const detectionIds = detectionRows.map((item) => item.id);

  const [
    { data: assets, error: assetsError },
    { data: files, error: filesError },
    { data: evidences, error: evidencesError },
    { data: profiles, error: profilesError },
    { data: actions, error: actionsError },
  ] = await Promise.all([
    assetIds.length
      ? supabase
          .from("assets")
          .select("id, public_id, organization_id, title")
          .in("id", assetIds)
          .returns<AssetRow[]>()
      : Promise.resolve({ data: [], error: null }),
    assetIds.length
      ? supabase
          .from("asset_files")
          .select("asset_id, public_url, storage_key, original_file_name")
          .eq("is_primary", true)
          .in("asset_id", assetIds)
          .returns<AssetFileRow[]>()
      : Promise.resolve({ data: [], error: null }),
    detectionIds.length
      ? supabase
          .from("detection_evidences")
          .select(
            "id, detection_id, scan_run_id, screenshot_storage_key, matched_image_storage_key, captured_at, capture_status, capture_error_message, metadata, source_url_snapshot, matched_image_url_snapshot, created_at",
          )
          .in("detection_id", detectionIds)
          .order("created_at", { ascending: false })
          .returns<DetectionEvidenceRow[]>()
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .returns<ProfileRow[]>(),
    detectionIds.length
      ? supabase
          .from("detection_actions")
          .select("detection_id, created_at")
          .in("detection_id", detectionIds)
          .order("created_at", { ascending: false })
          .returns<Array<{ detection_id: string; created_at: string }>>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (assetsError || filesError || evidencesError || profilesError || actionsError) {
    throw new Error("Nao foi possivel consolidar as ocorrencias administrativas.");
  }

  return {
    organizations: organizations ?? [],
    detections: detectionRows,
    assets: assets ?? [],
    files: files ?? [],
    evidences: evidences ?? [],
    profiles: profiles ?? [],
    actions: actions ?? [],
  };
}

function hydratePlacements(context: Awaited<ReturnType<typeof loadAdminDetectionContext>>) {
  const organizationsById = new Map(context.organizations.map((item) => [item.id, item]));
  const assetsById = new Map(context.assets.map((item) => [item.id, item]));
  const filesByAssetId = new Map(context.files.map((item) => [item.asset_id, item]));
  const latestEvidenceByDetectionId = new Map<string, DetectionEvidenceRow>();
  for (const evidence of context.evidences) {
    if (!latestEvidenceByDetectionId.has(evidence.detection_id)) {
      latestEvidenceByDetectionId.set(evidence.detection_id, evidence);
    }
  }

  const latestActionByDetectionId = new Map<string, string>();
  for (const action of context.actions) {
    if (!latestActionByDetectionId.has(action.detection_id)) {
      latestActionByDetectionId.set(action.detection_id, action.created_at);
    }
  }

  const placements = context.detections.map((detection) => {
    const organization = organizationsById.get(detection.organization_id);
    const asset = assetsById.get(detection.asset_id);
    const primaryFile = filesByAssetId.get(detection.asset_id);
    const latestEvidence = latestEvidenceByDetectionId.get(detection.id);

    return {
      organization: {
        id: detection.organization_id,
        name: organization?.name ?? "Cliente nao identificado",
        document: organization?.document ?? null,
        billingEmail: organization?.billing_email ?? null,
        isActive: organization?.is_active ?? true,
      },
      placement: {
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
      } satisfies DetectionPlacementListItem,
      latestActionAt: latestActionByDetectionId.get(detection.id) ?? null,
    };
  });

  return placements.sort((left, right) => comparePlacementsDesc(left.placement, right.placement));
}

function buildIncidents(
  placements: ReturnType<typeof hydratePlacements>,
): AdminDetectionIncidentListItem[] {
  const incidentMap = new Map<string, ReturnType<typeof hydratePlacements>>();

  for (const item of placements) {
    const key = `${item.organization.id}:${item.placement.asset.id}:${item.placement.normalizedDomain}`;
    const current = incidentMap.get(key) ?? [];
    current.push(item);
    incidentMap.set(key, current);
  }

  return [...incidentMap.entries()]
    .map(([key, incidentPlacements]) => {
      const sorted = [...incidentPlacements].sort((left, right) =>
        comparePlacementsDesc(left.placement, right.placement),
      );
      const representative = sorted[0];
      const pageMap = new Map<string, typeof sorted>();

      for (const item of sorted) {
        const pageKey = item.placement.canonicalSourceUrl || item.placement.sourceUrl;
        const current = pageMap.get(pageKey) ?? [];
        current.push(item);
        pageMap.set(pageKey, current);
      }

      const pages = [...pageMap.entries()]
        .map(([pageKey, pagePlacements]) => {
          const sortedPagePlacements = [...pagePlacements].sort((left, right) =>
            comparePlacementsDesc(left.placement, right.placement),
          );
          const pageRepresentative = sortedPagePlacements[0];
          const placementsForPage = sortedPagePlacements.map((item) => ({
            id: item.placement.id,
            publicId: item.placement.publicId,
            sourceUrl: item.placement.sourceUrl,
            pageTitle: item.placement.pageTitle,
            status: item.placement.status,
            matchType: item.placement.matchType,
            confidenceScore: item.placement.confidenceScore,
            lastSeenAt: item.placement.lastSeenAt,
            reviewedAt: item.placement.reviewedAt,
            matchedImageUrl:
              item.placement.latestEvidence?.matchedImageUrl ?? item.placement.matchedImageUrl,
            latestEvidence: item.placement.latestEvidence,
          }));

          return {
            key: pageKey,
            sourceUrl: pageRepresentative.placement.sourceUrl,
            canonicalSourceUrl: pageRepresentative.placement.canonicalSourceUrl,
            pageTitle: pageRepresentative.placement.pageTitle,
            firstSeenAt: sortedPagePlacements.reduce(
              (current, item) => pickEarliestIsoDate(current, item.placement.firstSeenAt),
              pageRepresentative.placement.firstSeenAt,
            ),
            lastSeenAt: pageRepresentative.placement.lastSeenAt,
            placementsCount: placementsForPage.length,
            capturedEvidenceCount: placementsForPage.filter(
              (placement) => placement.latestEvidence?.captureStatus === "captured",
            ).length,
            evidenceCoverage: getPageEvidenceCoverage(placementsForPage),
            representativeDetectionId: pageRepresentative.placement.id,
            placements: placementsForPage,
          } satisfies DetectionIncidentPageGroup;
        })
        .sort((left, right) => compareIsoDatesDesc(left.lastSeenAt, right.lastSeenAt));

      const incidentStatus = resolveIncidentStatus(sorted.map((item) => item.placement.status));
      const placementsCount = sorted.length;
      const capturedEvidenceCount = sorted.filter(
        (item) => item.placement.latestEvidence?.captureStatus === "captured",
      ).length;

      return {
        key,
        publicId: representative.placement.publicId,
        casePublicId: representative.placement.casePublicId,
        asset: representative.placement.asset,
        domain: representative.placement.domain ?? representative.placement.normalizedDomain,
        normalizedDomain: representative.placement.normalizedDomain,
        sourceScope: representative.placement.sourceScope,
        primaryPageTitle: pages[0]?.pageTitle ?? representative.placement.pageTitle,
        firstSeenAt: sorted.reduce(
          (current, item) => pickEarliestIsoDate(current, item.placement.firstSeenAt),
          representative.placement.firstSeenAt,
        ),
        latestSeenAt: representative.placement.lastSeenAt,
        incidentStatus: incidentStatus.status,
        statusNote: incidentStatus.note,
        evidenceCoverage: getIncidentEvidenceCoverage(pages),
        pagesCount: pages.length,
        placementsCount,
        capturedEvidenceCount,
        primaryDetectionId: representative.placement.id,
        bestMatchedImageUrl:
          representative.placement.latestEvidence?.matchedImageUrl ??
          representative.placement.matchedImageUrl,
        pages,
        organization: representative.organization,
        latestActionAt: sorted.reduce<string | null>((latest, item) => {
          if (!item.latestActionAt) {
            return latest;
          }

          if (!latest || new Date(item.latestActionAt).getTime() > new Date(latest).getTime()) {
            return item.latestActionAt;
          }

          return latest;
        }, null),
      } satisfies AdminDetectionIncidentListItem;
    })
    .sort((left, right) => compareIsoDatesDesc(left.latestSeenAt, right.latestSeenAt));
}

export async function listAdminDetectionIncidents(): Promise<AdminDetectionIncidentListItem[]> {
  const context = await loadAdminDetectionContext();
  return buildIncidents(hydratePlacements(context));
}

export async function getAdminDetectionDetails(
  organizationId: string,
  detectionId: string,
): Promise<AdminDetectionDetails> {
  const context = await loadAdminDetectionContext();
  const placements = hydratePlacements(context);
  const current = placements.find(
    (item) => item.organization.id === organizationId && item.placement.id === detectionId,
  );

  if (!current) {
    notFound();
  }

  const siblingPlacements = placements.filter(
    (item) =>
      item.organization.id === organizationId &&
      item.placement.asset.id === current.placement.asset.id &&
      item.placement.normalizedDomain === current.placement.normalizedDomain,
  );
  const incident =
    buildIncidents(siblingPlacements)[0] ??
    buildIncidents([current])[0];

  const supabase = await createClient();
  const { data: evidences, error: evidencesError } = await supabase
    .from("detection_evidences")
    .select(
      "id, detection_id, scan_run_id, screenshot_storage_key, matched_image_storage_key, captured_at, capture_status, capture_error_message, metadata, source_url_snapshot, matched_image_url_snapshot, created_at",
    )
    .eq("detection_id", detectionId)
    .order("created_at", { ascending: false })
    .returns<DetectionEvidenceRow[]>();

  if (evidencesError) {
    throw new Error("Nao foi possivel carregar as evidencias desta ocorrencia.");
  }

  let reviewedByName: string | null = null;
  if (current.placement.reviewedAt && context.profiles.length > 0) {
    const matchedProfile = context.profiles.find(
      (profile) => profile.id === context.detections.find((item) => item.id === detectionId)?.reviewed_by_user_id,
    );
    reviewedByName = matchedProfile?.full_name ?? matchedProfile?.email ?? null;
  }

  const mappedEvidences = (evidences ?? []).map((evidence) => mapEvidence(detectionId, evidence));

  return {
    ...current.placement,
    latestEvidence: mappedEvidences[0] ?? current.placement.latestEvidence,
    reviewedByName,
    evidences: mappedEvidences,
    incident,
    currentPage:
      incident.pages.find((page) => page.key === current.placement.canonicalSourceUrl) ?? null,
    organization: current.organization,
  };
}
