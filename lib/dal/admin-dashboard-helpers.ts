type DashboardProfileBase = {
  id: string;
  system_role: "user" | "admin" | "super_admin";
  created_at: string;
};

type DashboardProfileListRow = DashboardProfileBase & {
  email: string | null;
  full_name: string | null;
  last_signed_in_at: string | null;
};

type DashboardMembershipRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  organizations: {
    name: string;
  } | null;
};

export type ClientDashboardUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  organizationName: string | null;
  membershipRole: "owner" | "admin" | "member" | null;
  systemRole: "user" | "admin" | "super_admin";
  createdAt: string;
  lastSignedInAt: string | null;
};

function getActiveMembershipsByUserId(memberships: DashboardMembershipRow[]) {
  const membershipsByUserId = new Map<string, DashboardMembershipRow[]>();

  for (const membership of memberships) {
    if (!membership.is_active || !membership.organizations) {
      continue;
    }

    const current = membershipsByUserId.get(membership.user_id) ?? [];
    current.push(membership);
    membershipsByUserId.set(membership.user_id, current);
  }

  return membershipsByUserId;
}

export function getClientDashboardUserIds(
  profiles: DashboardProfileBase[],
  memberships: DashboardMembershipRow[],
) {
  const membershipsByUserId = getActiveMembershipsByUserId(memberships);

  return new Set(
    profiles
      .filter((profile) => {
        if (profile.system_role !== "user") {
          return false;
        }

        return (membershipsByUserId.get(profile.id)?.length ?? 0) > 0;
      })
      .map((profile) => profile.id),
  );
}

export function buildClientDashboardUsers(
  profiles: DashboardProfileListRow[],
  memberships: DashboardMembershipRow[],
): ClientDashboardUser[] {
  const membershipsByUserId = getActiveMembershipsByUserId(memberships);

  return profiles.flatMap((profile) => {
    if (profile.system_role !== "user") {
      return [];
    }

    const primaryMembership = membershipsByUserId.get(profile.id)?.[0];
    if (!primaryMembership) {
      return [];
    }

    return [
      {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        organizationName: primaryMembership.organizations?.name ?? null,
        membershipRole: primaryMembership.role,
        systemRole: profile.system_role,
        createdAt: profile.created_at,
        lastSignedInAt: profile.last_signed_in_at,
      },
    ];
  });
}
