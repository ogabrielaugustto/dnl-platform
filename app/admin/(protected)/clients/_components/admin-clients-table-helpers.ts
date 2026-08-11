import type {
  AdminClientAccessListItem,
  AdminClientListItem,
} from "@/lib/dal/admin-clients";

export type AdminClientTableFilters = {
  organizationFilter: string;
  roleFilter: string;
  search: string;
  statusFilter: string;
};

export type AdminClientTableRow = {
  activeClientUsers: number;
  email: string | null;
  fullName: string | null;
  lastSignedInAt: string | null;
  organizationBillingEmail: string | null;
  organizationCreatedAt: string;
  organizationId: string;
  organizationIsActive: boolean;
  organizationName: string;
  planName: string | null;
  role: AdminClientAccessListItem["role"] | null;
  scanFrequency: AdminClientListItem["scanFrequency"];
  subscriptionStatus: string | null;
  totalClientUsers: number;
  userCreatedAt: string | null;
  userId: string | null;
  userIsActive: boolean | null;
};

function toTableRow(
  organization: AdminClientListItem,
  user: AdminClientAccessListItem | null,
): AdminClientTableRow {
  return {
    activeClientUsers: organization.activeClientUsers,
    email: user?.email ?? null,
    fullName: user?.fullName ?? null,
    lastSignedInAt: user?.lastSignedInAt ?? null,
    organizationBillingEmail: organization.billingEmail,
    organizationCreatedAt: organization.createdAt,
    organizationId: organization.id,
    organizationIsActive: organization.isActive,
    organizationName: organization.name,
    planName: organization.planName,
    role: user?.role ?? null,
    scanFrequency: organization.scanFrequency,
    subscriptionStatus: organization.subscriptionStatus,
    totalClientUsers: organization.totalClientUsers,
    userCreatedAt: user?.createdAt ?? null,
    userId: user?.userId ?? null,
    userIsActive: user?.isActive ?? null,
  };
}

export function buildAdminClientTableRows(
  rows: readonly AdminClientListItem[],
): AdminClientTableRow[] {
  return rows.flatMap((organization) => {
    if (organization.clientUsers.length === 0) {
      return [toTableRow(organization, null)];
    }

    return organization.clientUsers.map((user) => toTableRow(organization, user));
  });
}

export function filterAdminClientTableRows(
  rows: readonly AdminClientTableRow[],
  filters: AdminClientTableFilters,
): AdminClientTableRow[] {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (
      filters.organizationFilter !== "all" &&
      row.organizationId !== filters.organizationFilter
    ) {
      return false;
    }

    if (filters.statusFilter !== "all") {
      const expectedActive = filters.statusFilter === "active";

      if (row.userIsActive !== expectedActive) {
        return false;
      }
    }

    if (filters.roleFilter !== "all" && row.role !== filters.roleFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      row.fullName,
      row.email,
      row.organizationName,
      row.organizationBillingEmail,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}
