import assert from "node:assert/strict";
import test from "node:test";

const {
  EXCLUSIVE_ASSET_LICENSE_TYPE,
  parseAssetBatchMetadata,
}: typeof import("../lib/assets/upload-policy") = await import(
  new URL("../lib/assets/upload-policy.ts", import.meta.url).href
);

test("asset batch metadata defaults to exclusive license without a form field", () => {
  const formData = new FormData();
  formData.set("existingFolderId", "4f21fe98-0a25-4f48-8f51-2147efc6f80f");

  const result = parseAssetBatchMetadata(formData);

  assert.equal(result.success, true);
  if (!result.success) {
    throw new Error("Expected successful metadata parsing");
  }

  assert.equal(result.data.licenseType, EXCLUSIVE_ASSET_LICENSE_TYPE);
  assert.equal(result.data.existingFolderId, "4f21fe98-0a25-4f48-8f51-2147efc6f80f");
});

test("asset batch metadata ignores submitted license type values", () => {
  const formData = new FormData();
  formData.set("licenseType", "licensed_stock");

  const result = parseAssetBatchMetadata(formData);

  assert.equal(result.success, true);
  if (!result.success) {
    throw new Error("Expected successful metadata parsing");
  }

  assert.equal(result.data.licenseType, "exclusive");
});
