import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import { summarizeAssetStatus, type MonitoringRuleFrequency } from "@/lib/dal/assets";
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
  description: string | null;
  author: string | null;
  license_type: string | null;
  status: "draft" | "active" | "paused" | "archived";
  created_at: string;
  updated_at: string;
};

type AssetFileRow = {
  asset_id: string;
  public_url: string | null;
  storage_key: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
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
  last_seen_at: string;
};

export type AdminAssetListItem = {
  id: string;
  publicId: number;
  organization: {
    id: string;
    name: string;
    document: string | null;
    billingEmail: string | null;
    isActive: boolean;
  };
  title: string;
  description: string | null;
  author: string | null;
  licenseType: string | null;
  createdAt: string;
  updatedAt: string;
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
  latestDetectionPublicIds: number[];
  statusSummary: ReturnType<typeof summarizeAssetStatus>;
};

async function getRunsByJobId(jobIds: string[]) {
  const supabase = await createClient();
  const runsByJobId = new Map<string, ScanRunRow>();

  if (jobIds.length === 0) {
    return runsByJobId;
  }

  const { data, error } = await supabase
    .from("scan_runs")
    .select("id, scan_job_id, status, started_at, finished_at, duration_ms, error_message, created_at")
    .in("scan_job_id", jobIds)
    .order("started_at", { ascending: false })
    .returns<ScanRunRow[]>();

  if (error) {
    throw new Error("Nao foi possivel carregar as execucoes dos assets.");
  }

  for (const run of data ?? []) {
    if (!runsByJobId.has(run.scan_job_id)) {
      runsByJobId.set(run.scan_job_id, run);
    }
  }

  return runsByJobId;
}

export async function listAdminAssets(): Promise<AdminAssetListItem[]> {
  await requirePanelAccess("admin");
  const supabase = await createClient();

  const [{ data: organizations, error: organizationsError }, { data: assets, error: assetsError }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, document, billing_email, is_active")
        .order("name", { ascending: true })
        .returns<OrganizationRow[]>(),
      supabase
        .from("assets")
        .select("id, public_id, organization_id, title, description, author, license_type, status, created_at, updated_at")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .returns<AssetRow[]>(),
    ]);

  if (organizationsError || assetsError) {
    throw new Error("Nao foi possivel carregar a galeria administrativa.");
  }

  const assetRows = assets ?? [];
  if (assetRows.length === 0) {
    return [];
  }

  const assetIds = assetRows.map((asset) => asset.id);
  const [
    { data: files, error: filesError },
    { data: rules, error: rulesError },
    { data: jobs, error: jobsError },
    { data: detections, error: detectionsError },
  ] = await Promise.all([
    supabase
      .from("asset_files")
      .select("asset_id, public_url, storage_key, original_file_name, mime_type, size_bytes")
      .eq("is_primary", true)
      .in("asset_id", assetIds)
      .returns<AssetFileRow[]>(),
    supabase
      .from("monitoring_rules")
      .select("id, asset_id, name, frequency, is_active, next_run_at, last_run_at, created_at")
      .in("asset_id", assetIds)
      .order("created_at", { ascending: false })
      .returns<MonitoringRuleRow[]>(),
    supabase
      .from("scan_jobs")
      .select("id, asset_id, monitoring_rule_id, type, status, scheduled_at, started_at, finished_at, error_message, created_at")
      .in("asset_id", assetIds)
      .order("scheduled_at", { ascending: false })
      .returns<ScanJobRow[]>(),
    supabase
      .from("detections")
      .select("id, public_id, asset_id, status, last_seen_at")
      .in("asset_id", assetIds)
      .is("archived_at", null)
      .order("last_seen_at", { ascending: false })
      .returns<DetectionRow[]>(),
  ]);

  if (filesError || rulesError || jobsError || detectionsError) {
    throw new Error("Nao foi possivel consolidar a galeria administrativa.");
  }

  const latestJobs = jobs ?? [];
  const runsByJobId = await getRunsByJobId(latestJobs.map((job) => job.id));

  const organizationsById = new Map((organizations ?? []).map((item) => [item.id, item]));
  const filesByAssetId = new Map<string, AssetFileRow>();
  for (const file of files ?? []) {
    if (!filesByAssetId.has(file.asset_id)) {
      filesByAssetId.set(file.asset_id, file);
    }
  }

  const rulesByAssetId = new Map<string, MonitoringRuleRow>();
  for (const rule of rules ?? []) {
    if (rule.asset_id && !rulesByAssetId.has(rule.asset_id)) {
      rulesByAssetId.set(rule.asset_id, rule);
    }
  }

  const jobsByAssetId = new Map<string, ScanJobRow>();
  for (const job of latestJobs) {
    if (!jobsByAssetId.has(job.asset_id)) {
      jobsByAssetId.set(job.asset_id, job);
    }
  }

  const detectionsByAssetId = new Map<string, DetectionRow[]>();
  for (const detection of detections ?? []) {
    const current = detectionsByAssetId.get(detection.asset_id) ?? [];
    current.push(detection);
    detectionsByAssetId.set(detection.asset_id, current);
  }

  return assetRows.map((asset) => {
    const organization = organizationsById.get(asset.organization_id);
    const primaryFile = filesByAssetId.get(asset.id) ?? null;
    const monitoringRule = rulesByAssetId.get(asset.id) ?? null;
    const latestScanJob = jobsByAssetId.get(asset.id) ?? null;
    const latestScanRun = latestScanJob ? (runsByJobId.get(latestScanJob.id) ?? null) : null;
    const assetDetections = detectionsByAssetId.get(asset.id) ?? [];

    return {
      id: asset.id,
      publicId: asset.public_id,
      organization: {
        id: asset.organization_id,
        name: organization?.name ?? "Cliente nao identificado",
        document: organization?.document ?? null,
        billingEmail: organization?.billing_email ?? null,
        isActive: organization?.is_active ?? true,
      },
      title: asset.title,
      description: asset.description,
      author: asset.author,
      licenseType: asset.license_type,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
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
      detectionsCount: assetDetections.length,
      latestDetectionPublicIds: assetDetections
        .slice(0, 5)
        .map((detection) => detection.public_id),
      statusSummary: summarizeAssetStatus({
        latestScanJob,
        latestScanRun,
        detectionsCount: assetDetections.length,
      }),
    };
  });
}
