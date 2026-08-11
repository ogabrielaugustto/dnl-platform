import assert from "node:assert/strict";
import test from "node:test";

const { buildWorkerInternalUrl } = await import(
  new URL("./worker-requests.ts", import.meta.url).href
);

test("buildWorkerInternalUrl normalizes base URL and internal path", () => {
  assert.equal(
    buildWorkerInternalUrl("https://worker.example.com/", "/internal/site-intel/abc/run"),
    "https://worker.example.com/internal/site-intel/abc/run",
  );
});
