import "server-only";

import {
  createClicksignSoaEnvelope,
  type ClicksignEnvironment,
} from "@/lib/clicksign/client";
import {
  buildSoaTemplateData,
  extractClicksignWebhookIdentifiers,
  extractClicksignWebhookOccurredAt,
  extractClicksignWebhookStatusInput,
  getRepresentationUploadBlockReason,
  mapClicksignWebhookStatus,
  type RepresentationDocumentKind,
  type RepresentationDocumentStatus,
  type RepresentationUploadBlockReason,
  type SoaSignatureRequest,
  type SoaTemplateData,
} from "@/lib/clicksign/representation-documents";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_SOA_TEMPLATE_KEY = "1ff9d3f3-50c1-452f-b7b1-0fc463860ba9";

type ClientRepresentationDocumentRow = {
  id: string;
  organization_id: string;
  document_kind: RepresentationDocumentKind;
  status: RepresentationDocumentStatus;
  provider: "clicksign";
  provider_environment: ClicksignEnvironment;
  template_key: string;
  signer_user_id: string | null;
  signer_name: string;
  signer_email: string;
  signer_document: string;
  signer_marital_status: string | null;
  signer_address: string | null;
  provider_envelope_id: string | null;
  provider_document_id: string | null;
  provider_signer_id: string | null;
  provider_qualification_requirement_id: string | null;
  provider_authentication_requirement_id: string | null;
  provider_notification_id: string | null;
  template_data: SoaTemplateData | Record<string, unknown>;
  last_event_name: string | null;
  last_event_at: string | null;
  requested_at: string;
  signed_at: string | null;
  expires_at: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileDefaultsRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  cpf: string | null;
  postal_code?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
};

type OrganizationDefaultsRow = {
  id: string;
  name: string;
  document: string | null;
  billing_email: string | null;
  contact_email?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  postal_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

type PlatformSettingsCnpjRow = {
  cnpj: string | null;
};

export type ClientRepresentationDocument = {
  id: string;
  kind: RepresentationDocumentKind;
  status: RepresentationDocumentStatus;
  signerEmail: string;
  providerEnvelopeId: string | null;
  providerDocumentId: string | null;
  requestedAt: string;
  signedAt: string | null;
};

export type ClientRepresentationUploadGate = {
  blockReason: RepresentationUploadBlockReason | null;
  document: ClientRepresentationDocument | null;
};

export type ClientRepresentationDefaults = {
  fullName: string | null;
  email: string | null;
  cpf: string | null;
  address: string | null;
};

export type RequestSoaSignatureResult =
  | {
      status: "already_signed";
      document: ClientRepresentationDocument;
      message: string;
    }
  | {
      status: "signature_requested";
      document: ClientRepresentationDocument;
      message: string;
    };

function hasMissingRepresentationDocumentsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42P01" ||
    candidate.code === "42703" ||
    combinedMessage.includes("client_representation_documents")
  );
}

function toClientRepresentationDocument(
  row: ClientRepresentationDocumentRow,
): ClientRepresentationDocument {
  return {
    id: row.id,
    kind: row.document_kind,
    status: row.status,
    signerEmail: row.signer_email,
    providerEnvelopeId: row.provider_envelope_id,
    providerDocumentId: row.provider_document_id,
    requestedAt: row.requested_at,
    signedAt: row.signed_at,
  };
}

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function joinAddressParts(parts: Array<string | null | undefined>) {
  const normalized = parts
    .map((part) => trimToNull(part))
    .filter((part): part is string => Boolean(part));

  return normalized.length > 0 ? normalized.join(", ") : null;
}

function formatOrganizationAddress(organization: OrganizationDefaultsRow) {
  const streetLine = joinAddressParts([
    organization.street,
    organization.number ? `nº ${organization.number}` : null,
  ]);
  const cityLine =
    organization.city && organization.state
      ? `${organization.city}/${organization.state}`
      : (organization.city ?? organization.state ?? null);
  const postalCode = organization.postal_code
    ? `CEP ${organization.postal_code}`
    : null;

  return joinAddressParts([
    streetLine,
    organization.complement,
    organization.neighborhood,
    cityLine,
    postalCode,
  ]);
}

function buildSoaFileName(fullName: string) {
  const slug = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `soa-${slug || "cliente"}.docx`;
}

function getSoaTemplateKey() {
  return process.env.CLICKSIGN_SOA_TEMPLATE_KEY?.trim() || DEFAULT_SOA_TEMPLATE_KEY;
}

async function getDnlCnpj() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("cnpj")
    .eq("id", true)
    .maybeSingle<PlatformSettingsCnpjRow>();

  if (!error && data?.cnpj?.trim()) {
    return data.cnpj.trim();
  }

  throw new Error("Configure o CNPJ da DNL nas configuracoes da plataforma antes de gerar o SOA.");
}

export async function getCurrentClientRepresentationDocument(
  organizationId: string,
  kind: RepresentationDocumentKind,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_representation_documents")
    .select(
      [
        "id",
        "organization_id",
        "document_kind",
        "status",
        "provider",
        "provider_environment",
        "template_key",
        "signer_user_id",
        "signer_name",
        "signer_email",
        "signer_document",
        "signer_marital_status",
        "signer_address",
        "provider_envelope_id",
        "provider_document_id",
        "provider_signer_id",
        "provider_qualification_requirement_id",
        "provider_authentication_requirement_id",
        "provider_notification_id",
        "template_data",
        "last_event_name",
        "last_event_at",
        "requested_at",
        "signed_at",
        "expires_at",
        "is_current",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .eq("organization_id", organizationId)
    .eq("document_kind", kind)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ClientRepresentationDocumentRow>();

  if (error) {
    if (hasMissingRepresentationDocumentsTableError(error)) {
      return null;
    }

    throw new Error("Nao foi possivel carregar os documentos de representacao.");
  }

  return data ? toClientRepresentationDocument(data) : null;
}

export async function getClientRepresentationUploadGate(
  organizationId: string,
): Promise<ClientRepresentationUploadGate> {
  const document = await getCurrentClientRepresentationDocument(organizationId, "soa");

  return {
    blockReason: getRepresentationUploadBlockReason(document),
    document,
  };
}

export async function getClientRepresentationDefaults(params: {
  organizationId: string;
  userId: string;
}): Promise<ClientRepresentationDefaults> {
  const supabase = await createClient();
  const [profileResponse, organizationResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, cpf, postal_code, address_number, address_complement")
      .eq("id", params.userId)
      .maybeSingle<ProfileDefaultsRow>(),
    supabase
      .from("organizations")
      .select(
        [
          "id",
          "name",
          "document",
          "billing_email",
          "contact_email",
          "legal_name",
          "trade_name",
          "postal_code",
          "street",
          "number",
          "complement",
          "neighborhood",
          "city",
          "state",
        ].join(", "),
      )
      .eq("id", params.organizationId)
      .maybeSingle<OrganizationDefaultsRow>(),
  ]);

  const profile = profileResponse.data;
  const organization = organizationResponse.data;

  return {
    fullName: trimToNull(profile?.full_name),
    email:
      trimToNull(profile?.email) ??
      trimToNull(organization?.contact_email) ??
      trimToNull(organization?.billing_email),
    cpf: trimToNull(profile?.cpf),
    address: organization ? formatOrganizationAddress(organization) : null,
  };
}

async function getCurrentDocumentWithAdmin(params: {
  organizationId: string;
  kind: RepresentationDocumentKind;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_representation_documents")
    .select(
      "id, organization_id, document_kind, status, provider, provider_environment, template_key, signer_user_id, signer_name, signer_email, signer_document, signer_marital_status, signer_address, provider_envelope_id, provider_document_id, provider_signer_id, provider_qualification_requirement_id, provider_authentication_requirement_id, provider_notification_id, template_data, last_event_name, last_event_at, requested_at, signed_at, expires_at, is_current, created_at, updated_at",
    )
    .eq("organization_id", params.organizationId)
    .eq("document_kind", params.kind)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ClientRepresentationDocumentRow>();

  if (error) {
    throw new Error("Nao foi possivel carregar os documentos de representacao.");
  }

  return data ? toClientRepresentationDocument(data) : null;
}

export async function requestClicksignSoaSignature(params: {
  organizationId: string;
  userId: string;
  data: SoaSignatureRequest;
}): Promise<RequestSoaSignatureResult> {
  const currentDocument = await getCurrentDocumentWithAdmin({
    organizationId: params.organizationId,
    kind: "soa",
  });

  if (currentDocument?.status === "signed") {
    return {
      status: "already_signed",
      document: currentDocument,
      message: "O SOA desta organizacao ja esta assinado.",
    };
  }

  if (currentDocument?.status === "signature_requested") {
    return {
      status: "signature_requested",
      document: currentDocument,
      message: `O SOA ja foi enviado pela Clicksign para ${currentDocument.signerEmail}.`,
    };
  }

  const admin = createAdminClient();
  const templateKey = getSoaTemplateKey();
  const dnlCnpj = await getDnlCnpj();
  const templateData = buildSoaTemplateData({
    fullName: params.data.fullName,
    maritalStatus: params.data.maritalStatus,
    cpf: params.data.cpf,
    address: params.data.address,
    dnlCnpj,
  });
  const metadata = {
    source: "dnl-platform",
    organization_id: params.organizationId,
    user_id: params.userId,
    document_kind: "soa",
  };
  const clicksign = await createClicksignSoaEnvelope({
    templateKey,
    fileName: buildSoaFileName(params.data.fullName),
    signerName: params.data.fullName,
    signerEmail: params.data.email,
    signerCpf: templateData.DOCUMENTO,
    templateData,
    metadata,
  });

  if (currentDocument) {
    await admin
      .from("client_representation_documents")
      .update({
        is_current: false,
        updated_by_user_id: params.userId,
      })
      .eq("id", currentDocument.id);
  }

  const { data, error } = await admin
    .from("client_representation_documents")
    .insert({
      organization_id: params.organizationId,
      document_kind: "soa",
      status: "signature_requested",
      provider: "clicksign",
      provider_environment: clicksign.environment,
      template_key: templateKey,
      signer_user_id: params.userId,
      signer_name: params.data.fullName,
      signer_email: params.data.email,
      signer_document: params.data.cpf,
      signer_marital_status: params.data.maritalStatus,
      signer_address: params.data.address,
      provider_envelope_id: clicksign.envelopeId,
      provider_document_id: clicksign.documentId,
      provider_signer_id: clicksign.signerId,
      provider_qualification_requirement_id: clicksign.qualificationRequirementId,
      provider_authentication_requirement_id: clicksign.authenticationRequirementId,
      provider_notification_id: clicksign.notificationId,
      template_data: templateData,
      provider_payload: clicksign.raw,
      created_by_user_id: params.userId,
      updated_by_user_id: params.userId,
    })
    .select(
      "id, organization_id, document_kind, status, provider, provider_environment, template_key, signer_user_id, signer_name, signer_email, signer_document, signer_marital_status, signer_address, provider_envelope_id, provider_document_id, provider_signer_id, provider_qualification_requirement_id, provider_authentication_requirement_id, provider_notification_id, template_data, last_event_name, last_event_at, requested_at, signed_at, expires_at, is_current, created_at, updated_at",
    )
    .single<ClientRepresentationDocumentRow>();

  if (error || !data) {
    throw new Error("O SOA foi criado na Clicksign, mas nao foi possivel registrar na plataforma.");
  }

  return {
    status: "signature_requested",
    document: toClientRepresentationDocument(data),
    message: `Enviamos o SOA pela Clicksign para ${params.data.email}.`,
  };
}

async function findRepresentationDocumentForWebhook(params: {
  envelopeId: string | null;
  documentId: string | null;
}) {
  const admin = createAdminClient();
  const selectColumns =
    "id, organization_id, document_kind, status, provider, provider_environment, template_key, signer_user_id, signer_name, signer_email, signer_document, signer_marital_status, signer_address, provider_envelope_id, provider_document_id, provider_signer_id, provider_qualification_requirement_id, provider_authentication_requirement_id, provider_notification_id, template_data, last_event_name, last_event_at, requested_at, signed_at, expires_at, is_current, created_at, updated_at";

  if (params.envelopeId) {
    const { data, error } = await admin
      .from("client_representation_documents")
      .select(selectColumns)
      .eq("provider", "clicksign")
      .eq("provider_envelope_id", params.envelopeId)
      .eq("is_current", true)
      .limit(1)
      .maybeSingle<ClientRepresentationDocumentRow>();

    if (error) {
      throw new Error("Nao foi possivel localizar o documento pelo envelope Clicksign.");
    }

    if (data) {
      return data;
    }
  }

  if (params.documentId) {
    const { data, error } = await admin
      .from("client_representation_documents")
      .select(selectColumns)
      .eq("provider", "clicksign")
      .eq("provider_document_id", params.documentId)
      .eq("is_current", true)
      .limit(1)
      .maybeSingle<ClientRepresentationDocumentRow>();

    if (error) {
      throw new Error("Nao foi possivel localizar o documento pela chave Clicksign.");
    }

    return data ?? null;
  }

  return null;
}

export async function applyClicksignRepresentationWebhook(payload: unknown) {
  const ids = extractClicksignWebhookIdentifiers(payload);
  const statusInput = extractClicksignWebhookStatusInput(payload);
  const nextStatus = mapClicksignWebhookStatus(statusInput);
  const eventName = statusInput.eventName;
  const occurredAt = extractClicksignWebhookOccurredAt(payload);

  if (!ids.envelopeId && !ids.documentId) {
    return { matched: false, updated: false };
  }

  if (!nextStatus) {
    return { matched: true, updated: false };
  }

  const current = await findRepresentationDocumentForWebhook(ids);
  if (!current) {
    return { matched: false, updated: false };
  }

  const now = new Date().toISOString();
  const eventAt = occurredAt ?? now;
  const admin = createAdminClient();
  const { error } = await admin
    .from("client_representation_documents")
    .update({
      status: nextStatus,
      signed_at: nextStatus === "signed" ? current.signed_at ?? eventAt : current.signed_at,
      last_event_name: eventName,
      last_event_at: eventAt,
      webhook_payload: payload,
    })
    .eq("id", current.id);

  if (error) {
    throw new Error("Nao foi possivel atualizar o status do documento Clicksign.");
  }

  return {
    matched: true,
    updated: true,
    status: nextStatus,
  };
}
