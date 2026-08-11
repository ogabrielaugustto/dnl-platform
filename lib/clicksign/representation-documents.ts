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

export type SraTemplateData = {
  DIA: string;
  MES: string;
  RAZAO_SOCIAL_NOTIFICADO: string;
  CNPJ_NOTIFICADO: string;
  ENDERECO: string;
  DOMINIO_NOTIFICADO: string;
  NOME_FOTOGRAFO: string;
  ESTADO_CIVIL_FOTOGRAFO: string;
  DOCUMENTO_FOTOGRAFO: string;
  ENDERECO_FOTOGRAFO: string;
  CNPJ_DNL: string;
  ID_CASO: string;
  IDS_IMAGEM: string;
  VALOR: string;
  VALOR_EXTENSO: string;
  DIA_VENCIMENTO: string;
  MES_VENCIMENTO: string;
  ANO_VENCIMENTO: string;
  RAZAO_NOTIFICADO: string;
  NOME_NOTIFICADO: string;
  CARGO_NOTIFICADO: string;
  NOME_TESTEMUNHA_1: string;
  CPF_TESTEMUNHA_1: string;
  NOME_TESTEMUNHA_2: string;
  CPF_TESTEMUNHA_2: string;
};

export type SraSignatureRequest = {
  notifiedLegalName: string;
  notifiedCnpj: string;
  notifiedAddress: string;
  notifiedDomain: string;
  notifiedSignerName: string;
  notifiedSignerEmail: string;
  notifiedSignerCpf: string;
  notifiedSignerRole: string;
  photographerName: string;
  photographerMaritalStatus: string;
  photographerCpf: string;
  photographerAddress: string;
  dnlCnpj: string;
  dnlSignerName: string;
  dnlSignerEmail: string;
  dnlSignerCpf: string;
  caseId: string;
  imageIds: string[];
  amountCents: number;
  amountInWords: string;
  paymentDueDate: string;
  witness1Name: string;
  witness1Email: string;
  witness1Cpf: string;
  witness2Name: string;
  witness2Email: string;
  witness2Cpf: string;
};

export type SraSigner = {
  kind: "notified" | "dnl" | "witness_1" | "witness_2";
  name: string;
  email: string;
  cpf: string;
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

function normalizeCnpj(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCnpj(value: string) {
  const digits = normalizeCnpj(value);
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5",
  );
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

function isValidCnpj(value: string) {
  const digits = normalizeCnpj(value);
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  function calculateDigit(base: string, weights: number[]) {
    const sum = weights.reduce(
      (total, weight, index) => total + Number(base[index]) * weight,
      0,
    );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstDigit = calculateDigit(digits.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);
  const secondDigit = calculateDigit(
    digits.slice(0, 12) + String(firstDigit),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits.endsWith(String(firstDigit) + String(secondDigit));
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

function formatBrlFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(cents / 100)
    .replace(/\u00a0/g, " ");
}

function parseIsoDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    day: String(day).padStart(2, "0"),
    month: MONTHS_PT_BR[month - 1],
    year: String(year),
  };
}

export function buildSraTemplateData(
  input: Pick<
    SraSignatureRequest,
    | "notifiedLegalName"
    | "notifiedCnpj"
    | "notifiedAddress"
    | "notifiedDomain"
    | "notifiedSignerName"
    | "notifiedSignerRole"
    | "photographerName"
    | "photographerMaritalStatus"
    | "photographerCpf"
    | "photographerAddress"
    | "dnlCnpj"
    | "caseId"
    | "imageIds"
    | "amountCents"
    | "amountInWords"
    | "paymentDueDate"
    | "witness1Name"
    | "witness1Cpf"
    | "witness2Name"
    | "witness2Cpf"
  > & { agreementDate?: Date },
): SraTemplateData {
  const agreementDate = formatSaoPauloDateParts(input.agreementDate ?? new Date());
  const dueDate = parseIsoDateParts(input.paymentDueDate);
  if (!dueDate) {
    throw new Error("Data de vencimento invalida para o SRA.");
  }

  return {
    DIA: agreementDate.day,
    MES: agreementDate.month,
    RAZAO_SOCIAL_NOTIFICADO: sanitizeTemplateText(input.notifiedLegalName),
    CNPJ_NOTIFICADO: formatCnpj(input.notifiedCnpj),
    ENDERECO: sanitizeTemplateText(input.notifiedAddress),
    DOMINIO_NOTIFICADO: sanitizeTemplateText(input.notifiedDomain),
    NOME_FOTOGRAFO: sanitizeTemplateText(input.photographerName),
    ESTADO_CIVIL_FOTOGRAFO: sanitizeTemplateText(input.photographerMaritalStatus),
    DOCUMENTO_FOTOGRAFO: formatCpf(input.photographerCpf),
    ENDERECO_FOTOGRAFO: sanitizeTemplateText(input.photographerAddress),
    CNPJ_DNL: formatCnpj(input.dnlCnpj),
    ID_CASO: sanitizeTemplateText(input.caseId),
    IDS_IMAGEM: input.imageIds.map(sanitizeTemplateText).join(", "),
    VALOR: formatBrlFromCents(input.amountCents),
    VALOR_EXTENSO: sanitizeTemplateText(input.amountInWords),
    DIA_VENCIMENTO: dueDate.day,
    MES_VENCIMENTO: dueDate.month,
    ANO_VENCIMENTO: dueDate.year,
    RAZAO_NOTIFICADO: sanitizeTemplateText(input.notifiedLegalName),
    NOME_NOTIFICADO: sanitizeTemplateText(input.notifiedSignerName),
    CARGO_NOTIFICADO: sanitizeTemplateText(input.notifiedSignerRole),
    NOME_TESTEMUNHA_1: sanitizeTemplateText(input.witness1Name),
    CPF_TESTEMUNHA_1: input.witness1Cpf ? formatCpf(input.witness1Cpf) : "",
    NOME_TESTEMUNHA_2: sanitizeTemplateText(input.witness2Name),
    CPF_TESTEMUNHA_2: input.witness2Cpf ? formatCpf(input.witness2Cpf) : "",
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validateSraSignatureRequest(
  input: Record<keyof SraSignatureRequest, unknown>,
):
  | { ok: true; data: SraSignatureRequest }
  | { ok: false; message: string; field: keyof SraSignatureRequest } {
  const textValue = (field: keyof SraSignatureRequest) =>
    typeof input[field] === "string" ? collapseWhitespace(input[field] as string) : "";
  const emailValue = (field: keyof SraSignatureRequest) => textValue(field).toLowerCase();

  const data: SraSignatureRequest = {
    notifiedLegalName: textValue("notifiedLegalName"),
    notifiedCnpj: normalizeCnpj(textValue("notifiedCnpj")),
    notifiedAddress: textValue("notifiedAddress"),
    notifiedDomain: textValue("notifiedDomain"),
    notifiedSignerName: textValue("notifiedSignerName"),
    notifiedSignerEmail: emailValue("notifiedSignerEmail"),
    notifiedSignerCpf: normalizeCpf(textValue("notifiedSignerCpf")),
    notifiedSignerRole: textValue("notifiedSignerRole"),
    photographerName: textValue("photographerName"),
    photographerMaritalStatus: textValue("photographerMaritalStatus"),
    photographerCpf: normalizeCpf(textValue("photographerCpf")),
    photographerAddress: textValue("photographerAddress"),
    dnlCnpj: normalizeCnpj(textValue("dnlCnpj")),
    dnlSignerName: textValue("dnlSignerName"),
    dnlSignerEmail: emailValue("dnlSignerEmail"),
    dnlSignerCpf: normalizeCpf(textValue("dnlSignerCpf")),
    caseId: textValue("caseId"),
    imageIds: Array.isArray(input.imageIds)
      ? input.imageIds
          .filter((value): value is string => typeof value === "string")
          .map(collapseWhitespace)
          .filter(Boolean)
      : [],
    amountCents:
      typeof input.amountCents === "number" ? Math.round(input.amountCents) : Number.NaN,
    amountInWords: textValue("amountInWords"),
    paymentDueDate: textValue("paymentDueDate"),
    witness1Name: textValue("witness1Name"),
    witness1Email: emailValue("witness1Email"),
    witness1Cpf: normalizeCpf(textValue("witness1Cpf")),
    witness2Name: textValue("witness2Name"),
    witness2Email: emailValue("witness2Email"),
    witness2Cpf: normalizeCpf(textValue("witness2Cpf")),
  };

  const requiredTextFields: Array<{
    field: keyof SraSignatureRequest;
    minimum: number;
    message: string;
  }> = [
    { field: "notifiedLegalName", minimum: 3, message: "Informe a razao social do notificado." },
    { field: "notifiedAddress", minimum: 10, message: "Informe o endereco do notificado." },
    { field: "notifiedDomain", minimum: 3, message: "Informe o dominio notificado." },
    { field: "notifiedSignerName", minimum: 3, message: "Informe o nome do representante do notificado." },
    { field: "notifiedSignerRole", minimum: 2, message: "Informe o cargo do representante do notificado." },
    { field: "photographerName", minimum: 3, message: "Informe o nome do fotografo." },
    { field: "photographerMaritalStatus", minimum: 3, message: "Informe o estado civil do fotografo." },
    { field: "photographerAddress", minimum: 10, message: "Informe o endereco do fotografo." },
    { field: "dnlSignerName", minimum: 3, message: "Informe o representante legal da DNL." },
    { field: "caseId", minimum: 1, message: "Informe o ID do caso." },
    { field: "amountInWords", minimum: 3, message: "Informe o valor do acordo por extenso." },
  ];

  for (const requirement of requiredTextFields) {
    const value = data[requirement.field];
    if (typeof value !== "string" || value.length < requirement.minimum) {
      return { ok: false, field: requirement.field, message: requirement.message };
    }
  }

  if (!isValidCnpj(data.notifiedCnpj)) {
    return { ok: false, field: "notifiedCnpj", message: "Informe um CNPJ valido para o notificado." };
  }
  if (!isValidEmail(data.notifiedSignerEmail)) {
    return { ok: false, field: "notifiedSignerEmail", message: "Informe o e-mail do representante do notificado." };
  }
  if (!isValidCpf(data.notifiedSignerCpf)) {
    return { ok: false, field: "notifiedSignerCpf", message: "Informe um CPF valido para o representante do notificado." };
  }
  if (!isValidCpf(data.photographerCpf)) {
    return { ok: false, field: "photographerCpf", message: "Informe um CPF valido para o fotografo." };
  }
  if (!isValidCnpj(data.dnlCnpj)) {
    return { ok: false, field: "dnlCnpj", message: "Configure um CNPJ valido para a DNL." };
  }
  if (!isValidEmail(data.dnlSignerEmail)) {
    return { ok: false, field: "dnlSignerEmail", message: "Informe o e-mail do representante da DNL." };
  }
  if (!isValidCpf(data.dnlSignerCpf)) {
    return { ok: false, field: "dnlSignerCpf", message: "Informe um CPF valido para o representante da DNL." };
  }
  if (data.imageIds.length === 0) {
    return { ok: false, field: "imageIds", message: "O caso precisa ter ao menos uma imagem." };
  }
  if (!Number.isInteger(data.amountCents) || data.amountCents <= 0) {
    return { ok: false, field: "amountCents", message: "Informe um valor de acordo valido." };
  }
  if (!parseIsoDateParts(data.paymentDueDate)) {
    return { ok: false, field: "paymentDueDate", message: "Informe uma data de vencimento valida." };
  }

  for (const witnessNumber of [1, 2] as const) {
    const nameField = ("witness" + witnessNumber + "Name") as
      | "witness1Name"
      | "witness2Name";
    const emailField = ("witness" + witnessNumber + "Email") as
      | "witness1Email"
      | "witness2Email";
    const cpfField = ("witness" + witnessNumber + "Cpf") as
      | "witness1Cpf"
      | "witness2Cpf";
    const hasAnyValue = Boolean(data[nameField] || data[emailField] || data[cpfField]);

    if (!hasAnyValue) {
      continue;
    }
    if (data[nameField].length < 3) {
      return { ok: false, field: nameField, message: "Informe o nome completo da testemunha." };
    }
    if (!isValidEmail(data[emailField])) {
      return { ok: false, field: emailField, message: "Informe um e-mail valido para a testemunha." };
    }
    if (!isValidCpf(data[cpfField])) {
      return { ok: false, field: cpfField, message: "Informe um CPF valido para a testemunha." };
    }
  }

  return { ok: true, data };
}

export function buildSraSigners(input: SraSignatureRequest): SraSigner[] {
  const signers: SraSigner[] = [
    {
      kind: "notified",
      name: input.notifiedSignerName,
      email: input.notifiedSignerEmail,
      cpf: input.notifiedSignerCpf,
    },
    {
      kind: "dnl",
      name: input.dnlSignerName,
      email: input.dnlSignerEmail,
      cpf: input.dnlSignerCpf,
    },
  ];

  if (input.witness1Name) {
    signers.push({
      kind: "witness_1",
      name: input.witness1Name,
      email: input.witness1Email,
      cpf: input.witness1Cpf,
    });
  }
  if (input.witness2Name) {
    signers.push({
      kind: "witness_2",
      name: input.witness2Name,
      email: input.witness2Email,
      cpf: input.witness2Cpf,
    });
  }

  return signers;
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
