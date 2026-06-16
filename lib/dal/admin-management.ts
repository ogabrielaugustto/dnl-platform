import "server-only";

import { requirePanelAccess, type OrganizationMemberRole, type SystemRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  system_role: SystemRole;
  is_active: boolean;
  last_signed_in_at: string | null;
  created_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
  document: string | null;
  billing_email: string | null;
  is_active: boolean;
  created_at: string;
};

type MembershipRow = {
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  is_active: boolean;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  entity: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type DetectionActionRow = {
  id: string;
  organization_id: string;
  detection_id: string;
  user_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type DetectionRow = {
  id: string;
  public_id: number | null;
  case_public_id: number | null;
  domain: string | null;
};

export type AdminUserListItem = {
  id: string;
  email: string | null;
  fullName: string | null;
  isActive: boolean;
  systemRole: SystemRole;
  createdAt: string;
  lastSignedInAt: string | null;
  accessType: "internal" | "client" | "hybrid" | "unassigned";
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    role: OrganizationMemberRole;
    isActive: boolean;
  }>;
};

export type AdminOrganizationListItem = {
  id: string;
  name: string;
  document: string | null;
  billingEmail: string | null;
  isActive: boolean;
  createdAt: string;
  totalMembers: number;
  activeMembers: number;
  internalAdmins: number;
};

export type AdminActivityListItem = {
  id: string;
  source: "audit" | "case";
  occurredAt: string;
  actor: {
    id: string | null;
    name: string | null;
    email: string | null;
    systemRole: SystemRole | null;
  };
  organization: {
    id: string | null;
    name: string | null;
  };
  entity: string;
  entityId: string | null;
  action: string;
  summary: string | null;
  detail: string | null;
  metadata: Record<string, unknown>;
};

export type AdminActivityPageData = {
  internalUsers: Array<{
    id: string;
    label: string;
  }>;
  rows: AdminActivityListItem[];
};

function getUserAccessType(params: {
  systemRole: SystemRole;
  memberships: AdminUserListItem["memberships"];
}) {
  const hasInternalAccess =
    params.systemRole === "admin" || params.systemRole === "super_admin";
  const hasClientAccess = params.memberships.some((membership) => membership.isActive);

  if (hasInternalAccess && hasClientAccess) {
    return "hybrid";
  }

  if (hasInternalAccess) {
    return "internal";
  }

  if (hasClientAccess) {
    return "client";
  }

  return "unassigned";
}

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  await requirePanelAccess("admin");
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, system_role, is_active, last_signed_in_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<ProfileRow[]>();

  if (profilesError) {
    throw new Error("Nao foi possivel carregar os usuarios administrativos.");
  }

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  const [membershipsResponse, organizationsResponse] = await Promise.all([
    profileIds.length > 0
      ? admin
          .from("organization_members")
          .select("organization_id, user_id, role, is_active, created_at")
          .in("user_id", profileIds)
          .order("created_at", { ascending: true })
          .returns<MembershipRow[]>()
      : Promise.resolve({ data: [] as MembershipRow[], error: null }),
    admin
      .from("organizations")
      .select("id, name, document, billing_email, is_active, created_at")
      .returns<OrganizationRow[]>(),
  ]);

  if (membershipsResponse.error || organizationsResponse.error) {
    throw new Error("Nao foi possivel carregar os vinculos dos usuarios.");
  }

  const organizationsById = new Map(
    (organizationsResponse.data ?? []).map((organization) => [organization.id, organization]),
  );
  const membershipsByUserId = new Map<string, AdminUserListItem["memberships"]>();

  for (const membership of membershipsResponse.data ?? []) {
    const organization = organizationsById.get(membership.organization_id);

    if (!organization) {
      continue;
    }

    const current = membershipsByUserId.get(membership.user_id) ?? [];
    current.push({
      organizationId: membership.organization_id,
      organizationName: organization.name,
      role: membership.role,
      isActive: membership.is_active,
    });
    membershipsByUserId.set(membership.user_id, current);
  }

  return (profiles ?? []).map((profile) => {
    const memberships = membershipsByUserId.get(profile.id) ?? [];

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      isActive: profile.is_active,
      systemRole: profile.system_role,
      createdAt: profile.created_at,
      lastSignedInAt: profile.last_signed_in_at,
      accessType: getUserAccessType({
        systemRole: profile.system_role,
        memberships,
      }),
      memberships,
    };
  });
}

export async function listAdminOrganizations(): Promise<AdminOrganizationListItem[]> {
  await requirePanelAccess("admin");
  const admin = createAdminClient();

  const [organizationsResponse, membershipsResponse, profilesResponse] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, document, billing_email, is_active, created_at")
      .order("created_at", { ascending: false })
      .returns<OrganizationRow[]>(),
    admin
      .from("organization_members")
      .select("organization_id, user_id, role, is_active, created_at")
      .returns<MembershipRow[]>(),
    admin
      .from("profiles")
      .select("id, system_role")
      .returns<Array<Pick<ProfileRow, "id" | "system_role">>>(),
  ]);

  if (
    organizationsResponse.error ||
    membershipsResponse.error ||
    profilesResponse.error
  ) {
    throw new Error("Nao foi possivel carregar as organizacoes administrativas.");
  }

  const profileRoles = new Map(
    (profilesResponse.data ?? []).map((profile) => [profile.id, profile.system_role]),
  );
  const membershipsByOrganizationId = new Map<string, MembershipRow[]>();

  for (const membership of membershipsResponse.data ?? []) {
    const current = membershipsByOrganizationId.get(membership.organization_id) ?? [];
    current.push(membership);
    membershipsByOrganizationId.set(membership.organization_id, current);
  }

  return (organizationsResponse.data ?? []).map((organization) => {
    const memberships = membershipsByOrganizationId.get(organization.id) ?? [];

    return {
      id: organization.id,
      name: organization.name,
      document: organization.document,
      billingEmail: organization.billing_email,
      isActive: organization.is_active,
      createdAt: organization.created_at,
      totalMembers: memberships.length,
      activeMembers: memberships.filter((membership) => membership.is_active).length,
      internalAdmins: memberships.filter((membership) => {
        const role = profileRoles.get(membership.user_id);
        return membership.is_active && (role === "admin" || role === "super_admin");
      }).length,
    };
  });
}

export async function listInternalActivities(): Promise<AdminActivityPageData> {
  await requirePanelAccess("admin");
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, full_name, system_role, is_active")
    .in("system_role", ["admin", "super_admin"])
    .order("full_name", { ascending: true })
    .returns<
      Array<
        Pick<
          ProfileRow,
          "id" | "email" | "full_name" | "system_role" | "is_active"
        >
      >
    >();

  if (profilesError) {
    throw new Error("Nao foi possivel carregar os usuarios internos.");
  }

  const internalProfiles = profiles ?? [];
  const internalUserIds = internalProfiles.map((profile) => profile.id);

  if (internalUserIds.length === 0) {
    return {
      internalUsers: [],
      rows: [],
    };
  }

  const [auditResponse, detectionActionsResponse, organizationsResponse] =
    await Promise.all([
      admin
        .from("audit_logs")
        .select("id, organization_id, user_id, entity, entity_id, action, metadata, created_at")
        .in("user_id", internalUserIds)
        .order("created_at", { ascending: false })
        .limit(300)
        .returns<AuditLogRow[]>(),
      admin
        .from("detection_actions")
        .select(
          "id, organization_id, detection_id, user_id, action, from_status, to_status, notes, metadata, created_at",
        )
        .in("user_id", internalUserIds)
        .order("created_at", { ascending: false })
        .limit(300)
        .returns<DetectionActionRow[]>(),
      admin
        .from("organizations")
        .select("id, name, document, billing_email, is_active, created_at")
        .returns<OrganizationRow[]>(),
    ]);

  if (
    auditResponse.error ||
    detectionActionsResponse.error ||
    organizationsResponse.error
  ) {
    throw new Error("Nao foi possivel carregar as atividades internas.");
  }

  const detectionIds = Array.from(
    new Set((detectionActionsResponse.data ?? []).map((action) => action.detection_id)),
  );
  const { data: detections, error: detectionsError } = detectionIds.length
    ? await admin
        .from("detections")
        .select("id, public_id, case_public_id, domain")
        .in("id", detectionIds)
        .returns<DetectionRow[]>()
    : { data: [] as DetectionRow[], error: null };

  if (detectionsError) {
    throw new Error("Nao foi possivel carregar o contexto das atividades.");
  }

  const profilesById = new Map(
    internalProfiles.map((profile) => [profile.id, profile]),
  );
  const organizationsById = new Map(
    (organizationsResponse.data ?? []).map((organization) => [organization.id, organization]),
  );
  const detectionsById = new Map(
    (detections ?? []).map((detection) => [detection.id, detection]),
  );

  const auditRows: AdminActivityListItem[] = (auditResponse.data ?? []).map((row) => {
    const actor = row.user_id ? profilesById.get(row.user_id) : null;
    const organization = row.organization_id
      ? organizationsById.get(row.organization_id)
      : null;

    return {
      id: `audit:${row.id}`,
      source: "audit",
      occurredAt: row.created_at,
      actor: {
        id: actor?.id ?? row.user_id,
        name: actor?.full_name ?? null,
        email: actor?.email ?? null,
        systemRole: actor?.system_role ?? null,
      },
      organization: {
        id: organization?.id ?? row.organization_id,
        name: organization?.name ?? null,
      },
      entity: row.entity,
      entityId: row.entity_id,
      action: row.action,
      summary:
        typeof row.metadata.summary === "string" ? row.metadata.summary : null,
      detail:
        typeof row.metadata.detail === "string" ? row.metadata.detail : null,
      metadata: row.metadata,
    };
  });

  const caseRows: AdminActivityListItem[] = (detectionActionsResponse.data ?? []).map(
    (row) => {
      const actor = row.user_id ? profilesById.get(row.user_id) : null;
      const organization = organizationsById.get(row.organization_id);
      const detection = detectionsById.get(row.detection_id);

      return {
        id: `case:${row.id}`,
        source: "case",
        occurredAt: row.created_at,
        actor: {
          id: actor?.id ?? row.user_id,
          name: actor?.full_name ?? null,
          email: actor?.email ?? null,
          systemRole: actor?.system_role ?? null,
        },
        organization: {
          id: organization?.id ?? row.organization_id,
          name: organization?.name ?? null,
        },
        entity: "case",
        entityId: row.detection_id,
        action: row.action,
        summary:
          detection?.case_public_id || detection?.public_id
            ? `Caso ${String(detection.case_public_id ?? detection.public_id).padStart(6, "0")}`
            : null,
        detail: detection?.domain ?? row.notes,
        metadata: {
          ...row.metadata,
          detectionId: row.detection_id,
          detectionPublicId: detection?.public_id ?? null,
          casePublicId: detection?.case_public_id ?? null,
          fromStatus: row.from_status,
          toStatus: row.to_status,
          notes: row.notes,
        },
      };
    },
  );

  const rows = [...auditRows, ...caseRows].sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );

  return {
    internalUsers: internalProfiles.map((profile) => ({
      id: profile.id,
      label: profile.full_name ?? profile.email ?? "Usuario interno",
    })),
    rows,
  };
}
