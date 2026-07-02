import assert from "node:assert/strict";
import test from "node:test";

const {
  compareDetectionSourceScope,
  filterByDetectionSourceScope,
} = await import(new URL("./detection-source-scope.ts", import.meta.url).href);

test("compareDetectionSourceScope keeps national incidents before international incidents", () => {
  const national = {
    sourceScope: "national",
    latestSeenAt: "2026-07-01T10:00:00.000Z",
  };
  const international = {
    sourceScope: "international",
    latestSeenAt: "2026-07-02T10:00:00.000Z",
  };

  assert.equal(compareDetectionSourceScope(national, international), -1);
  assert.equal(compareDetectionSourceScope(international, national), 1);
});

test("compareDetectionSourceScope keeps newest incidents first inside the same nationality group", () => {
  const olderNational = {
    sourceScope: "national",
    latestSeenAt: "2026-07-01T10:00:00.000Z",
  };
  const newerNational = {
    sourceScope: "national",
    latestSeenAt: "2026-07-02T10:00:00.000Z",
  };

  assert.equal(compareDetectionSourceScope(olderNational, newerNational), 86400000);
});

test("filterByDetectionSourceScope applies national and international filters", () => {
  const incidents = [
    { key: "br", sourceScope: "national" },
    { key: "us", sourceScope: "international" },
    { key: "unknown", sourceScope: "unknown" },
  ];

  assert.deepEqual(filterByDetectionSourceScope(incidents, "national"), [incidents[0]]);
  assert.deepEqual(filterByDetectionSourceScope(incidents, "international"), [incidents[1]]);
  assert.deepEqual(filterByDetectionSourceScope(incidents, null), incidents);
});
