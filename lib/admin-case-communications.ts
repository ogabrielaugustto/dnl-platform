import type {
  AdminCaseActionKind,
  CaseCommunicationKind,
  CaseCommunicationTemplateContext,
  DocumentKind,
  DocumentStatus,
} from "./admin-case-workflow";

export const ADMIN_CASE_COMMUNICATION_ACTIONS = [
  "first_communication",
  "documentation_notice",
  "c1",
  "c1p",
  "c2",
] as const satisfies readonly AdminCaseActionKind[];

export type AdminCaseCommunicationActionKind =
  (typeof ADMIN_CASE_COMMUNICATION_ACTIONS)[number];

export type AdminCaseCommunicationDraftContext = CaseCommunicationTemplateContext & {
  casePublicIdLabel: string;
};

export type AdminCaseCommunicationDraft = {
  actionKind: AdminCaseCommunicationActionKind;
  communicationKind: CaseCommunicationKind;
  to: string;
  subject: string;
  body: string;
};

export type CommunicationAttachmentPreview = {
  id: string;
  kind: DocumentKind;
  title: string;
  fileName: string | null;
  source: string;
  status: DocumentStatus | string;
  available: boolean;
};

const communicationKindByAction: Record<
  AdminCaseCommunicationActionKind,
  CaseCommunicationKind
> = {
  first_communication: "first_notice",
  documentation_notice: "documentation_notice",
  c1: "c1",
  c1p: "c1p",
  c2: "c2",
};

const attachmentKindOrder = ["rhf", "soa", "proofdata", "metadata"] as const;
const maxAttachmentSizeBytes = 10 * 1024 * 1024;
const maxTotalAttachmentSizeBytes = 35 * 1024 * 1024;

export function isAdminCaseCommunicationAction(
  value: string,
): value is AdminCaseCommunicationActionKind {
  return ADMIN_CASE_COMMUNICATION_ACTIONS.some((action) => action === value);
}

export function buildAdminCaseCommunicationDraft(
  actionKind: AdminCaseCommunicationActionKind,
  context: AdminCaseCommunicationDraftContext,
  buildSnapshot: (
    kind: CaseCommunicationKind,
    context: CaseCommunicationTemplateContext,
  ) => { subject: string; body: string },
): AdminCaseCommunicationDraft {
  const communicationKind = communicationKindByAction[actionKind];
  const snapshot = buildSnapshot(communicationKind, {
    ...context,
    portalReference: context.casePublicIdLabel,
  });

  return {
    actionKind,
    communicationKind,
    to: context.notifiedEmail?.trim() ?? "",
    subject: snapshot.subject,
    body: snapshot.body,
  };
}

export function selectCommunicationAttachmentPreviews<
  T extends CommunicationAttachmentPreview,
>(documents: readonly T[]): T[] {
  return attachmentKindOrder.flatMap((kind) => {
    const document = documents.find((item) => item.kind === kind && item.available);
    return document ? [document] : [];
  });
}

export function validateCommunicationAttachmentSizes(
  attachments: readonly { filename: string; sizeBytes: number }[],
) {
  for (const attachment of attachments) {
    if (attachment.sizeBytes > maxAttachmentSizeBytes) {
      throw new Error(`O anexo ${attachment.filename} excede o limite de 10 MB.`);
    }
  }

  const totalSizeBytes = attachments.reduce(
    (total, attachment) => total + attachment.sizeBytes,
    0,
  );

  if (totalSizeBytes > maxTotalAttachmentSizeBytes) {
    throw new Error("Os anexos excedem o limite total de 35 MB por comunicação.");
  }

  return { totalSizeBytes };
}
