import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type MonitoringRuleFrequency = "hourly" | "daily" | "weekly" | "monthly";
type ScanJobType = "manual_scan" | "scheduled_scan" | "retry_scan";
type ScanJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
type ScanRunStatus =
  | "started"
  | "vision_completed"
  | "evidence_pending"
  | "completed"
  | "failed";

type OrganizationRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type AssetRow = {
  id: string;
  public_id: number;
  organization_id: string;
  title: string;
  status: "draft" | "active" | "paused" | "archived";
};

type MonitoringRuleRow = {
  id: string;
  name: string;
  frequency: MonitoringRuleFrequency;
  is_active: boolean;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type ScanJobRow = {
  id: string;
  organization_id: string;
  asset_id: string;
  monitoring_rule_id: string | null;
  requested_by_user_id: string | null;
  type: ScanJobType;
  status: ScanJobStatus;
  priority: number;
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  attempts: number;
  max_attempts: number;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ScanRunRow = {
  id: string;
  scan_job_id: string;
  status: ScanRunStatus;
  attempt_number: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  worker_id: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type DetectionRow = {
  scan_job_id: string | null;
  public_id: number | null;
};

export type AdminScanListItem = {
  id: string;
  createdAt: string;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
  type: ScanJobType;
  status: ScanJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  organization: {
    id: string;
    name: string;
    isActive: boolean;
  };
  asset: {
    id: string;
    publicId: number | null;
    title: string | null;
    status: AssetRow["status"] | null;
  };
  monitoringRule: {
    id: string;
    name: string;
    frequency: MonitoringRuleFrequency;
    isActive: boolean;
  } | null;
  requestedBy: {
    id: string | null;
    fullName: string | null;
    email: string | null;
  } | null;
  latestRun: {
    id: string;
    status: ScanRunStatus;
    attemptNumber: number;
    startedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    workerId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  } | null;
  detections: {
    count: number;
    publicIds: number[];
  };
};

export async function listAdminScans(limit = 400): Promise<AdminScanListItem[]> {
  await requirePanelAccess("admin");
  const admin = createAdminClient();

  const { data: jobs, error: jobsError } = await admin
    .from("scan_jobs")
    .select(
      "id, organization_id, asset_id, monitoring_rule_id, requested_by_user_id, type, status, priority, scheduled_at, started_at, finished_at, attempts, max_attempts, error_code, error_message, created_at, updated_at",
    )
    .order("scheduled_at", { ascending: false })
    .limit(limit)
    .returns<ScanJobRow[]>();

  if (jobsError) {
    throw new Error("Nao foi possivel carregar as varreduras administrativas.");
  }

  const rows = jobs ?? [];
  if (rows.length === 0) {
    return [];
  }

  const organizationIds = Array.from(new Set(rows.map((job) => job.organization_id)));
  const assetIds = Array.from(new Set(rows.map((job) => job.asset_id)));
  const monitoringRuleIds = Array.from(
    new Set(rows.map((job) => job.monitoring_rule_id).filter(Boolean)),
  ) as string[];
  const requesterIds = Array.from(
    new Set(rows.map((job) => job.requested_by_user_id).filter(Boolean)),
  ) as string[];
  const jobIds = rows.map((job) => job.id);

  const [
    organizationsResponse,
    assetsResponse,
    monitoringRulesResponse,
    requestersResponse,
    runsResponse,
    detectionsResponse,
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, is_active")
      .in("id", organizationIds)
      .returns<OrganizationRow[]>(),
    admin
      .from("assets")
      .select("id, public_id, organization_id, title, status")
      .in("id", assetIds)
      .returns<AssetRow[]>(),
    monitoringRuleIds.length > 0
      ? admin
          .from("monitoring_rules")
          .select("id, name, frequency, is_active")
          .in("id", monitoringRuleIds)
          .returns<MonitoringRuleRow[]>()
      : Promise.resolve({ data: [] as MonitoringRuleRow[], error: null }),
    requesterIds.length > 0
      ? admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", requesterIds)
          .returns<ProfileRow[]>()
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    admin
      .from("scan_runs")
      .select(
        "id, scan_job_id, status, attempt_number, started_at, finished_at, duration_ms, worker_id, error_code, error_message, created_at, updated_at",
      )
      .in("scan_job_id", jobIds)
      .order("attempt_number", { ascending: false })
      .order("started_at", { ascending: false })
      .returns<ScanRunRow[]>(),
    admin
      .from("detections")
      .select("scan_job_id, public_id")
      .in("scan_job_id", jobIds)
      .is("archived_at", null)
      .returns<DetectionRow[]>(),
  ]);

  if (
    organizationsResponse.error ||
    assetsResponse.error ||
    monitoringRulesResponse.error ||
    requestersResponse.error ||
    runsResponse.error ||
    detectionsResponse.error
  ) {
    throw new Error("Nao foi possivel consolidar o acompanhamento das varreduras.");
  }

  const organizationsById = new Map(
    (organizationsResponse.data ?? []).map((organization) => [organization.id, organization]),
  );
  const assetsById = new Map((assetsResponse.data ?? []).map((asset) => [asset.id, asset]));
  const rulesById = new Map(
    (monitoringRulesResponse.data ?? []).map((rule) => [rule.id, rule]),
  );
  const requestersById = new Map(
    (requestersResponse.data ?? []).map((profile) => [profile.id, profile]),
  );
  const latestRunByJobId = new Map<string, ScanRunRow>();

  for (const run of runsResponse.data ?? []) {
    if (!latestRunByJobId.has(run.scan_job_id)) {
      latestRunByJobId.set(run.scan_job_id, run);
    }
  }

  const detectionsByJobId = new Map<string, number[]>();
  for (const detection of detectionsResponse.data ?? []) {
    if (!detection.scan_job_id) {
      continue;
    }

    const current = detectionsByJobId.get(detection.scan_job_id) ?? [];
    if (typeof detection.public_id === "number") {
      current.push(detection.public_id);
    }
    detectionsByJobId.set(detection.scan_job_id, current);
  }

  return rows.map((job) => {
    const organization = organizationsById.get(job.organization_id);
    const asset = assetsById.get(job.asset_id);
    const monitoringRule = job.monitoring_rule_id
      ? (rulesById.get(job.monitoring_rule_id) ?? null)
      : null;
    const requestedBy = job.requested_by_user_id
      ? (requestersById.get(job.requested_by_user_id) ?? null)
      : null;
    const latestRun = latestRunByJobId.get(job.id) ?? null;
    const detectionPublicIds = detectionsByJobId.get(job.id) ?? [];

    return {
      id: job.id,
      createdAt: job.created_at,
      scheduledAt: job.scheduled_at,
      startedAt: job.started_at,
      finishedAt: job.finished_at,
      updatedAt: job.updated_at,
      type: job.type,
      status: job.status,
      priority: job.priority,
      attempts: job.attempts,
      maxAttempts: job.max_attempts,
      errorCode: job.error_code,
      errorMessage: job.error_message,
      organization: {
        id: job.organization_id,
        name: organization?.name ?? "Organizacao nao identificada",
        isActive: organization?.is_active ?? true,
      },
      asset: {
        id: job.asset_id,
        publicId: asset?.public_id ?? null,
        title: asset?.title ?? null,
        status: asset?.status ?? null,
      },
      monitoringRule: monitoringRule
        ? {
            id: monitoringRule.id,
            name: monitoringRule.name,
            frequency: monitoringRule.frequency,
            isActive: monitoringRule.is_active,
          }
        : null,
      requestedBy: requestedBy
        ? {
            id: requestedBy.id,
            fullName: requestedBy.full_name,
            email: requestedBy.email,
          }
        : null,
      latestRun: latestRun
        ? {
            id: latestRun.id,
            status: latestRun.status,
            attemptNumber: latestRun.attempt_number,
            startedAt: latestRun.started_at,
            finishedAt: latestRun.finished_at,
            durationMs: latestRun.duration_ms,
            workerId: latestRun.worker_id,
            errorCode: latestRun.error_code,
            errorMessage: latestRun.error_message,
          }
        : null,
      detections: {
        count: detectionPublicIds.length,
        publicIds: detectionPublicIds.slice(0, 4),
      },
    };
  });
}
