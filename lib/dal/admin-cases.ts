import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import {
  type DetectionEvidenceCoverage,
  type DetectionSiteSnapshot,
} from "@/lib/dal/detections";
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

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type DetectionMatchType = "full" | "partial" | "page" | "unknown";

type AdminCasePlacement = {
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
  latestEvidence: {
    captureStatus: string;
    capturedAt: string | null;
    finalUrl: string | null;
    sourceUrlSnapshot: string | null;
    matchedImageSourceUrl: string | null;
    siteSnapshot: DetectionSiteSnapshot | null;
  } | null;
};

export type AdminCaseListItem = {
  key: string;
  publicId: number;
  organization: {
    id: string;
    name: string;
    billingEmail: string | null;
  };
  asset: AdminCasePlacement["asset"];
  domain: string;
  primaryPageTitle: string | null;
  sourceUrl: string;
  finalUrl: string | null;
  matchedImageUrl: string | null;
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
    createdAt: string;
    fromStatus: string | null;
    toStatus: string | null;
    notes: string | null;
    reason: string | null;
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

function parseActionReason(metadata: Record<string, unknown> | null | undefined) {
  const reason = getMetadataValue(metadata, "reason");
  return typeof reason === "string" && reason.trim().length > 0 ? reason : null;
}

function mapDetection(
  detection: DetectionRow,
  organization: OrganizationRow | undefined,
  asset: AssetRow | undefined,
  primaryFile: AssetFileRow | undefined,
  latestEvidence: DetectionEvidenceRow | undefined,
) {
  const siteSnapshot = getSiteSnapshot(latestEvidence?.metadata);

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
      latestEvidence: latestEvidence
        ? {
            captureStatus: latestEvidence.capture_status,
            capturedAt: latestEvidence.captured_at,
            finalUrl: getEvidenceFinalUrl(latestEvidence.metadata),
            sourceUrlSnapshot: latestEvidence.source_url_snapshot,
            matchedImageSourceUrl: latestEvidence.matched_image_url_snapshot,
            siteSnapshot,
          }
        : null,
    } satisfies AdminCasePlacement,
  };
}

export async function listAdminCases(): Promise<AdminCaseListItem[]> {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data: detections, error: detectionsError } = await supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, matched_image_url, page_title, domain, confidence_score, vision_payload, status, first_seen_at, last_seen_at, last_scanned_at, reviewed_at, reviewed_by_user_id, created_at",
    )
    .in("status", ["unauthorized", "takedown_sent", "resolved"])
    .is("archived_at", null)
    .order("last_seen_at", { ascending: false })
    .returns<DetectionRow[]>();

  if (detectionsError) {
    throw new Error("Nao foi possivel carregar os casos do painel administrativo.");
  }

  const rows = detections ?? [];

  if (rows.length === 0) {
    return [];
  }

  const organizationIds = Array.from(new Set(rows.map((item) => item.organization_id)));
  const assetIds = Array.from(new Set(rows.map((item) => item.asset_id)));
  const detectionIds = rows.map((item) => item.id);

  const [
    { data: organizations, error: organizationsError },
    { data: assets, error: assetsError },
    { data: files, error: filesError },
    { data: evidences, error: evidencesError },
    { data: actions, error: actionsError },
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
  ]);

  if (organizationsError || assetsError || filesError || evidencesError || actionsError) {
    throw new Error("Nao foi possivel consolidar os dados dos casos.");
  }

  const profileIds = uniqueStrings((actions ?? []).map((item) => item.user_id));
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

  const actionsByDetectionId = new Map<string, DetectionActionRow[]>();
  for (const action of actions ?? []) {
    const current = actionsByDetectionId.get(action.detection_id) ?? [];
    current.push(action);
    actionsByDetectionId.set(action.detection_id, current);
  }

  const groupedCases = new Map<
    string,
    {
      casePublicId: number;
      organization: AdminCaseListItem["organization"];
      placements: AdminCasePlacement[];
      actions: DetectionActionRow[];
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
    const caseKey = `${row.organization_id}:${row.case_public_id}`;
    const current = groupedCases.get(caseKey) ?? {
      casePublicId: row.case_public_id,
      organization: mapped.organization,
      placements: [],
      actions: [],
    };

    current.placements.push(mapped.placement);
    current.actions.push(...(actionsByDetectionId.get(row.id) ?? []));
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

      const pageCoverages = [...pageMap.values()].map((pagePlacements) =>
        getPageEvidenceCoverage(pagePlacements),
      );
      const siteSnapshots = placements
        .map((placement) => placement.latestEvidence?.siteSnapshot ?? null)
        .filter((snapshot): snapshot is DetectionSiteSnapshot => Boolean(snapshot));
      const latestAction = [...group.actions].sort((left, right) =>
        compareIsoDatesDesc(left.created_at, right.created_at),
      )[0];
      const actionActor = latestAction?.user_id ? profilesById.get(latestAction.user_id) : null;

      return {
        key: caseKey,
        publicId: group.casePublicId,
        organization: group.organization,
        asset: representative.asset,
        domain:
          representative.domain && representative.domain !== "site-nao-identificado"
            ? representative.domain
            : representative.normalizedDomain,
        primaryPageTitle: representative.pageTitle,
        sourceUrl: representative.sourceUrl,
        finalUrl: representative.latestEvidence?.finalUrl ?? null,
        matchedImageUrl:
          representative.latestEvidence?.matchedImageSourceUrl ??
          representative.matchedImageUrl,
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
        evidenceCoverage: getIncidentEvidenceCoverage(pageCoverages),
        pagesCount: pageMap.size,
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
              actorName: actionActor?.full_name ?? actionActor?.email ?? null,
              createdAt: latestAction.created_at,
              fromStatus: latestAction.from_status,
              toStatus: latestAction.to_status,
              notes: latestAction.notes,
              reason: parseActionReason(latestAction.metadata),
            }
          : null,
      } satisfies AdminCaseListItem;
    })
    .sort((left, right) => compareIsoDatesDesc(left.latestSeenAt, right.latestSeenAt));
}
