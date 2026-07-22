import "server-only";

import {
  generateCaseValidationCode,
  hashCaseValidationCode,
  isValidCaseValidationCode,
  selectCaseValidationCodeMatch,
  type GeneratedCaseValidationCode,
} from "@/lib/case-validation-code";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_CASE_STATUSES = ["unauthorized", "takedown_sent", "resolved"] as const;

export type PublicCaseValidationImageKind = "original" | "matched";

type CaseValidationCodeRow = {
  organization_id: string;
  case_public_id: number;
  code_hash: string;
  revoked_at: string | null;
};

type DetectionRow = {
  id: string;
  asset_id: string;
  page_title: string | null;
  domain: string | null;
  source_url: string;
  canonical_source_url: string;
  first_seen_at: string;
  last_seen_at: string;
};

type DetectionEvidenceRow = {
  detection_id: string;
  matched_image_storage_key: string | null;
  captured_at: string | null;
  metadata: Record<string, unknown> | null;
};

type AssetFileRow = {
  storage_key: string | null;
};

type ValidatedCaseContext = {
  organizationId: string;
  casePublicId: number;
};

export type PublicCaseValidationDetails = {
  casePublicId: number;
  domain: string;
  siteTitle: string;
  detectedAt: string;
  capturedAt: string | null;
  hasOriginalImage: boolean;
  hasMatchedImage: boolean;
};

export type PublicCaseValidationImageRef = {
  bucket: "assets" | "evidence";
  storageKey: string;
};

export async function createCasePublicValidationCode(params: {
  organizationId: string;
  casePublicId: number;
  createdByUserId: string;
}): Promise<GeneratedCaseValidationCode> {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const generated = generateCaseValidationCode();
    const { error } = await supabase.from("case_public_validation_codes").insert({
      organization_id: params.organizationId,
      case_public_id: params.casePublicId,
      code_hash: generated.hash,
      code_hint: generated.hint,
      created_by_user_id: params.createdByUserId,
    });

    if (!error) {
      return generated;
    }

    if (error.code !== "23505") {
      throw new Error("Nao foi possivel gerar a chave de validacao publica.");
    }
  }

  throw new Error("Nao foi possivel gerar uma chave unica de validacao publica.");
}

async function validateCasePublicCode(params: {
  casePublicId: number;
  validationCode: string;
}): Promise<ValidatedCaseContext | null> {
  if (!isValidCaseValidationCode(params.validationCode)) {
    return null;
  }

  const codeHash = hashCaseValidationCode(params.validationCode);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("case_public_validation_codes")
    .select("organization_id, case_public_id, code_hash, revoked_at")
    .eq("case_public_id", params.casePublicId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<CaseValidationCodeRow[]>();

  if (error) {
    throw new Error("Nao foi possivel validar esta notificacao.");
  }

  const match = selectCaseValidationCodeMatch(
    (data ?? []).map((row) => ({
      organizationId: row.organization_id,
      casePublicId: row.case_public_id,
      codeHash: row.code_hash,
      revokedAt: row.revoked_at,
    })),
    {
      casePublicId: params.casePublicId,
      codeHash,
    },
  );

  return match
    ? {
        organizationId: match.organizationId,
        casePublicId: match.casePublicId,
      }
    : null;
}

function getMetadataValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  return metadata[key] ?? null;
}

function getSiteSnapshotTitle(metadata: Record<string, unknown> | null | undefined) {
  const candidate = getMetadataValue(metadata, "siteSnapshot");

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const snapshot = candidate as Record<string, unknown>;
  const title = typeof snapshot.title === "string" ? snapshot.title.trim() : "";
  const siteName = typeof snapshot.siteName === "string" ? snapshot.siteName.trim() : "";

  return title || siteName || null;
}

function normalizeDomain(detection: Pick<DetectionRow, "domain" | "source_url" | "canonical_source_url">) {
  const candidates = [detection.domain, detection.source_url, detection.canonical_source_url];

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

async function loadPublicCaseRows(context: ValidatedCaseContext) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("detections")
    .select(
      "id, asset_id, page_title, domain, source_url, canonical_source_url, first_seen_at, last_seen_at",
    )
    .eq("organization_id", context.organizationId)
    .eq("case_public_id", context.casePublicId)
    .in("status", [...PUBLIC_CASE_STATUSES])
    .is("archived_at", null)
    .order("last_seen_at", { ascending: false })
    .limit(50)
    .returns<DetectionRow[]>();

  if (error) {
    throw new Error("Nao foi possivel carregar os dados desta notificacao.");
  }

  return data ?? [];
}

async function loadLatestEvidenceByDetectionId(
  organizationId: string,
  detectionIds: string[],
) {
  const evidencesByDetectionId = new Map<string, DetectionEvidenceRow>();

  if (detectionIds.length === 0) {
    return evidencesByDetectionId;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("detection_evidences")
    .select(
      "detection_id, matched_image_storage_key, captured_at, metadata",
    )
    .eq("organization_id", organizationId)
    .in("detection_id", detectionIds)
    .order("created_at", { ascending: false })
    .returns<DetectionEvidenceRow[]>();

  if (error) {
    throw new Error("Nao foi possivel carregar as evidencias desta notificacao.");
  }

  for (const evidence of data ?? []) {
    if (!evidencesByDetectionId.has(evidence.detection_id)) {
      evidencesByDetectionId.set(evidence.detection_id, evidence);
    }
  }

  return evidencesByDetectionId;
}

async function loadPrimaryAssetFile(assetId: string, organizationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("asset_files")
    .select("storage_key")
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId)
    .eq("is_primary", true)
    .maybeSingle<AssetFileRow>();

  if (error) {
    throw new Error("Nao foi possivel carregar o arquivo da imagem monitorada.");
  }

  return data;
}

export async function getPublicCaseValidationDetails(params: {
  casePublicId: number;
  validationCode: string;
}): Promise<PublicCaseValidationDetails | null> {
  const context = await validateCasePublicCode(params);

  if (!context) {
    return null;
  }

  const rows = await loadPublicCaseRows(context);
  const representative = rows[0] ?? null;

  if (!representative) {
    return null;
  }

  const evidenceByDetectionId = await loadLatestEvidenceByDetectionId(
    context.organizationId,
    rows.map((row) => row.id),
  );
  const latestEvidence = evidenceByDetectionId.get(representative.id) ?? null;
  const primaryFile = await loadPrimaryAssetFile(
    representative.asset_id,
    context.organizationId,
  );

  return {
    casePublicId: context.casePublicId,
    domain: normalizeDomain(representative),
    siteTitle:
      getSiteSnapshotTitle(latestEvidence?.metadata) ??
      representative.page_title ??
      "Site sem titulo identificado",
    detectedAt: representative.last_seen_at ?? representative.first_seen_at,
    capturedAt: latestEvidence?.captured_at ?? null,
    hasOriginalImage: Boolean(primaryFile?.storage_key),
    hasMatchedImage: rows.some((row) =>
      Boolean(evidenceByDetectionId.get(row.id)?.matched_image_storage_key),
    ),
  };
}

export async function getPublicCaseValidationImageRef(params: {
  casePublicId: number;
  validationCode: string;
  kind: PublicCaseValidationImageKind;
}): Promise<PublicCaseValidationImageRef | null> {
  const context = await validateCasePublicCode(params);

  if (!context) {
    return null;
  }

  const rows = await loadPublicCaseRows(context);
  const representative = rows[0] ?? null;

  if (!representative) {
    return null;
  }

  if (params.kind === "original") {
    const file = await loadPrimaryAssetFile(representative.asset_id, context.organizationId);

    return file?.storage_key
      ? {
          bucket: "assets",
          storageKey: file.storage_key,
        }
      : null;
  }

  const evidenceByDetectionId = await loadLatestEvidenceByDetectionId(
    context.organizationId,
    rows.map((row) => row.id),
  );

  for (const row of rows) {
    const storageKey = evidenceByDetectionId.get(row.id)?.matched_image_storage_key;

    if (storageKey) {
      return {
        bucket: "evidence",
        storageKey,
      };
    }
  }

  return null;
}
