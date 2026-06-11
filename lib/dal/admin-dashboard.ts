import "server-only";

import { requirePanelAccess } from "@/lib/auth";
import { createClient } from "@/lib/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CHART_WINDOW_DAYS = 90;
const COMPARISON_WINDOW_DAYS = 30;

type OrganizationRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type DetectionRow = {
  id: string;
  public_id: number | null;
  case_public_id: number | null;
  organization_id: string;
  asset_id: string;
  status: string;
  domain: string | null;
  page_title: string | null;
  created_at: string;
  last_seen_at: string;
  reviewed_at: string | null;
};

type DetectionActionRow = {
  detection_id: string;
  created_at: string;
  to_status: string | null;
};

type AssetRow = {
  id: string;
  title: string;
  public_id: number | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  system_role: "user" | "admin" | "super_admin";
  created_at: string;
  last_signed_in_at: string | null;
};

type OrganizationMemberRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  organizations: {
    name: string;
  } | null;
};

export type AdminDashboardMetric = {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  changeDirection: "up" | "down" | "neutral";
  footerTitle: string;
  footerSubtitle: string;
};

export type AdminDashboardChartPoint = {
  date: string;
  detections: number;
  cases: number;
};

export type AdminDashboardCaseRow = {
  id: string;
  casePublicId: number | null;
  detectionId: string;
  organizationName: string;
  assetTitle: string;
  assetPublicId: number | null;
  domain: string | null;
  status: string;
  openedAt: string;
};

export type AdminDashboardDetectionRow = {
  id: string;
  publicId: number | null;
  organizationName: string;
  assetTitle: string;
  assetPublicId: number | null;
  domain: string | null;
  status: string;
  lastSeenAt: string;
};

export type AdminDashboardUserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  organizationName: string | null;
  membershipRole: "owner" | "admin" | "member" | null;
  systemRole: "user" | "admin" | "super_admin";
  createdAt: string;
  lastSignedInAt: string | null;
};

export type AdminDashboardData = {
  metrics: AdminDashboardMetric[];
  chart: AdminDashboardChartPoint[];
  cases: AdminDashboardCaseRow[];
  detections: AdminDashboardDetectionRow[];
  users: AdminDashboardUserRow[];
};

function getWindowStarts(now: Date) {
  const currentWindowStart = new Date(now.getTime() - COMPARISON_WINDOW_DAYS * DAY_IN_MS);
  const previousWindowStart = new Date(
    now.getTime() - COMPARISON_WINDOW_DAYS * 2 * DAY_IN_MS,
  );
  const chartWindowStart = new Date(now.getTime() - (CHART_WINDOW_DAYS - 1) * DAY_IN_MS);

  return {
    chartWindowStart,
    currentWindowStart,
    previousWindowStart,
  };
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function buildChartBuckets(startDate: Date) {
  const buckets = new Map<string, AdminDashboardChartPoint>();

  for (let index = 0; index < CHART_WINDOW_DAYS; index += 1) {
    const currentDate = new Date(startDate.getTime() + index * DAY_IN_MS);
    const key = currentDate.toISOString().slice(0, 10);

    buckets.set(key, {
      date: key,
      detections: 0,
      cases: 0,
    });
  }

  return buckets;
}

function getTrend(current: number, previous: number) {
  if (current === previous) {
    return {
      label: "0%",
      direction: "neutral" as const,
    };
  }

  if (previous === 0) {
    return {
      label: current > 0 ? "Novo" : "0%",
      direction: current > 0 ? ("up" as const) : ("neutral" as const),
    };
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(delta) * 10) / 10;

  return {
    label: `${delta >= 0 ? "+" : "-"}${rounded.toLocaleString("pt-BR")}%`,
    direction: delta > 0 ? ("up" as const) : ("down" as const),
  };
}

function getTrendFooter(direction: "up" | "down" | "neutral") {
  if (direction === "up") {
    return "Acima da janela anterior";
  }

  if (direction === "down") {
    return "Abaixo da janela anterior";
  }

  return "Mesmo ritmo da janela anterior";
}

function createMetric(params: {
  id: string;
  label: string;
  current: number;
  previous: number;
  footerSubtitle: string;
}) {
  const trend = getTrend(params.current, params.previous);

  return {
    id: params.id,
    label: params.label,
    value: params.current.toLocaleString("pt-BR"),
    changeLabel: trend.label,
    changeDirection: trend.direction,
    footerTitle: getTrendFooter(trend.direction),
    footerSubtitle: params.footerSubtitle,
  } satisfies AdminDashboardMetric;
}

function isWithinWindow(
  value: string,
  startInclusive: Date,
  endExclusive: Date,
) {
  const timestamp = new Date(value).getTime();

  return (
    timestamp >= startInclusive.getTime() && timestamp < endExclusive.getTime()
  );
}

function getCaseKey(detection: Pick<DetectionRow, "organization_id" | "case_public_id" | "public_id" | "id">) {
  return `${detection.organization_id}:${detection.case_public_id ?? detection.public_id ?? detection.id}`;
}

async function listDetectionsById(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, DetectionRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detections")
    .select(
      "id, public_id, case_public_id, organization_id, asset_id, status, domain, page_title, created_at, last_seen_at, reviewed_at",
    )
    .in("id", ids)
    .returns<DetectionRow[]>();

  if (error) {
    throw new Error("Nao foi possivel carregar as ocorrencias do dashboard admin.");
  }

  return new Map((data ?? []).map((item) => [item.id, item]));
}

async function listAssetsById(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, AssetRow>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, title, public_id")
    .in("id", ids)
    .returns<AssetRow[]>();

  if (error) {
    throw new Error("Nao foi possivel carregar os assets do dashboard admin.");
  }

  return new Map((data ?? []).map((item) => [item.id, item]));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requirePanelAccess("admin");

  const supabase = await createClient();
  const now = new Date();
  const { chartWindowStart, currentWindowStart, previousWindowStart } =
    getWindowStarts(now);

  const [
    organizationsResponse,
    latestDetectionsResponse,
    detectionStatsResponse,
    caseActionsResponse,
    recentProfilesResponse,
    profileStatsResponse,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, is_active, created_at")
      .returns<OrganizationRow[]>(),
    supabase
      .from("detections")
      .select(
        "id, public_id, case_public_id, organization_id, asset_id, status, domain, page_title, created_at, last_seen_at, reviewed_at",
      )
      .is("archived_at", null)
      .order("last_seen_at", { ascending: false })
      .limit(120)
      .returns<DetectionRow[]>(),
    supabase
      .from("detections")
      .select("id, created_at")
      .is("archived_at", null)
      .gte("created_at", previousWindowStart.toISOString())
      .limit(5000),
    supabase
      .from("detection_actions")
      .select("detection_id, created_at, to_status")
      .eq("to_status", "unauthorized")
      .gte("created_at", previousWindowStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000)
      .returns<DetectionActionRow[]>(),
    supabase
      .from("profiles")
      .select("id, email, full_name, system_role, created_at, last_signed_in_at")
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<ProfileRow[]>(),
    supabase
      .from("profiles")
      .select("id, created_at")
      .gte("created_at", previousWindowStart.toISOString())
      .limit(5000),
  ]);

  if (
    organizationsResponse.error ||
    latestDetectionsResponse.error ||
    detectionStatsResponse.error ||
    caseActionsResponse.error ||
    recentProfilesResponse.error ||
    profileStatsResponse.error
  ) {
    throw new Error("Nao foi possivel carregar o dashboard administrativo.");
  }

  const organizations = organizationsResponse.data ?? [];
  const latestDetections = latestDetectionsResponse.data ?? [];
  const detectionStatsRows =
    (detectionStatsResponse.data as Array<{ id: string; created_at: string }>) ?? [];
  const caseActions = caseActionsResponse.data ?? [];
  const recentProfiles = recentProfilesResponse.data ?? [];
  const profileStatsRows =
    (profileStatsResponse.data as Array<{ id: string; created_at: string }>) ?? [];

  const extraDetectionIds = Array.from(
    new Set(caseActions.map((action) => action.detection_id)),
  ).filter((id) => !latestDetections.some((detection) => detection.id === id));
  const extraDetectionsById = await listDetectionsById(extraDetectionIds);
  const detectionsById = new Map<string, DetectionRow>(
    latestDetections.map((detection) => [detection.id, detection]),
  );

  for (const [id, detection] of extraDetectionsById) {
    detectionsById.set(id, detection);
  }

  const assetIds = Array.from(
    new Set(Array.from(detectionsById.values()).map((item) => item.asset_id)),
  );
  const [assetsById, recentMembershipsResponse] = await Promise.all([
    listAssetsById(assetIds),
    recentProfiles.length > 0
      ? supabase
          .from("organization_members")
          .select("user_id, role, organizations(name)")
          .eq("is_active", true)
          .in(
            "user_id",
            recentProfiles.map((profile) => profile.id),
          )
          .order("created_at", { ascending: true })
          .returns<OrganizationMemberRow[]>()
      : Promise.resolve({
          data: [] as OrganizationMemberRow[],
          error: null,
        }),
  ]);

  if (recentMembershipsResponse.error) {
    throw new Error("Nao foi possivel carregar as organizacoes dos usuarios.");
  }

  const organizationNames = new Map(
    organizations.map((organization) => [organization.id, organization.name]),
  );
  const membershipsByUserId = new Map<string, OrganizationMemberRow>();

  for (const membership of recentMembershipsResponse.data ?? []) {
    if (!membershipsByUserId.has(membership.user_id)) {
      membershipsByUserId.set(membership.user_id, membership);
    }
  }

  const chartBuckets = buildChartBuckets(chartWindowStart);
  for (const row of detectionStatsRows) {
    if (new Date(row.created_at).getTime() < chartWindowStart.getTime()) {
      continue;
    }

    const bucket = chartBuckets.get(toDateKey(row.created_at));
    if (bucket) {
      bucket.detections += 1;
    }
  }

  const currentCaseKeys = new Set<string>();
  const previousCaseKeys = new Set<string>();
  const chartCaseKeysByDay = new Map<string, Set<string>>();

  for (const action of caseActions) {
    const detection = detectionsById.get(action.detection_id);
    if (!detection) {
      continue;
    }

    const caseKey = getCaseKey(detection);
    const actionDate = new Date(action.created_at);
    const actionDayKey = toDateKey(action.created_at);

    if (actionDate.getTime() >= chartWindowStart.getTime()) {
      const dayCases = chartCaseKeysByDay.get(actionDayKey) ?? new Set<string>();
      dayCases.add(caseKey);
      chartCaseKeysByDay.set(actionDayKey, dayCases);
    }

    if (isWithinWindow(action.created_at, currentWindowStart, now)) {
      currentCaseKeys.add(caseKey);
    } else if (isWithinWindow(action.created_at, previousWindowStart, currentWindowStart)) {
      previousCaseKeys.add(caseKey);
    }
  }

  for (const [dayKey, keys] of chartCaseKeysByDay) {
    const bucket = chartBuckets.get(dayKey);
    if (bucket) {
      bucket.cases = keys.size;
    }
  }

  const usersCurrent = profileStatsRows.filter((row) =>
    isWithinWindow(row.created_at, currentWindowStart, now),
  ).length;
  const usersPrevious = profileStatsRows.filter((row) =>
    isWithinWindow(row.created_at, previousWindowStart, currentWindowStart),
  ).length;
  const detectionsCurrent = detectionStatsRows.filter((row) =>
    isWithinWindow(row.created_at, currentWindowStart, now),
  ).length;
  const detectionsPrevious = detectionStatsRows.filter((row) =>
    isWithinWindow(row.created_at, previousWindowStart, currentWindowStart),
  ).length;
  const organizationsCurrent = organizations.filter((organization) =>
    isWithinWindow(organization.created_at, currentWindowStart, now),
  ).length;
  const organizationsPrevious = organizations.filter((organization) =>
    isWithinWindow(organization.created_at, previousWindowStart, currentWindowStart),
  ).length;

  const metrics: AdminDashboardMetric[] = [
    createMetric({
      id: "users",
      label: "Novos usuarios",
      current: usersCurrent,
      previous: usersPrevious,
      footerSubtitle: "Cadastros criados nos ultimos 30 dias.",
    }),
    createMetric({
      id: "detections",
      label: "Novas ocorrencias",
      current: detectionsCurrent,
      previous: detectionsPrevious,
      footerSubtitle: "Encontradas pelo monitoramento no mesmo periodo.",
    }),
    createMetric({
      id: "cases",
      label: "Novos casos",
      current: currentCaseKeys.size,
      previous: previousCaseKeys.size,
      footerSubtitle: "Marcados como nao autorizados e repassados para a DNL.",
    }),
    createMetric({
      id: "organizations",
      label: "Novos clientes",
      current: organizationsCurrent,
      previous: organizationsPrevious,
      footerSubtitle: `${organizations.filter((organization) => organization.is_active).length} workspace(s) ativos hoje.`,
    }),
  ];

  const cases: AdminDashboardCaseRow[] = [];
  const caseRowsSeen = new Set<string>();
  for (const action of caseActions) {
    const detection = detectionsById.get(action.detection_id);
    if (!detection) {
      continue;
    }

    const key = getCaseKey(detection);
    if (caseRowsSeen.has(key)) {
      continue;
    }

    caseRowsSeen.add(key);
    const asset = assetsById.get(detection.asset_id);
    cases.push({
      id: key,
      casePublicId: detection.case_public_id,
      detectionId: detection.id,
      organizationName:
        organizationNames.get(detection.organization_id) ?? "Cliente sem nome",
      assetTitle: asset?.title ?? "Imagem monitorada",
      assetPublicId: asset?.public_id ?? null,
      domain: detection.domain,
      status: detection.status,
      openedAt: action.created_at,
    });

    if (cases.length >= 12) {
      break;
    }
  }

  const detections: AdminDashboardDetectionRow[] = latestDetections
    .slice(0, 12)
    .map((detection) => {
      const asset = assetsById.get(detection.asset_id);

      return {
        id: detection.id,
        publicId: detection.public_id,
        organizationName:
          organizationNames.get(detection.organization_id) ?? "Cliente sem nome",
        assetTitle: asset?.title ?? "Imagem monitorada",
        assetPublicId: asset?.public_id ?? null,
        domain: detection.domain,
        status: detection.status,
        lastSeenAt: detection.last_seen_at,
      };
    });

  const users: AdminDashboardUserRow[] = recentProfiles.map((profile) => {
    const membership = membershipsByUserId.get(profile.id);

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      organizationName: membership?.organizations?.name ?? null,
      membershipRole: membership?.role ?? null,
      systemRole: profile.system_role,
      createdAt: profile.created_at,
      lastSignedInAt: profile.last_signed_in_at,
    };
  });

  return {
    metrics,
    chart: Array.from(chartBuckets.values()),
    cases,
    detections,
    users,
  };
}
