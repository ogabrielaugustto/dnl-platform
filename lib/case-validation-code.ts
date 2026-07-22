import { createHash, randomInt } from "node:crypto";

const CASE_VALIDATION_CODE_LENGTH = 16;
const CASE_VALIDATION_GROUP_SIZE = 4;
const CASE_VALIDATION_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ALPHANUMERIC_PATTERN = /^[A-Z0-9]+$/;

export type GeneratedCaseValidationCode = {
  normalized: string;
  formatted: string;
  hash: string;
  hint: string;
};

export type CaseValidationCodeCandidate = {
  organizationId: string;
  casePublicId: number;
  codeHash: string;
  revokedAt: string | null;
};

export function normalizeCaseValidationCode(value: string) {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

export function formatCaseValidationCode(value: string) {
  const normalized = normalizeCaseValidationCode(value);
  const groups: string[] = [];

  for (let index = 0; index < normalized.length; index += CASE_VALIDATION_GROUP_SIZE) {
    groups.push(normalized.slice(index, index + CASE_VALIDATION_GROUP_SIZE));
  }

  return groups.join("-");
}

export function isValidCaseValidationCode(value: string) {
  const normalized = normalizeCaseValidationCode(value);

  return (
    normalized.length === CASE_VALIDATION_CODE_LENGTH &&
    ALPHANUMERIC_PATTERN.test(normalized)
  );
}

export function hashCaseValidationCode(value: string) {
  const normalized = normalizeCaseValidationCode(value);

  return createHash("sha256").update(normalized).digest("hex");
}

export function buildCaseValidationUrl(params: {
  baseUrl: string;
  casePublicId: number;
  validationCode: string;
}) {
  const url = new URL("/validar-notificacao", params.baseUrl);
  url.searchParams.set("codigo", String(params.casePublicId));
  url.searchParams.set("chave", formatCaseValidationCode(params.validationCode));

  return url.toString();
}

export function generateCaseValidationCode(): GeneratedCaseValidationCode {
  let normalized = "";

  for (let index = 0; index < CASE_VALIDATION_CODE_LENGTH; index += 1) {
    normalized += CASE_VALIDATION_ALPHABET[randomInt(CASE_VALIDATION_ALPHABET.length)];
  }

  const formatted = formatCaseValidationCode(normalized);

  return {
    normalized,
    formatted,
    hash: hashCaseValidationCode(normalized),
    hint: formatted.slice(-CASE_VALIDATION_GROUP_SIZE),
  };
}

export function selectCaseValidationCodeMatch<TCandidate extends CaseValidationCodeCandidate>(
  candidates: TCandidate[],
  params: {
    casePublicId: number;
    codeHash: string;
  },
) {
  return (
    candidates.find(
      (candidate) =>
        candidate.casePublicId === params.casePublicId &&
        candidate.codeHash === params.codeHash &&
        !candidate.revokedAt,
    ) ?? null
  );
}
