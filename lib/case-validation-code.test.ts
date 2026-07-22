import assert from "node:assert/strict";
import test from "node:test";

const codeModule = await import(new URL("./case-validation-code.ts", import.meta.url).href);

test("normalizes case validation codes by removing separators and uppercasing", () => {
  assert.equal(
    codeModule.normalizeCaseValidationCode(" abcd-1234 efgh-5678 "),
    "ABCD1234EFGH5678",
  );
});

test("formats normalized case validation codes into four-character groups", () => {
  assert.equal(
    codeModule.formatCaseValidationCode("ABCD1234EFGH5678"),
    "ABCD-1234-EFGH-5678",
  );
});

test("rejects invalid case validation code inputs", () => {
  assert.equal(codeModule.isValidCaseValidationCode("ABCD-1234-EFGH-5678"), true);
  assert.equal(codeModule.isValidCaseValidationCode("ABCD-1234-EFGH"), false);
  assert.equal(codeModule.isValidCaseValidationCode("ABCD-1234-EFGH-567!"), false);
});

test("hashes normalized case validation codes without preserving the raw code", () => {
  const hash = codeModule.hashCaseValidationCode("abcd-1234-efgh-5678");

  assert.equal(hash, "be105af532593b07b857dbbb0012fc12a939efb515656aa111fc0120993c0609");
  assert.doesNotMatch(hash, /ABCD1234EFGH5678/i);
});

test("builds validation URLs with formatted codes", () => {
  assert.equal(
    codeModule.buildCaseValidationUrl({
      baseUrl: "https://app.example.com/",
      casePublicId: 123,
      validationCode: "abcd1234efgh5678",
    }),
    "https://app.example.com/validar-notificacao?codigo=123&chave=ABCD-1234-EFGH-5678",
  );
});

test("generates displayable validation codes with a safe hint", () => {
  const generated = codeModule.generateCaseValidationCode();

  assert.match(generated.normalized, /^[A-Z0-9]{16}$/);
  assert.match(generated.formatted, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(generated.hash.length, 64);
  assert.equal(generated.hint, generated.formatted.slice(-4));
});

test("selects the validation code row that matches the supplied hash", () => {
  const selected = codeModule.selectCaseValidationCodeMatch(
    [
      {
        organizationId: "org-a",
        casePublicId: 123,
        codeHash: codeModule.hashCaseValidationCode("AAAA-1111-BBBB-2222"),
        revokedAt: null,
      },
      {
        organizationId: "org-b",
        casePublicId: 123,
        codeHash: codeModule.hashCaseValidationCode("CCCC-3333-DDDD-4444"),
        revokedAt: null,
      },
    ],
    {
      casePublicId: 123,
      codeHash: codeModule.hashCaseValidationCode("CCCC-3333-DDDD-4444"),
    },
  );

  assert.equal(selected?.organizationId, "org-b");
});

test("does not reveal whether a case exists when the validation code is wrong or revoked", () => {
  const rows = [
    {
      organizationId: "org-a",
      casePublicId: 123,
      codeHash: codeModule.hashCaseValidationCode("AAAA-1111-BBBB-2222"),
      revokedAt: null,
    },
    {
      organizationId: "org-b",
      casePublicId: 124,
      codeHash: codeModule.hashCaseValidationCode("CCCC-3333-DDDD-4444"),
      revokedAt: "2026-07-22T12:00:00.000Z",
    },
  ];

  assert.equal(
    codeModule.selectCaseValidationCodeMatch(rows, {
      casePublicId: 123,
      codeHash: codeModule.hashCaseValidationCode("WRNG-1111-BBBB-2222"),
    }),
    null,
  );
  assert.equal(
    codeModule.selectCaseValidationCodeMatch(rows, {
      casePublicId: 124,
      codeHash: codeModule.hashCaseValidationCode("CCCC-3333-DDDD-4444"),
    }),
    null,
  );
});
