import assert from "node:assert/strict";
import test from "node:test";
import type { AdminClientListItem } from "@/lib/dal/admin-clients";

const {
  buildAdminClientTableRows,
  filterAdminClientTableRows,
}: typeof import("./admin-clients-table-helpers") = await import(
  new URL("./admin-clients-table-helpers.ts", import.meta.url).href
);

const clientRows: AdminClientListItem[] = [
  {
    id: "org-1",
    name: "Acme Fotos",
    billingEmail: "financeiro@acme.test",
    isActive: true,
    createdAt: "2026-06-01T10:00:00.000Z",
    subscriptionStatus: "active",
    planName: "Growth",
    scanFrequency: "daily",
    totalClientUsers: 2,
    activeClientUsers: 1,
    clientUsers: [
      {
        userId: "user-1",
        email: "ana@acme.test",
        fullName: "Ana Cliente",
        isActive: true,
        role: "owner",
        createdAt: "2026-06-02T10:00:00.000Z",
        lastSignedInAt: "2026-06-03T10:00:00.000Z",
      },
      {
        userId: "user-2",
        email: "bruno@acme.test",
        fullName: "Bruno Cliente",
        isActive: false,
        role: "member",
        createdAt: "2026-06-04T10:00:00.000Z",
        lastSignedInAt: null,
      },
    ],
  },
  {
    id: "org-2",
    name: "Sem Acesso Ltda",
    billingEmail: null,
    isActive: false,
    createdAt: "2026-06-05T10:00:00.000Z",
    subscriptionStatus: null,
    planName: null,
    scanFrequency: "weekly",
    totalClientUsers: 0,
    activeClientUsers: 0,
    clientUsers: [],
  },
];

test("buildAdminClientTableRows returns one flat table row per client access", () => {
  const rows = buildAdminClientTableRows(clientRows);

  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => [row.organizationId, row.userId]),
    [
      ["org-1", "user-1"],
      ["org-1", "user-2"],
      ["org-2", null],
    ],
  );
});

test("filterAdminClientTableRows searches organization data without grouping rows", () => {
  const rows = buildAdminClientTableRows(clientRows);

  const filteredRows = filterAdminClientTableRows(rows, {
    organizationFilter: "all",
    roleFilter: "all",
    search: "acme",
    statusFilter: "all",
  });

  assert.deepEqual(
    filteredRows.map((row) => row.userId),
    ["user-1", "user-2"],
  );
});

test("filterAdminClientTableRows applies access filters only to client access rows", () => {
  const rows = buildAdminClientTableRows(clientRows);

  const inactiveRows = filterAdminClientTableRows(rows, {
    organizationFilter: "all",
    roleFilter: "all",
    search: "",
    statusFilter: "inactive",
  });

  assert.deepEqual(
    inactiveRows.map((row) => row.userId),
    ["user-2"],
  );
});
