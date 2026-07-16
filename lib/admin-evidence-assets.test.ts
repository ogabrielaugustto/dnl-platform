import assert from "node:assert/strict";
import test from "node:test";

const evidenceAssets = await import(
  new URL("./admin-evidence-assets.ts", import.meta.url).href
);

test("builds admin evidence image URLs outside the client-scoped detections API", () => {
  assert.equal(
    evidenceAssets.buildAdminEvidenceImageUrl("detection-1", "evidence-1"),
    "/api/admin/detections/detection-1/evidences/evidence-1/image",
  );
  assert.equal(
    evidenceAssets.buildAdminEvidenceMatchedImageUrl("detection-1", "evidence-1"),
    "/api/admin/detections/detection-1/evidences/evidence-1/matched-image",
  );
  assert.doesNotMatch(
    evidenceAssets.buildAdminEvidenceImageUrl("detection-1", "evidence-1"),
    /^\/api\/detections\//,
  );
});
