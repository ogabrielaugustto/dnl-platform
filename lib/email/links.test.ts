import assert from "node:assert/strict";
import test from "node:test";

test("buildSupabaseAuthConfirmUrl builds a recovery confirm URL from a hashed token", async () => {
  const { buildSupabaseAuthConfirmUrl } = await import(
    new URL("./links.ts", import.meta.url).href
  );
  const url = buildSupabaseAuthConfirmUrl({
    appUrl: "https://app.example.com/",
    hashedToken: "abc 123",
    nextPath: "/auth/reset-password",
    type: "recovery",
  });

  assert.equal(
    url,
    "https://app.example.com/auth/confirm?token_hash=abc%20123&type=recovery&next=%2Fauth%2Freset-password",
  );
});
