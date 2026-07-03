import "server-only";

import { notFound } from "next/navigation";
import { requirePanelAccess, type OrganizationMemberRole } from "@/lib/auth";
import { requireOperationalBillingAccess } from "@/lib/dal/billing";
import { buildAssetPublicUrl } from "@/lib/r2";
import { createClient } from "@/lib/server";

export type MonitoringRuleFrequency = "hourly" | "daily" | "weekly" | "monthly";
export type AssetSummaryStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed_without_detections"
  | "completed_with_detections"
  | "failed";

type AssetRow = {
  id: string;
  public_id: number;
  organization_id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  author: string | null;
  license_type: string | null;
  status: "draft" | "active" | "paused" | "archived";
  created_at: string;
  updated_at: string;
};

type AssetFolderRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type AssetFileRow = {
  id: string;
  asset_id: string;
  public_url: string | null;
  storage_key: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  is_primary: boolean;
  created_at: string;
};

type MonitoringRuleRow = {
  id: string;
  asset_id: string | null;
  name: string;
  frequency: MonitoringRuleFrequency;
  is_active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
};

type ScanJobRow = {
  id: string;
  asset_id: string;
  monitoring_rule_id: string | null;
  type: "manual_scan" | "scheduled_scan" | "retry_scan";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
};

type ScanRunRow = {
  id: string;
  scan_job_id: string;
  status: "started" | "vision_completed" | "evidence_pending" | "completed" | "failed";
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
};

type DetectionRow = {
  id: string;
  public_id: number;
  asset_id: string;
  status: string;
  source_url: string;
  domain: string | null;
  created_at: string;
  last_seen_at: string;
};

export type AssetFolderListItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  assetsCount: number;
};

export type AssetListItem = {
  id: string;
  publicId: number;
  folder: {
    id: string;
    name: string;
  } | null;
  title: string;
  description: string | null;
  author: string | null;
  licenseType: string | null;
  createdAt: string;
  primaryFile: {
    publicUrl: string | null;
    originalFileName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
  } | null;
  monitoringRule: {
    id: string;
    name: string;
    frequency: MonitoringRuleFrequency;
    isActive: boolean;
    nextRunAt: string | null;
    lastRunAt: string | null;
  } | null;
  latestScanJob: {
    id: string;
    type: ScanJobRow["type"];
    status: ScanJobRow["status"];
    scheduledAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
  } | null;
  latestScanRun: {
    id: string;
    status: ScanRunRow["status"];
    startedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    errorMessage: string | null;
  } | null;
  detectionsCount: number;
  statusSummary: {
    kind: AssetSummaryStatus;
    label: string;
    description: string;
  };
};

export type AssetDetails = AssetListItem & {
  scanJobs: Array<{
    id: string;
    type: ScanJobRow["type"];
    status: ScanJobRow["status"];
    scheduledAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    errorMessage: string | null;
    run: {
      id: string;
      status: ScanRunRow["status"];
      startedAt: string;
      finishedAt: string | null;
      durationMs: number | null;
      errorMessage: string | null;
    } | null;
  }>;
  detections: Array<{
    id: string;
    publicId: number;
    sourceUrl: string;
    domain: string | null;
    status: string;
    lastSeenAt: string;
  }>;
};

function isMissingFolderSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42P01" ||
    candidate.code === "42703" ||
    combinedMessage.includes("asset_folders") ||
    combinedMessage.includes("folder_id")
  );
}

export async function requireActiveOrganization() {
  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    throw new Error("Organizacao ativa nao encontrada.");
  }

  await requireOperationalBillingAccess(membership.organizationId);

  return {
    context,
    membership,
    organizationId: membership.organizationId,
    userId: context.userId,
  };
}

export async function requireWritableOrganization() {
  const { context, membership, organizationId, userId } = await requireActiveOrganization();

  if (!canWriteOrganization(membership.role)) {
    throw new Error("Voce nao tem permissao para cadastrar assets nesta organizacao.");
  }

  return {
    context,
    organizationId,
    userId,
  };
}

function canWriteOrganization(role: OrganizationMemberRole) {
  return role === "owner" || role === "admin";
}

export function buildManualScanDedupeKey(assetId: string) {
  return `manual:${assetId}:${crypto.randomUUID()}`;
}

export function getDefaultNextRunAt(frequency: MonitoringRuleFrequency) {
  const base = new Date();

  switch (frequency) {
    case "hourly":
      base.setHours(base.getHours() + 1);
      break;
    case "daily":
      base.setDate(base.getDate() + 1);
      break;
    case "weekly":
      base.setDate(base.getDate() + 7);
      break;
    case "monthly":
      base.setMonth(base.getMonth() + 1);
      break;
  }

  return base.toISOString();
}

export async function getOrganizationMonitoringFrequency(
  organizationId: string,
): Promise<MonitoringRuleFrequency> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select("scan_frequency_cap_snapshot, subscription_plans(scan_frequency_cap)")
    .eq("organization_id", organizationId)
    .in("status", ["trialing", "active", "past_due", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      scan_frequency_cap_snapshot: MonitoringRuleFrequency | null;
      subscription_plans: { scan_frequency_cap: MonitoringRuleFrequency | null } | null;
    }>();

  if (error) {
    throw new Error("Nao foi possivel carregar a frequencia de monitoramento da organizacao.");
  }

  return (
    data?.scan_frequency_cap_snapshot ??
    data?.subscription_plans?.scan_frequency_cap ??
    "daily"
  );
}

export function summarizeAssetStatus(params: {
  latestScanJob: ScanJobRow | null;
  latestScanRun: ScanRunRow | null;
  detectionsCount: number;
}): AssetListItem["statusSummary"] {
  const { latestScanJob, latestScanRun, detectionsCount } = params;

  if (!latestScanJob) {
    return {
      kind: "idle",
      label: "Sem varredura iniciada",
      description: "O asset foi cadastrado, mas ainda nao possui uma busca registrada.",
    };
  }

  if (latestScanJob.status === "pending") {
    return {
      kind: "pending",
      label: "Aguardando varredura",
      description: "A busca foi criada e esta aguardando o inicio do processamento.",
    };
  }

  if (latestScanJob.status === "completed" && detectionsCount > 0) {
    return {
      kind: "completed_with_detections",
      label: "Aguardando validacao",
      description:
        "Encontramos correspondencias que precisam de revisao humana antes de qualquer conclusao.",
    };
  }

  if (latestScanJob.status === "completed") {
    return {
      kind: "completed_without_detections",
      label: "Nenhuma ocorrencia encontrada",
      description: "A ultima busca terminou sem registrar deteccoes para este asset.",
    };
  }

  if (
    latestScanJob.status === "processing" ||
    latestScanRun?.status === "started" ||
    latestScanRun?.status === "vision_completed" ||
    latestScanRun?.status === "evidence_pending"
  ) {
    return {
      kind: "processing",
      label: "Processando",
      description: "A busca ou a captura de evidencias ainda esta em andamento.",
    };
  }

  if (latestScanJob.status === "failed" || latestScanRun?.status === "failed") {
    return {
      kind: "failed",
      label: "Falha na varredura",
      description:
        latestScanJob.error_message ??
        latestScanRun?.error_message ??
        "Houve uma falha durante o processamento desta busca.",
    };
  }

  return {
    kind: "processing",
    label: "Processando",
    description: "A busca ainda esta em andamento.",
  };
}

export async function listOrganizationAssetFolders(): Promise<AssetFolderListItem[]> {
  const { organizationId } = await requireActiveOrganization();
  const supabase = await createClient();

  const [{ data: folders, error: foldersError }, { data: assets, error: assetsError }] =
    await Promise.all([
      supabase
        .from("asset_folders")
        .select("id, organization_id, name, description, created_at")
        .eq("organization_id", organizationId)
        .order("name", { ascending: true }),
      supabase
        .from("assets")
        .select("id, folder_id")
        .eq("organization_id", organizationId)
        .is("archived_at", null),
    ]);

  if (foldersError || assetsError) {
    if (
      isMissingFolderSchemaError(foldersError) ||
      isMissingFolderSchemaError(assetsError)
    ) {
      return [];
    }

    throw new Error("Nao foi possivel carregar as pastas da organizacao.");
  }

  const counts = new Map<string, number>();
  for (const asset of (assets ?? []) as Array<{ id: string; folder_id: string | null }>) {
    if (!asset.folder_id) {
      continue;
    }

    counts.set(asset.folder_id, (counts.get(asset.folder_id) ?? 0) + 1);
  }

  return ((folders ?? []) as AssetFolderRow[]).map((folder) => ({
    id: folder.id,
    name: folder.name,
    description: folder.description,
    createdAt: folder.created_at,
    assetsCount: counts.get(folder.id) ?? 0,
  }));
}

export async function listOrganizationAssets(options?: {
  folderId?: string | null;
  includeUnassigned?: boolean;
}): Promise<AssetListItem[]> {
  const { organizationId } = await requireActiveOrganization();
  const supabase = await createClient();
  let queryWithFolders = supabase
    .from("assets")
    .select("id, public_id, organization_id, folder_id, title, description, author, license_type, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (options?.folderId) {
    queryWithFolders = queryWithFolders.eq("folder_id", options.folderId);
  } else if (options?.includeUnassigned) {
    queryWithFolders = queryWithFolders.is("folder_id", null);
  }

  let { data: assets, error } = await queryWithFolders;

  if (error && isMissingFolderSchemaError(error)) {
    if (options?.folderId || options?.includeUnassigned) {
      return [];
    }

    const fallback = await supabase
      .from("assets")
      .select("id, public_id, organization_id, title, description, author, license_type, status, created_at, updated_at")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    error = fallback.error;
    assets = (fallback.data ?? []).map((asset) => ({
      ...asset,
      folder_id: null,
    })) as AssetRow[];
  }

  if (error) {
    throw new Error("Nao foi possivel carregar os assets.");
  }

  return hydrateAssets(organizationId, (assets ?? []) as AssetRow[]);
}

export async function getAssetDetails(assetId: string): Promise<AssetDetails> {
  const { organizationId } = await requireActiveOrganization();
  const items = await hydrateAssets(
    organizationId,
    await getSingleAssetRows(organizationId, assetId),
  );
  const asset = items[0];

  if (!asset) {
    notFound();
  }

  const supabase = await createClient();
  const { data: jobs, error: jobsError } = await supabase
    .from("scan_jobs")
    .select("id, asset_id, monitoring_rule_id, type, status, scheduled_at, started_at, finished_at, error_message, created_at")
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId)
    .order("scheduled_at", { ascending: false })
    .limit(5);

  if (jobsError) {
    throw new Error("Nao foi possivel carregar o historico de varreduras.");
  }

  const jobRows = (jobs ?? []) as ScanJobRow[];
  const runsByJobId = await getRunsByJobId(organizationId, jobRows.map((job) => job.id));

  const { data: detections, error: detectionsError } = await supabase
    .from("detections")
    .select("id, public_id, asset_id, status, source_url, domain, created_at, last_seen_at")
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId)
    .order("last_seen_at", { ascending: false })
    .limit(10);

  if (detectionsError) {
    throw new Error("Nao foi possivel carregar as deteccoes do asset.");
  }

  return {
    ...asset,
    scanJobs: jobRows.map((job) => {
      const run = runsByJobId.get(job.id);

      return {
        id: job.id,
        type: job.type,
        status: job.status,
        scheduledAt: job.scheduled_at,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        errorMessage: job.error_message,
        run: run
          ? {
              id: run.id,
              status: run.status,
              startedAt: run.started_at,
              finishedAt: run.finished_at,
              durationMs: run.duration_ms,
              errorMessage: run.error_message,
            }
          : null,
      };
    }),
    detections: ((detections ?? []) as DetectionRow[]).map((detection) => ({
      id: detection.id,
      publicId: detection.public_id,
      sourceUrl: detection.source_url,
      domain: detection.domain,
      status: detection.status,
      lastSeenAt: detection.last_seen_at,
    })),
  };
}

async function getSingleAssetRows(organizationId: string, assetId: string) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("assets")
    .select("id, public_id, organization_id, folder_id, title, description, author, license_type, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("id", assetId)
    .is("archived_at", null)
    .limit(1);

  if (error && isMissingFolderSchemaError(error)) {
    const fallback = await supabase
      .from("assets")
      .select("id, public_id, organization_id, title, description, author, license_type, status, created_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("id", assetId)
      .is("archived_at", null)
      .limit(1);

    error = fallback.error;
    data = (fallback.data ?? []).map((asset) => ({
      ...asset,
      folder_id: null,
    })) as AssetRow[];
  }

  if (error) {
    throw new Error("Nao foi possivel carregar o asset.");
  }

  return (data ?? []) as AssetRow[];
}

async function getRunsByJobId(organizationId: string, jobIds: string[]) {
  const supabase = await createClient();
  const runsByJobId = new Map<string, ScanRunRow>();

  if (jobIds.length === 0) {
    return runsByJobId;
  }

  const { data: runs, error } = await supabase
    .from("scan_runs")
    .select("id, scan_job_id, status, started_at, finished_at, duration_ms, error_message, created_at")
    .eq("organization_id", organizationId)
    .in("scan_job_id", jobIds)
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error("Nao foi possivel carregar o status das execucoes.");
  }

  for (const run of (runs ?? []) as ScanRunRow[]) {
    if (!runsByJobId.has(run.scan_job_id)) {
      runsByJobId.set(run.scan_job_id, run);
    }
  }

  return runsByJobId;
}

async function hydrateAssets(
  organizationId: string,
  assets: AssetRow[],
): Promise<AssetListItem[]> {
  if (assets.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const assetIds = assets.map((asset) => asset.id);
  const folderIds = Array.from(
    new Set(assets.map((asset) => asset.folder_id).filter(Boolean)),
  ) as string[];
  const [filesResponse, rulesResponse, jobsResponse, detectionsResponse, foldersResponse] =
    await Promise.all([
      supabase
        .from("asset_files")
        .select("id, asset_id, public_url, storage_key, original_file_name, mime_type, size_bytes, is_primary, created_at")
        .eq("organization_id", organizationId)
        .eq("is_primary", true)
        .in("asset_id", assetIds),
      supabase
        .from("monitoring_rules")
        .select("id, asset_id, name, frequency, is_active, next_run_at, last_run_at, created_at")
        .eq("organization_id", organizationId)
        .in("asset_id", assetIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("scan_jobs")
        .select("id, asset_id, monitoring_rule_id, type, status, scheduled_at, started_at, finished_at, error_message, created_at")
        .eq("organization_id", organizationId)
        .in("asset_id", assetIds)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("detections")
        .select("id, public_id, asset_id, status, source_url, domain, created_at, last_seen_at")
        .eq("organization_id", organizationId)
        .in("asset_id", assetIds),
      folderIds.length > 0
        ? supabase
            .from("asset_folders")
            .select("id, organization_id, name, description, created_at")
            .eq("organization_id", organizationId)
            .in("id", folderIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const missingFolderSchema =
    isMissingFolderSchemaError(filesResponse.error) ||
    isMissingFolderSchemaError(rulesResponse.error) ||
    isMissingFolderSchemaError(jobsResponse.error) ||
    isMissingFolderSchemaError(detectionsResponse.error) ||
    isMissingFolderSchemaError(foldersResponse.error);

  if (
    filesResponse.error ||
    rulesResponse.error ||
    jobsResponse.error ||
    detectionsResponse.error ||
    foldersResponse.error
  ) {
    if (missingFolderSchema) {
      // Folder support has not been migrated yet; continue with folder-less view.
    } else {
      throw new Error("Nao foi possivel montar o acompanhamento dos assets.");
    }
  }

  if (missingFolderSchema) {
    const folderlessAssets = assets.map((asset) => ({
      ...asset,
      folder_id: null,
    }));

    return hydrateAssetsWithoutFolderLookup(
      organizationId,
      folderlessAssets,
      filesResponse.data ?? [],
      rulesResponse.data ?? [],
      jobsResponse.data ?? [],
      detectionsResponse.data ?? [],
    );
  }

  return buildHydratedAssets(
    assets,
    filesResponse.data ?? [],
    rulesResponse.data ?? [],
    jobsResponse.data ?? [],
    detectionsResponse.data ?? [],
    foldersResponse.data ?? [],
    await getRunsByJobId(
      organizationId,
      ((jobsResponse.data ?? []) as ScanJobRow[]).map((job) => job.id),
    ),
  );
}

async function hydrateAssetsWithoutFolderLookup(
  organizationId: string,
  assets: AssetRow[],
  files: unknown[],
  rules: unknown[],
  jobs: unknown[],
  detections: unknown[],
) {
  return buildHydratedAssets(
    assets,
    files,
    rules,
    jobs,
    detections,
    [],
    await getRunsByJobId(
      organizationId,
      (jobs as ScanJobRow[]).map((job) => job.id),
    ),
  );
}

function buildHydratedAssets(
  assets: AssetRow[],
  files: unknown[],
  rules: unknown[],
  jobs: unknown[],
  detections: unknown[],
  folders: unknown[],
  runsByJobId: Map<string, ScanRunRow>,
) {
  const filesByAssetId = new Map<string, AssetFileRow>();
  for (const file of files as AssetFileRow[]) {
    if (!filesByAssetId.has(file.asset_id)) {
      filesByAssetId.set(file.asset_id, file);
    }
  }

  const rulesByAssetId = new Map<string, MonitoringRuleRow>();
  for (const rule of rules as MonitoringRuleRow[]) {
    if (rule.asset_id && !rulesByAssetId.has(rule.asset_id)) {
      rulesByAssetId.set(rule.asset_id, rule);
    }
  }

  const jobsByAssetId = new Map<string, ScanJobRow>();
  const scanJobs = jobs as ScanJobRow[];
  for (const job of scanJobs) {
    if (!jobsByAssetId.has(job.asset_id)) {
      jobsByAssetId.set(job.asset_id, job);
    }
  }

  const detectionCounts = new Map<string, number>();
  for (const detection of detections as DetectionRow[]) {
    detectionCounts.set(
      detection.asset_id,
      (detectionCounts.get(detection.asset_id) ?? 0) + 1,
    );
  }

  const foldersById = new Map<string, AssetFolderRow>();
  for (const folder of folders as AssetFolderRow[]) {
    foldersById.set(folder.id, folder);
  }

  return assets.map((asset) => {
    const primaryFile = filesByAssetId.get(asset.id) ?? null;
    const monitoringRule = rulesByAssetId.get(asset.id) ?? null;
    const latestScanJob = jobsByAssetId.get(asset.id) ?? null;
    const latestScanRun = latestScanJob ? runsByJobId.get(latestScanJob.id) ?? null : null;
    const detectionsCount = detectionCounts.get(asset.id) ?? 0;
    const folder = asset.folder_id ? (foldersById.get(asset.folder_id) ?? null) : null;

    return {
      id: asset.id,
      publicId: asset.public_id,
      folder: folder
        ? {
            id: folder.id,
            name: folder.name,
          }
        : null,
      title: asset.title,
      description: asset.description,
      author: asset.author,
      licenseType: asset.license_type,
      createdAt: asset.created_at,
      primaryFile: primaryFile
        ? {
            publicUrl: primaryFile.storage_key
              ? buildAssetPublicUrl(primaryFile.storage_key)
              : primaryFile.public_url,
            originalFileName: primaryFile.original_file_name,
            mimeType: primaryFile.mime_type,
            sizeBytes: primaryFile.size_bytes,
          }
        : null,
      monitoringRule: monitoringRule
        ? {
            id: monitoringRule.id,
            name: monitoringRule.name,
            frequency: monitoringRule.frequency,
            isActive: monitoringRule.is_active,
            nextRunAt: monitoringRule.next_run_at,
            lastRunAt: monitoringRule.last_run_at,
          }
        : null,
      latestScanJob: latestScanJob
        ? {
            id: latestScanJob.id,
            type: latestScanJob.type,
            status: latestScanJob.status,
            scheduledAt: latestScanJob.scheduled_at,
            startedAt: latestScanJob.started_at,
            finishedAt: latestScanJob.finished_at,
            errorMessage: latestScanJob.error_message,
          }
        : null,
      latestScanRun: latestScanRun
        ? {
            id: latestScanRun.id,
            status: latestScanRun.status,
            startedAt: latestScanRun.started_at,
            finishedAt: latestScanRun.finished_at,
            durationMs: latestScanRun.duration_ms,
            errorMessage: latestScanRun.error_message,
          }
        : null,
      detectionsCount,
      statusSummary: summarizeAssetStatus({
        latestScanJob,
        latestScanRun,
        detectionsCount,
      }),
    };
  });
}
