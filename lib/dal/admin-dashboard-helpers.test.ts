import assert from "node:assert/strict";
import test from "node:test";

const {
  buildClientDashboardUsers,
  getClientDashboardUserIds,
} = await import(new URL("./admin-dashboard-helpers.ts", import.meta.url).href);

test("getClientDashboardUserIds keeps only client users with active organization access", () => {
  const clientUserIds = getClientDashboardUserIds(
    [
      {
        id: "client-active",
        system_role: "user",
        created_at: "2026-06-20T10:00:00.000Z",
      },
      {
        id: "client-inactive-membership",
        system_role: "user",
        created_at: "2026-06-21T10:00:00.000Z",
      },
      {
        id: "internal-admin",
        system_role: "admin",
        created_at: "2026-06-22T10:00:00.000Z",
      },
      {
        id: "hybrid-admin",
        system_role: "super_admin",
        created_at: "2026-06-23T10:00:00.000Z",
      },
      {
        id: "unassigned-user",
        system_role: "user",
        created_at: "2026-06-24T10:00:00.000Z",
      },
    ],
    [
      {
        user_id: "client-active",
        role: "owner",
        is_active: true,
        organizations: { name: "Cliente Ativo" },
      },
      {
        user_id: "client-inactive-membership",
        role: "member",
        is_active: false,
        organizations: { name: "Cliente Inativo" },
      },
      {
        user_id: "hybrid-admin",
        role: "admin",
        is_active: true,
        organizations: { name: "Cliente Hibrido" },
      },
    ],
  );

  assert.deepEqual([...clientUserIds], ["client-active"]);
});

test("buildClientDashboardUsers maps the recent dashboard list to client-only rows", () => {
  const users = buildClientDashboardUsers(
    [
      {
        id: "client-active",
        email: "cliente@acme.test",
        full_name: "Cliente Ativo",
        system_role: "user",
        created_at: "2026-06-20T10:00:00.000Z",
        last_signed_in_at: "2026-06-28T12:00:00.000Z",
      },
      {
        id: "internal-admin",
        email: "interno@dnl.test",
        full_name: "Equipe DNL",
        system_role: "admin",
        created_at: "2026-06-21T10:00:00.000Z",
        last_signed_in_at: "2026-06-28T13:00:00.000Z",
      },
    ],
    [
      {
        user_id: "client-active",
        role: "owner",
        is_active: true,
        organizations: { name: "Acme LTDA" },
      },
      {
        user_id: "internal-admin",
        role: "admin",
        is_active: true,
        organizations: { name: "Acme LTDA" },
      },
    ],
  );

  assert.equal(users.length, 1);
  assert.deepEqual(users[0], {
    id: "client-active",
    fullName: "Cliente Ativo",
    email: "cliente@acme.test",
    organizationName: "Acme LTDA",
    membershipRole: "owner",
    systemRole: "user",
    createdAt: "2026-06-20T10:00:00.000Z",
    lastSignedInAt: "2026-06-28T12:00:00.000Z",
  });
});
