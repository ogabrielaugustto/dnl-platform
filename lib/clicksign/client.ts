import "server-only";

import { z } from "zod";
import type {
  SoaTemplateData,
  SraSigner,
  SraTemplateData,
} from "@/lib/clicksign/representation-documents";

export type ClicksignEnvironment = "sandbox" | "production";

export type ClicksignSoaEnvelopeInput = {
  templateKey: string;
  fileName: string;
  signerName: string;
  signerEmail: string;
  signerCpf: string;
  templateData: SoaTemplateData;
  metadata: Record<string, unknown>;
};

export type ClicksignSoaEnvelopeResult = {
  environment: ClicksignEnvironment;
  envelopeId: string;
  documentId: string;
  signerId: string;
  qualificationRequirementId: string;
  authenticationRequirementId: string;
  notificationId: string | null;
  raw: {
    envelope: unknown;
    document: unknown;
    signer: unknown;
    qualificationRequirement: unknown;
    authenticationRequirement: unknown;
    activation: unknown;
    notification: unknown;
  };
};

export type ClicksignSraEnvelopeInput = {
  templateKey: string;
  fileName: string;
  caseId: string;
  templateData: SraTemplateData;
  signers: SraSigner[];
  metadata: Record<string, unknown>;
};

export type ClicksignSraSignerResult = {
  kind: SraSigner["kind"];
  signerId: string;
  qualificationRequirementId: string;
  authenticationRequirementId: string;
  notificationId: string | null;
};

export type ClicksignSraEnvelopeResult = {
  environment: ClicksignEnvironment;
  envelopeId: string;
  documentId: string;
  signers: ClicksignSraSignerResult[];
  raw: {
    envelope: unknown;
    document: unknown;
    signers: unknown[];
    qualificationRequirements: unknown[];
    authenticationRequirements: unknown[];
    activation: unknown;
    notifications: unknown[];
  };
};

type ClicksignSignerInput = {
  name: string;
  email: string;
  cpf: string;
};

type ClicksignEnvelopeInput = {
  templateKey: string;
  fileName: string;
  envelopeName: string;
  subject: string;
  message: string;
  notification: {
    principal: string;
    button: string;
    final: string;
  };
  templateData: Record<string, string>;
  metadata: Record<string, unknown>;
};

type JsonApiResponse = {
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
  errors?: Array<{
    title?: string;
    detail?: string;
    code?: string;
    status?: string | number;
  }>;
};

const clicksignEnvSchema = z.object({
  CLICKSIGN_ACCESS_TOKEN: z.string().trim().min(1),
  CLICKSIGN_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
});

const jsonApiHeaders = {
  accept: "application/json",
  "content-type": "application/vnd.api+json",
};

export function getClicksignBaseUrl(environment: ClicksignEnvironment) {
  return environment === "production"
    ? "https://app.clicksign.com/api/v3"
    : "https://sandbox.clicksign.com/api/v3";
}

function getClicksignSettings() {
  const parsed = clicksignEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error("Configure CLICKSIGN_ACCESS_TOKEN antes de gerar documentos na Clicksign.");
  }

  return {
    accessToken: parsed.data.CLICKSIGN_ACCESS_TOKEN,
    environment: parsed.data.CLICKSIGN_ENVIRONMENT,
    baseUrl: getClicksignBaseUrl(parsed.data.CLICKSIGN_ENVIRONMENT),
  };
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildEnvelopeDeadline() {
  return addDays(new Date(), 30).toISOString();
}

function getJsonApiId(response: JsonApiResponse, resourceName: string) {
  const id = response.data?.id;
  if (!id) {
    throw new Error(`A Clicksign nao retornou o ID de ${resourceName}.`);
  }

  return id;
}

function summarizeClicksignError(payload: unknown) {
  const response = payload as JsonApiResponse;
  const firstError = response.errors?.[0];

  return (
    firstError?.detail ??
    firstError?.title ??
    firstError?.code ??
    "A Clicksign recusou a solicitacao."
  );
}

async function parseJsonResponse(response: Response): Promise<JsonApiResponse> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as JsonApiResponse;
  } catch {
    return {};
  }
}

async function clicksignFetch(
  path: string,
  init: RequestInit & { accessToken: string; baseUrl: string },
) {
  const { accessToken, baseUrl, ...requestInit } = init;
  const response = await fetch(`${baseUrl}${path}`, {
    ...requestInit,
    headers: {
      ...jsonApiHeaders,
      Authorization: accessToken,
    },
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(`Erro Clicksign (${response.status}): ${summarizeClicksignError(payload)}`);
  }

  return payload;
}

function buildRelationship(type: "documents" | "signers", id: string) {
  return {
    data: {
      type,
      id,
    },
  };
}

async function createEnvelope(input: ClicksignEnvelopeInput) {
  const settings = getClicksignSettings();
  const payload = await clicksignFetch("/envelopes", {
    accessToken: settings.accessToken,
    baseUrl: settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "envelopes",
        attributes: {
          name: input.envelopeName,
          locale: "pt-BR",
          auto_close: true,
          remind_interval: "3",
          block_after_refusal: false,
          deadline_at: buildEnvelopeDeadline(),
          default_subject: input.subject,
          default_message: input.message,
        },
      },
    }),
  });

  return {
    environment: settings.environment,
    settings,
    payload,
    id: getJsonApiId(payload, "envelope"),
  };
}

async function createDocument(params: {
  envelopeId: string;
  settings: ReturnType<typeof getClicksignSettings>;
  input: ClicksignEnvelopeInput;
}) {
  const payload = await clicksignFetch(`/envelopes/${params.envelopeId}/documents`, {
    accessToken: params.settings.accessToken,
    baseUrl: params.settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "documents",
        attributes: {
          filename: params.input.fileName,
          template: {
            key: params.input.templateKey,
            data: params.input.templateData,
          },
          metadata: params.input.metadata,
        },
      },
    }),
  });

  return {
    payload,
    id: getJsonApiId(payload, "documento"),
  };
}

async function createSigner(params: {
  envelopeId: string;
  settings: ReturnType<typeof getClicksignSettings>;
  signer: ClicksignSignerInput;
}) {
  const payload = await clicksignFetch(`/envelopes/${params.envelopeId}/signers`, {
    accessToken: params.settings.accessToken,
    baseUrl: params.settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "signers",
        attributes: {
          name: params.signer.name,
          email: params.signer.email,
          has_documentation: true,
          documentation: params.signer.cpf,
          refusable: false,
          group: 1,
          communicate_events: {
            signature_request: "email",
            signature_reminder: "email",
            document_signed: "email",
          },
        },
      },
    }),
  });

  return {
    payload,
    id: getJsonApiId(payload, "signatario"),
  };
}

async function createQualificationRequirement(params: {
  envelopeId: string;
  documentId: string;
  signerId: string;
  settings: ReturnType<typeof getClicksignSettings>;
  role: "sign" | "party" | "legal_representative" | "witness";
}) {
  const payload = await clicksignFetch(`/envelopes/${params.envelopeId}/requirements`, {
    accessToken: params.settings.accessToken,
    baseUrl: params.settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "requirements",
        attributes: {
          action: "agree",
          role: params.role,
        },
        relationships: {
          document: buildRelationship("documents", params.documentId),
          signer: buildRelationship("signers", params.signerId),
        },
      },
    }),
  });

  return {
    payload,
    id: getJsonApiId(payload, "requisito de qualificacao"),
  };
}

async function createAuthenticationRequirement(params: {
  envelopeId: string;
  documentId: string;
  signerId: string;
  settings: ReturnType<typeof getClicksignSettings>;
}) {
  const payload = await clicksignFetch(`/envelopes/${params.envelopeId}/requirements`, {
    accessToken: params.settings.accessToken,
    baseUrl: params.settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "requirements",
        attributes: {
          action: "provide_evidence",
          auth: "email",
        },
        relationships: {
          document: buildRelationship("documents", params.documentId),
          signer: buildRelationship("signers", params.signerId),
        },
      },
    }),
  });

  return {
    payload,
    id: getJsonApiId(payload, "requisito de autenticacao"),
  };
}

async function activateEnvelope(params: {
  envelopeId: string;
  settings: ReturnType<typeof getClicksignSettings>;
}) {
  return clicksignFetch(`/envelopes/${params.envelopeId}`, {
    accessToken: params.settings.accessToken,
    baseUrl: params.settings.baseUrl,
    method: "PATCH",
    body: JSON.stringify({
      data: {
        id: params.envelopeId,
        type: "envelopes",
        attributes: {
          status: "running",
        },
      },
    }),
  });
}

async function notifySigner(params: {
  envelopeId: string;
  signerId: string;
  settings: ReturnType<typeof getClicksignSettings>;
  subject: string;
  notification: ClicksignEnvelopeInput["notification"];
}) {
  const payload = await clicksignFetch(
    `/envelopes/${params.envelopeId}/signers/${params.signerId}/notifications`,
    {
      accessToken: params.settings.accessToken,
      baseUrl: params.settings.baseUrl,
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "notifications",
          attributes: {
            email_customization: {
              subject: params.subject,
              head: "Direito na Lente",
              greeting: "Olá,",
              principal: params.notification.principal,
              button: params.notification.button,
              final: params.notification.final,
              align: "left",
              show_details: true,
            },
          },
        },
      }),
    },
  );

  return {
    payload,
    id: payload.data?.id ?? null,
  };
}

export async function createClicksignSoaEnvelope(
  input: ClicksignSoaEnvelopeInput,
): Promise<ClicksignSoaEnvelopeResult> {
  const envelopeInput: ClicksignEnvelopeInput = {
    templateKey: input.templateKey,
    fileName: input.fileName,
    envelopeName: `SOA - ${input.signerName}`,
    subject: "Assinatura do SOA - Direito na Lente",
    message:
      "Antes de iniciar o monitoramento das imagens, precisamos da assinatura do termo de representacao da Direito na Lente.",
    notification: {
      principal:
        "Para iniciar o monitoramento das suas imagens, assine o termo de representacao enviado pela Direito na Lente.",
      button: "Assinar SOA",
      final: "Depois da assinatura, volte para a plataforma e confirme o envio das imagens.",
    },
    templateData: input.templateData,
    metadata: input.metadata,
  };
  const envelope = await createEnvelope(envelopeInput);
  const document = await createDocument({
    envelopeId: envelope.id,
    settings: envelope.settings,
    input: envelopeInput,
  });
  const signer = await createSigner({
    envelopeId: envelope.id,
    settings: envelope.settings,
    signer: {
      name: input.signerName,
      email: input.signerEmail,
      cpf: input.signerCpf,
    },
  });
  const qualificationRequirement = await createQualificationRequirement({
    envelopeId: envelope.id,
    documentId: document.id,
    signerId: signer.id,
    settings: envelope.settings,
    role: "sign",
  });
  const authenticationRequirement = await createAuthenticationRequirement({
    envelopeId: envelope.id,
    documentId: document.id,
    signerId: signer.id,
    settings: envelope.settings,
  });
  const activation = await activateEnvelope({
    envelopeId: envelope.id,
    settings: envelope.settings,
  });
  const notification = await notifySigner({
    envelopeId: envelope.id,
    signerId: signer.id,
    settings: envelope.settings,
    subject: envelopeInput.subject,
    notification: envelopeInput.notification,
  });

  return {
    environment: envelope.environment,
    envelopeId: envelope.id,
    documentId: document.id,
    signerId: signer.id,
    qualificationRequirementId: qualificationRequirement.id,
    authenticationRequirementId: authenticationRequirement.id,
    notificationId: notification.id,
    raw: {
      envelope: envelope.payload,
      document: document.payload,
      signer: signer.payload,
      qualificationRequirement: qualificationRequirement.payload,
      authenticationRequirement: authenticationRequirement.payload,
      activation,
      notification: notification.payload,
    },
  };
}

export async function createClicksignSraEnvelope(
  input: ClicksignSraEnvelopeInput,
): Promise<ClicksignSraEnvelopeResult> {
  const envelopeInput: ClicksignEnvelopeInput = {
    templateKey: input.templateKey,
    fileName: input.fileName,
    envelopeName: `SRA - Caso ${input.caseId}`,
    subject: `Assinatura do acordo SRA - Caso ${input.caseId}`,
    message:
      "A Direito na Lente enviou o termo de acordo SRA para assinatura das partes.",
    notification: {
      principal:
        "Revise e assine o termo de acordo SRA enviado pela Direito na Lente.",
      button: "Assinar SRA",
      final: "A conclusao sera registrada automaticamente no caso apos todas as assinaturas.",
    },
    templateData: input.templateData,
    metadata: input.metadata,
  };
  const envelope = await createEnvelope(envelopeInput);
  const document = await createDocument({
    envelopeId: envelope.id,
    settings: envelope.settings,
    input: envelopeInput,
  });
  const signerResults: ClicksignSraSignerResult[] = [];
  const signerPayloads: unknown[] = [];
  const qualificationPayloads: unknown[] = [];
  const authenticationPayloads: unknown[] = [];

  for (const signerInput of input.signers) {
    const signer = await createSigner({
      envelopeId: envelope.id,
      settings: envelope.settings,
      signer: signerInput,
    });
    const qualificationRequirement = await createQualificationRequirement({
      envelopeId: envelope.id,
      documentId: document.id,
      signerId: signer.id,
      settings: envelope.settings,
      role:
        signerInput.kind === "notified"
          ? "party"
          : signerInput.kind === "dnl"
            ? "legal_representative"
            : "witness",
    });
    const authenticationRequirement = await createAuthenticationRequirement({
      envelopeId: envelope.id,
      documentId: document.id,
      signerId: signer.id,
      settings: envelope.settings,
    });

    signerResults.push({
      kind: signerInput.kind,
      signerId: signer.id,
      qualificationRequirementId: qualificationRequirement.id,
      authenticationRequirementId: authenticationRequirement.id,
      notificationId: null,
    });
    signerPayloads.push(signer.payload);
    qualificationPayloads.push(qualificationRequirement.payload);
    authenticationPayloads.push(authenticationRequirement.payload);
  }

  const activation = await activateEnvelope({
    envelopeId: envelope.id,
    settings: envelope.settings,
  });
  const notificationPayloads: unknown[] = [];

  for (const signerResult of signerResults) {
    const notification = await notifySigner({
      envelopeId: envelope.id,
      signerId: signerResult.signerId,
      settings: envelope.settings,
      subject: envelopeInput.subject,
      notification: envelopeInput.notification,
    });
    signerResult.notificationId = notification.id;
    notificationPayloads.push(notification.payload);
  }

  return {
    environment: envelope.environment,
    envelopeId: envelope.id,
    documentId: document.id,
    signers: signerResults,
    raw: {
      envelope: envelope.payload,
      document: document.payload,
      signers: signerPayloads,
      qualificationRequirements: qualificationPayloads,
      authenticationRequirements: authenticationPayloads,
      activation,
      notifications: notificationPayloads,
    },
  };
}
