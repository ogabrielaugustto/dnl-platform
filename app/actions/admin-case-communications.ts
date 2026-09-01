"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import {
  ADMIN_CASE_ACTION_LABELS,
  COMMUNICATION_KIND_LABELS,
  resolveAdminCaseActionEffect,
} from "@/lib/admin-case-workflow";
import {
  ADMIN_CASE_COMMUNICATION_ACTIONS,
  validateCommunicationAttachmentSizes,
  type AdminCaseCommunicationActionKind,
} from "@/lib/admin-case-communications";
import { buildCaseValidationUrl } from "@/lib/case-validation-code";
import { createCasePublicValidationCode } from "@/lib/dal/case-public-validation";
import { getAdminCaseDetails } from "@/lib/dal/admin-cases";
import { getAppUrl, sendCaseCommunicationEmail } from "@/lib/email/service";
import { formatPublicId } from "@/lib/public-id";
import { readCaseDocumentFromR2 } from "@/lib/r2";
import { createClient } from "@/lib/server";

const actionSchema = z.object({
  organizationId: z.uuid(),
  casePublicId: z.coerce.number().int().positive(),
  actionKind: z.enum(ADMIN_CASE_COMMUNICATION_ACTIONS),
  to: z.email("Informe um e-mail válido para o notificado."),
  subject: z.string().trim().min(3, "Informe o assunto.").max(180),
  body: z.string().trim().min(10, "Revise o conteúdo da mensagem.").max(12_000),
  notes: z.string().trim().max(2_000).nullable(),
  confirmed: z.literal("true", {
    error: "Confirme a revisão antes de enviar.",
  }),
});

export type AdminCaseCommunicationState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAdminCaseCommunicationState: AdminCaseCommunicationState = {
  status: "idle",
  message: "",
};

type CaseDocumentAttachmentRow = {
  id: string;
  document_kind: "rhf" | "soa" | "proofdata" | "metadata";
  title: string;
  storage_key: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  is_current: boolean;
  created_at: string;
};

type SoaSnapshotRow = {
  id: string;
  status: string;
  signer_name: string;
  signer_email: string;
  signer_document: string;
  signer_marital_status: string | null;
  signer_address: string | null;
  provider_envelope_id: string | null;
  provider_document_id: string | null;
  template_data: Record<string, unknown> | null;
  signed_at: string | null;
};

type EmailAttachment = {
  id: string;
  kind: "rhf" | "soa" | "proofdata" | "metadata";
  filename: string;
  content: Buffer;
  contentType: string;
};

type AdminCaseDetailsValue = NonNullable<Awaited<ReturnType<typeof getAdminCaseDetails>>>;
type SignedDeclaration = NonNullable<AdminCaseDetailsValue["latestSignedDeclaration"]>;

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "documento";
}

function buildRhfSnapshot(casePublicIdLabel: string, declaration: SignedDeclaration) {
  return Buffer.from(
    [
      `RHF - Caso ${casePublicIdLabel}`,
      "",
      declaration.body,
      "",
      `Signatário: ${declaration.signerFullName}`,
      `CPF: ${declaration.signerCpf}`,
      `Qualificação: ${declaration.signerRole}`,
      `Cidade: ${declaration.signingCity}`,
      `Data declarada: ${declaration.statementDate}`,
      `Registro de assinatura: ${declaration.id}`,
      `Registrado em: ${declaration.createdAt}`,
      `Versão do modelo: ${declaration.templateVersion}`,
    ].join("\n"),
    "utf8",
  );
}

function buildSoaSnapshot(casePublicIdLabel: string, document: SoaSnapshotRow) {
  return Buffer.from(
    [
      `SOA - Caso ${casePublicIdLabel}`,
      "",
      "Registro de assinatura eletrônica do termo de representação.",
      `Signatário: ${document.signer_name}`,
      `E-mail: ${document.signer_email}`,
      `CPF: ${document.signer_document}`,
      document.signer_marital_status
        ? `Estado civil: ${document.signer_marital_status}`
        : null,
      document.signer_address ? `Endereço: ${document.signer_address}` : null,
      `Status: ${document.status}`,
      `Assinado em: ${document.signed_at ?? "data não informada"}`,
      `Envelope Clicksign: ${document.provider_envelope_id ?? "não informado"}`,
      `Documento Clicksign: ${document.provider_document_id ?? "não informado"}`,
      "",
      "Dados do termo:",
      JSON.stringify(document.template_data ?? {}, null, 2),
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    "utf8",
  );
}

async function loadDocumentationAttachments(params: {
  organizationId: string;
  casePublicId: number;
  casePublicIdLabel: string;
  declaration: SignedDeclaration | null;
}) {
  const supabase = await createClient();
  const [{ data: caseDocuments, error: documentsError }, { data: soa, error: soaError }] =
    await Promise.all([
      supabase
        .from("case_documents")
        .select(
          "id, document_kind, title, storage_key, file_name, mime_type, size_bytes, status, is_current, created_at",
        )
        .eq("organization_id", params.organizationId)
        .eq("case_public_id", params.casePublicId)
        .eq("is_current", true)
        .in("status", ["attached", "signed", "sent"])
        .in("document_kind", ["rhf", "soa", "proofdata", "metadata"])
        .order("created_at", { ascending: false })
        .returns<CaseDocumentAttachmentRow[]>(),
      supabase
        .from("client_representation_documents")
        .select(
          "id, status, signer_name, signer_email, signer_document, signer_marital_status, signer_address, provider_envelope_id, provider_document_id, template_data, signed_at",
        )
        .eq("organization_id", params.organizationId)
        .eq("document_kind", "soa")
        .eq("is_current", true)
        .eq("status", "signed")
        .maybeSingle<SoaSnapshotRow>(),
    ]);

  if (documentsError || soaError) {
    throw new Error("Não foi possível preparar os documentos desta comunicação.");
  }

  const latestByKind = new Map<CaseDocumentAttachmentRow["document_kind"], CaseDocumentAttachmentRow>();
  for (const document of caseDocuments ?? []) {
    if (!latestByKind.has(document.document_kind)) {
      latestByKind.set(document.document_kind, document);
    }
  }

  const attachments: EmailAttachment[] = [];
  for (const kind of ["rhf", "soa", "proofdata", "metadata"] as const) {
    const document = latestByKind.get(kind);

    if (document?.storage_key) {
      if (document.size_bytes && document.size_bytes > 10 * 1024 * 1024) {
        throw new Error(
          `O anexo ${document.file_name ?? document.title} excede o limite de 10 MB.`,
        );
      }
      const stored = await readCaseDocumentFromR2(document.storage_key);
      attachments.push({
        id: document.id,
        kind,
        filename: safeFilename(document.file_name ?? `${kind}-${params.casePublicIdLabel}`),
        content: stored.body,
        contentType: document.mime_type ?? stored.contentType,
      });
      continue;
    }

    if (kind === "rhf" && params.declaration) {
      attachments.push({
        id: params.declaration.id,
        kind,
        filename: `RHF-${params.casePublicIdLabel}.txt`,
        content: buildRhfSnapshot(params.casePublicIdLabel, params.declaration),
        contentType: "text/plain; charset=utf-8",
      });
      continue;
    }

    if (kind === "soa" && soa) {
      attachments.push({
        id: soa.id,
        kind,
        filename: `SOA-${params.casePublicIdLabel}.txt`,
        content: buildSoaSnapshot(params.casePublicIdLabel, soa),
        contentType: "text/plain; charset=utf-8",
      });
    }
  }

  validateCommunicationAttachmentSizes(
    attachments.map((attachment) => ({
      filename: attachment.filename,
      sizeBytes: attachment.content.byteLength,
    })),
  );

  return attachments;
}

async function saveCommunicationResult(params: {
  organizationId: string;
  casePublicId: number;
  representativeDetectionId: string;
  userId: string;
  actionKind: AdminCaseCommunicationActionKind;
  to: string;
  subject: string;
  body: string;
  notes: string | null;
  validationCodeHint: string;
  attachments: EmailAttachment[];
}) {
  const effect = resolveAdminCaseActionEffect(params.actionKind);
  const supabase = await createClient();
  const { data: workflow, error: workflowReadError } = await supabase
    .from("case_workflows")
    .select("id")
    .eq("organization_id", params.organizationId)
    .eq("case_public_id", params.casePublicId)
    .maybeSingle<{ id: string }>();

  if (workflowReadError) {
    throw new Error("Não foi possível acessar o workflow do caso.");
  }

  let workflowId = workflow?.id ?? null;
  if (workflowId) {
    const workflowUpdate = {
      stage: effect.stage,
      next_action: ADMIN_CASE_ACTION_LABELS[params.actionKind],
      notified_email: params.to,
      updated_by_user_id: params.userId,
      ...(params.notes ? { summary: params.notes } : {}),
    };
    const { error } = await supabase
      .from("case_workflows")
      .update(workflowUpdate)
      .eq("id", workflowId)
      .eq("organization_id", params.organizationId);

    if (error) {
      throw new Error("Não foi possível atualizar o workflow do caso.");
    }
  } else {
    const { data, error } = await supabase
      .from("case_workflows")
      .insert({
        organization_id: params.organizationId,
        case_public_id: params.casePublicId,
        representative_detection_id: params.representativeDetectionId,
        stage: effect.stage,
        next_action: ADMIN_CASE_ACTION_LABELS[params.actionKind],
        notified_email: params.to,
        summary: params.notes,
        created_by_user_id: params.userId,
        updated_by_user_id: params.userId,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !data) {
      throw new Error("Não foi possível criar o workflow do caso.");
    }
    workflowId = data.id;
  }

  const communicationKind = effect.communicationKind;
  if (!communicationKind) {
    throw new Error("A ação selecionada não é uma comunicação.");
  }

  const { error: eventError } = await supabase.from("case_events").insert({
    organization_id: params.organizationId,
    case_public_id: params.casePublicId,
    workflow_id: workflowId,
    detection_id: params.representativeDetectionId,
    user_id: params.userId,
    event_kind: communicationKind,
    direction: "outbound",
    title: COMMUNICATION_KIND_LABELS[communicationKind],
    notes: params.notes,
    communication_subject: params.subject,
    communication_body_snapshot: params.body,
    metadata: {
      actionKind: params.actionKind,
      emailTo: params.to,
      validationCodeHint: params.validationCodeHint,
      attachments: params.attachments.map((attachment) => ({
        id: attachment.id,
        kind: attachment.kind,
        filename: attachment.filename,
        contentType: attachment.contentType,
        sizeBytes: attachment.content.byteLength,
      })),
    },
  });

  if (eventError) {
    throw new Error("O e-mail foi enviado, mas não foi possível registrar o histórico.");
  }

  if (effect.detectionStatus) {
    const { error } = await supabase
      .from("detections")
      .update({ status: effect.detectionStatus, reviewed_at: new Date().toISOString() })
      .eq("organization_id", params.organizationId)
      .eq("case_public_id", params.casePublicId);

    if (error) {
      throw new Error("O e-mail foi enviado, mas não foi possível atualizar as ocorrências.");
    }
  }
}

export async function executeAdminCaseCommunication(
  _previousState: AdminCaseCommunicationState,
  formData: FormData,
): Promise<AdminCaseCommunicationState> {
  const parsed = actionSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
    actionKind: formData.get("actionKind"),
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
    notes: optionalString(formData.get("notes")),
    confirmed: formData.get("confirmed"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos e confirme o envio.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const auth = await requirePanelAccess("admin");
    const data = parsed.data;
    const adminCase = await getAdminCaseDetails(data.organizationId, data.casePublicId);

    if (!adminCase || adminCase.organization.id !== data.organizationId) {
      return { status: "error", message: "Caso não encontrado ou acesso negado." };
    }

    const casePublicIdLabel = formatPublicId(adminCase.publicId);
    const attachments =
      data.actionKind === "documentation_notice"
        ? await loadDocumentationAttachments({
            organizationId: adminCase.organization.id,
            casePublicId: adminCase.publicId,
            casePublicIdLabel,
            declaration: adminCase.latestSignedDeclaration,
          })
        : [];
    const validationCode = await createCasePublicValidationCode({
      organizationId: adminCase.organization.id,
      casePublicId: adminCase.publicId,
      createdByUserId: auth.userId,
    });
    const validationUrl = buildCaseValidationUrl({
      baseUrl: getAppUrl(),
      casePublicId: adminCase.publicId,
      validationCode: validationCode.formatted,
    });

    await sendCaseCommunicationEmail({
      to: data.to,
      subject: data.subject,
      body: data.body,
      casePublicIdLabel,
      clientName: adminCase.organization.name,
      domain: adminCase.domain,
      sourceUrl: adminCase.sourceUrl,
      validationUrl,
      validationCode: validationCode.formatted,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    await saveCommunicationResult({
      organizationId: adminCase.organization.id,
      casePublicId: adminCase.publicId,
      representativeDetectionId: adminCase.representativeDetectionId,
      userId: auth.userId,
      actionKind: data.actionKind,
      to: data.to,
      subject: data.subject,
      body: data.body,
      notes: data.notes,
      validationCodeHint: validationCode.hint,
      attachments,
    });

    revalidatePath("/admin/cases");
    revalidatePath(`/admin/cases/${adminCase.organization.id}/${adminCase.publicId}`);

    const attachmentMessage = attachments.length
      ? ` com ${attachments.length} anexo(s)`
      : "";
    return {
      status: "success",
      message: `Comunicação enviada para ${data.to}${attachmentMessage} e registrada no caso.`,
    };
  } catch (error) {
    console.error("Falha ao enviar comunicação administrativa", error);
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a comunicação. Tente novamente.",
    };
  }
}
