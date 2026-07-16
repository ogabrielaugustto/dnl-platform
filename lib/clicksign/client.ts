import "server-only";

import { z } from "zod";
import type { SoaTemplateData } from "@/lib/clicksign/representation-documents";

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

async function createEnvelope(input: ClicksignSoaEnvelopeInput) {
  const settings = getClicksignSettings();
  const payload = await clicksignFetch("/envelopes", {
    accessToken: settings.accessToken,
    baseUrl: settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "envelopes",
        attributes: {
          name: `SOA - ${input.signerName}`,
          locale: "pt-BR",
          auto_close: true,
          remind_interval: "3",
          block_after_refusal: false,
          deadline_at: buildEnvelopeDeadline(),
          default_subject: "Assinatura do SOA - Direito na Lente",
          default_message:
            "Antes de iniciar o monitoramento das imagens, precisamos da assinatura do termo de representacao da Direito na Lente.",
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
  input: ClicksignSoaEnvelopeInput;
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
  input: ClicksignSoaEnvelopeInput;
}) {
  const payload = await clicksignFetch(`/envelopes/${params.envelopeId}/signers`, {
    accessToken: params.settings.accessToken,
    baseUrl: params.settings.baseUrl,
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "signers",
        attributes: {
          name: params.input.signerName,
          email: params.input.signerEmail,
          has_documentation: true,
          documentation: params.input.signerCpf,
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
          role: "sign",
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
              subject: "Assinatura do SOA - Direito na Lente",
              head: "Direito na Lente",
              greeting: "Olá,",
              principal:
                "Para iniciar o monitoramento das suas imagens, assine o termo de representacao enviado pela Direito na Lente.",
              button: "Assinar SOA",
              final: "Depois da assinatura, volte para a plataforma e confirme o envio das imagens.",
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
  const envelope = await createEnvelope(input);
  const document = await createDocument({
    envelopeId: envelope.id,
    settings: envelope.settings,
    input,
  });
  const signer = await createSigner({
    envelopeId: envelope.id,
    settings: envelope.settings,
    input,
  });
  const qualificationRequirement = await createQualificationRequirement({
    envelopeId: envelope.id,
    documentId: document.id,
    signerId: signer.id,
    settings: envelope.settings,
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
