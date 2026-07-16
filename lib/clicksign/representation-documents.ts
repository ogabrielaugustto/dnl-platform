import { createHmac, timingSafeEqual } from "node:crypto";

export type RepresentationDocumentKind = "soa" | "sra";

export type RepresentationDocumentStatus =
  | "signature_requested"
  | "signed"
  | "rejected"
  | "expired"
  | "cancelled"
  | "failed";

export type RepresentationUploadBlockReason = "missing" | "pending";

export type RepresentationDocumentStatusLike = {
  status: RepresentationDocumentStatus | string | null;
};

export type SoaTemplateData = {
  NOME_COMPLETO: string;
  ESTADO_CIVIL: string;
  DOCUMENTO: string;
  ENDERECO: string;
  CNPJ_DNL: string;
  DIA: string;
  MES: string;
};

export type SoaSignatureRequest = {
  fullName: string;
  email: string;
  cpf: string;
  maritalStatus: string;
  address: string;
};

export type ClicksignWebhookStatusInput = {
  eventName: string | null;
  envelopeStatus?: string | null;
  documentStatus?: string | null;
};

export type ClicksignWebhookIdentifiers = {
  envelopeId: string | null;
  documentId: string | null;
};

const MONTHS_PT_BR = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeCpf(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function isValidCpf(value: string) {
  const digits = normalizeCpf(value);

  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(digits[10]);
}

function sanitizeTemplateText(value: string) {
  return collapseWhitespace(value);
}

export function formatSaoPauloDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "numeric",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const monthNumber = Number(parts.find((part) => part.type === "month")?.value ?? "1");

  return {
    day,
    month: MONTHS_PT_BR[Math.max(0, Math.min(11, monthNumber - 1))],
  };
}

export function buildSoaTemplateData(input: {
  fullName: string;
  maritalStatus: string;
  cpf: string;
  address: string;
  dnlCnpj: string;
  signedAt?: Date;
}): SoaTemplateData {
  const signedAt = input.signedAt ?? new Date();
  const dateParts = formatSaoPauloDateParts(signedAt);

  return {
    NOME_COMPLETO: sanitizeTemplateText(input.fullName),
    ESTADO_CIVIL: sanitizeTemplateText(input.maritalStatus),
    DOCUMENTO: formatCpf(input.cpf),
    ENDERECO: sanitizeTemplateText(input.address),
    CNPJ_DNL: sanitizeTemplateText(input.dnlCnpj),
    DIA: dateParts.day,
    MES: dateParts.month,
  };
}

export function validateSoaSignatureRequest(
  input: Record<keyof SoaSignatureRequest, unknown>,
):
  | { ok: true; data: SoaSignatureRequest }
  | { ok: false; message: string; field?: keyof SoaSignatureRequest } {
  const fullName = typeof input.fullName === "string" ? collapseWhitespace(input.fullName) : "";
  if (fullName.length < 3 || fullName.length > 120 || fullName.split(" ").length < 2) {
    return {
      ok: false,
      field: "fullName",
      message: "Informe o nome completo do signatario.",
    };
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return {
      ok: false,
      field: "email",
      message: "Informe um e-mail valido para receber o SOA pela Clicksign.",
    };
  }

  const cpf = normalizeCpf(typeof input.cpf === "string" ? input.cpf : "");
  if (!isValidCpf(cpf)) {
    return {
      ok: false,
      field: "cpf",
      message: "Informe um CPF valido para gerar o SOA.",
    };
  }

  const maritalStatus =
    typeof input.maritalStatus === "string" ? collapseWhitespace(input.maritalStatus) : "";
  if (maritalStatus.length < 3 || maritalStatus.length > 60) {
    return {
      ok: false,
      field: "maritalStatus",
      message: "Informe o estado civil do signatario.",
    };
  }

  const address = typeof input.address === "string" ? collapseWhitespace(input.address) : "";
  if (address.length < 10 || address.length > 500) {
    return {
      ok: false,
      field: "address",
      message: "Informe o endereco completo do signatario.",
    };
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      cpf,
      maritalStatus,
      address,
    },
  };
}

export function getRepresentationUploadBlockReason(
  currentDocument: RepresentationDocumentStatusLike | null,
): RepresentationUploadBlockReason | null {
  if (currentDocument?.status === "signed") {
    return null;
  }

  if (currentDocument) {
    return "pending";
  }

  return "missing";
}

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[-\s]+/g, "_");
}

export function mapClicksignWebhookStatus(
  input: ClicksignWebhookStatusInput,
): RepresentationDocumentStatus | null {
  const candidates = [
    normalizeStatus(input.eventName),
    normalizeStatus(input.documentStatus),
    normalizeStatus(input.envelopeStatus),
  ];

  if (
    candidates.some((value) =>
      [
        "document_closed",
        "document_signed",
        "document_finished",
        "envelope_closed",
        "envelope_finished",
        "closed",
        "signed",
        "finished",
      ].includes(value),
    )
  ) {
    return "signed";
  }

  if (
    candidates.some((value) =>
      ["document_refused", "signer_refused", "refused", "rejected"].includes(value),
    )
  ) {
    return "rejected";
  }

  if (candidates.some((value) => ["expired", "document_expired"].includes(value))) {
    return "expired";
  }

  if (
    candidates.some((value) =>
      ["canceled", "cancelled", "document_canceled", "document_cancelled"].includes(value),
    )
  ) {
    return "cancelled";
  }

  return null;
}

export function verifyClicksignWebhookSignature(
  rawBody: string,
  receivedSignature: string | null | undefined,
  secret: string,
) {
  const cleanedSignature = (receivedSignature ?? "").trim().replace(/^sha256=/i, "");
  if (!cleanedSignature || !secret) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const receivedBuffer = Buffer.from(cleanedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getNestedString(
  payload: unknown,
  path: readonly string[],
): string | null {
  let current: unknown = payload;

  for (const segment of path) {
    const currentRecord = asRecord(current);
    if (!currentRecord) {
      return null;
    }

    current = currentRecord[segment];
  }

  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function firstString(payload: unknown, paths: readonly (readonly string[])[]) {
  for (const path of paths) {
    const value = getNestedString(payload, path);
    if (value) {
      return value;
    }
  }

  return null;
}

export function extractClicksignWebhookIdentifiers(
  payload: unknown,
): ClicksignWebhookIdentifiers {
  return {
    envelopeId: firstString(payload, [
      ["event", "data", "envelope", "id"],
      ["event", "data", "envelope", "key"],
      ["data", "envelope", "id"],
      ["data", "envelope", "key"],
      ["envelope", "id"],
      ["envelope", "key"],
      ["envelope_id"],
      ["envelope_key"],
    ]),
    documentId: firstString(payload, [
      ["event", "data", "document", "id"],
      ["event", "data", "document", "key"],
      ["data", "document", "id"],
      ["data", "document", "key"],
      ["document", "id"],
      ["document", "key"],
      ["document_id"],
      ["document_key"],
    ]),
  };
}

export function extractClicksignWebhookStatusInput(
  payload: unknown,
): ClicksignWebhookStatusInput {
  return {
    eventName: firstString(payload, [
      ["event", "name"],
      ["event_name"],
      ["name"],
    ]),
    envelopeStatus: firstString(payload, [
      ["event", "data", "envelope", "status"],
      ["data", "envelope", "status"],
      ["envelope", "status"],
    ]),
    documentStatus: firstString(payload, [
      ["event", "data", "document", "status"],
      ["data", "document", "status"],
      ["document", "status"],
    ]),
  };
}

export function extractClicksignWebhookOccurredAt(payload: unknown) {
  return firstString(payload, [
    ["event", "occurred_at"],
    ["event", "created_at"],
    ["occurred_at"],
    ["created_at"],
  ]);
}
