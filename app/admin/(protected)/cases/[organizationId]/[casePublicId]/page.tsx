import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HistoryIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ADMIN_CASE_COMMUNICATION_ACTIONS,
  buildAdminCaseCommunicationDraft,
  type AdminCaseCommunicationActionKind,
  type AdminCaseCommunicationDraft,
  type CommunicationAttachmentPreview,
} from "@/lib/admin-case-communications";
import {
  DOCUMENT_KIND_LABELS,
  DOCUMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
  WORKFLOW_STAGE_LABELS,
  buildCaseCommunicationSnapshot,
} from "@/lib/admin-case-workflow";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  formatSimilarityScore,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { getAdminCaseDetails, type AdminCaseDetails } from "@/lib/dal/admin-cases";
import { getAdminCaseSraDefaults } from "@/lib/dal/admin-case-sra";
import { getCurrentClientRepresentationDocument } from "@/lib/dal/client-representation-documents";
import { formatPublicId } from "@/lib/public-id";
import { AdminCaseActionMenu } from "./_components/admin-case-action-menu";

type AdminCaseDetailsPageProps = {
  params: Promise<{
    organizationId: string;
    casePublicId: string;
  }>;
};

const caseDocumentKinds = new Set(["rhf", "soa", "proofdata", "metadata", "sra", "receipt"]);

function formatDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

function formatActionLabel(value: string) {
  switch (value) {
    case "marcada_como_uso_nao_autorizado":
      return "Cliente confirmou a infração";
    case "notificacao_enviada":
      return "Notificação enviada";
    case "marcada_como_resolvida":
      return "Caso resolvido";
    case "marcada_como_ignorada":
      return "Caso ignorado";
    case "marcada_como_uso_autorizado":
      return "Marcado como uso autorizado";
    case "marcada_como_possivel_infracao":
      return "Marcado como possível infração";
    default:
      return value.replaceAll("_", " ");
  }
}

function formatList(values: string[], fallback: string) {
  if (values.length === 0) {
    return fallback;
  }

  return values.join(" • ");
}

function formatDomainOwnerSource(value: string | null | undefined) {
  switch (value) {
    case "rdap":
      return "RDAP / registro do domínio";
    case "public_site":
      return "Contato público do site";
    case "none":
      return "Não encontrado";
    default:
      return "Não informado";
  }
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoItem({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0 border-l border-border pl-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-medium leading-6 text-foreground ${
          breakAll ? "break-all" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ImagePanel({
  title,
  imageUrl,
  alt,
  fallback,
}: {
  title: string;
  imageUrl: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/20">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={alt} className="h-72 w-full object-contain" />
        ) : (
          <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsPanel({ adminCase }: { adminCase: AdminCaseDetails }) {
  const documents = adminCase.workflow.documents.filter((document) =>
    caseDocumentKinds.has(document.kind),
  );

  return (
    <Section
      title="Documentos e provas"
      description="Apenas materiais do caso aparecem aqui. CNPJ e contrato social da DNL continuam como documentos da plataforma."
    >
      <div className="divide-y divide-border rounded-md border border-border">
        {documents.map((document) => (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
            key={document.id}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{document.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {DOCUMENT_KIND_LABELS[document.kind]} •{" "}
                {document.createdAt ? formatDate(document.createdAt) : "Sem arquivo do caso"}
              </p>
              {document.notes ? (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {document.notes}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={document.status === "missing" ? "destructive" : "outline"}>
                {DOCUMENT_STATUS_LABELS[document.status]}
              </Badge>
              {document.downloadUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                    Abrir
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              ) : null}
              {document.externalUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={document.externalUrl} target="_blank" rel="noreferrer">
                    Externo
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PagesPanel({ adminCase }: { adminCase: AdminCaseDetails }) {
  return (
    <Section
      title="Páginas e ocorrências"
      description="Ocorrências agrupadas por página para revisar origem, evidência e confiança sem sair do caso."
    >
      <div className="space-y-3">
        {adminCase.pages.map((page) => (
          <article className="rounded-md border border-border" key={page.key}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {page.pageTitle ?? "Página sem título identificado"}
                </p>
                <p className="mt-1 break-all text-sm leading-6 text-muted-foreground">
                  {page.sourceUrl}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{page.placementsCount} ocorrência(s)</Badge>
                <Badge variant={getEvidenceCoverageVariant(page.evidenceCoverage)}>
                  {formatEvidenceCoverage(page.evidenceCoverage)}
                </Badge>
              </div>
            </div>
            <div className="divide-y divide-border">
              {page.placements.map((placement) => (
                <div
                  className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_180px]"
                  key={placement.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        Ocorrência {formatPublicId(placement.publicId)}
                      </Badge>
                      <Badge variant={getDetectionStatusVariant(placement.status)}>
                        {formatDetectionStatus(placement.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 break-all text-sm leading-6 text-muted-foreground">
                      {placement.sourceUrl}
                    </p>
                  </div>
                  <div className="text-sm leading-6 text-muted-foreground">
                    <p>Confiança {formatSimilarityScore(placement.confidenceScore)}</p>
                    <p>Último achado {formatDate(placement.lastSeenAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Timeline({ adminCase }: { adminCase: AdminCaseDetails }) {
  const events = adminCase.workflow.events;

  if (events.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        Nenhum andamento foi registrado para este caso até agora.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.slice(0, 8).map((event, index) => (
        <article className="relative pl-5" key={event.id}>
          <span className="absolute left-0 top-2 size-2 rounded-full bg-foreground/70" />
          {index < events.slice(0, 8).length - 1 ? (
            <span className="absolute left-[3px] top-5 h-[calc(100%-8px)] w-px bg-border" />
          ) : null}
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatActionLabel(event.title)}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {event.actorName ?? event.actorEmail ?? "Equipe DNL"} em{" "}
              {formatDate(event.occurredAt)}
            </p>
            {event.communicationSubject ? (
              <p className="mt-2 text-sm leading-6 text-foreground">
                {event.communicationSubject}
              </p>
            ) : null}
            {event.notes ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.notes}</p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function SiteSignals({ adminCase }: { adminCase: AdminCaseDetails }) {
  const domainOwner = adminCase.siteSignals.domainOwner;

  return (
    <Section title="Sinais do site">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Domínio" value={formatDomain(adminCase.domain)} />
        <InfoItem
          label="Nome do site"
          value={adminCase.siteSignals.siteName ?? "Não informado"}
        />
        <InfoItem
          breakAll
          label="URL final"
          value={adminCase.finalUrl ?? "Não identificado"}
        />
        <InfoItem label="Cobertura" value={formatEvidenceCoverage(adminCase.evidenceCoverage)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <InfoItem
          label="CNPJ encontrado"
          value={formatList(adminCase.siteSignals.cnpjCandidates, "Nenhum CNPJ encontrado")}
        />
        <InfoItem
          label="E-mails"
          value={formatList(adminCase.siteSignals.emails, "Nenhum e-mail encontrado")}
        />
        <InfoItem
          label="Telefones"
          value={formatList(adminCase.siteSignals.phones, "Nenhum telefone encontrado")}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem
          label="Proprietário do domínio"
          value={
            domainOwner?.organization ??
            domainOwner?.name ??
            "Nenhum proprietário identificado"
          }
        />
        <InfoItem
          label="E-mail do proprietário"
          value={domainOwner?.email ?? "Nenhum e-mail do proprietário encontrado"}
        />
        <InfoItem
          label="Documento do proprietário"
          value={domainOwner?.document ?? "Nenhum documento encontrado"}
        />
        <InfoItem
          label="Fonte"
          value={formatDomainOwnerSource(domainOwner?.sourceType)}
        />
      </div>
    </Section>
  );
}

export default async function AdminCaseDetailsPage({
  params,
}: AdminCaseDetailsPageProps) {
  const resolvedParams = await params;
  const casePublicId = Number.parseInt(resolvedParams.casePublicId, 10);

  if (Number.isNaN(casePublicId)) {
    notFound();
  }

  const adminCase = await getAdminCaseDetails(resolvedParams.organizationId, casePublicId);

  if (!adminCase) {
    notFound();
  }

  const [sraDefaults, currentSoa] = await Promise.all([
    getAdminCaseSraDefaults(adminCase),
    getCurrentClientRepresentationDocument(adminCase.organization.id, "soa"),
  ]);
  const representativePlacement = adminCase.placements[0] ?? null;
  const evidencePreviewUrl =
    adminCase.matchedImageUrl ??
    adminCase.screenshotUrl ??
    representativePlacement?.latestEvidence?.matchedImageUrl ??
    representativePlacement?.latestEvidence?.screenshotUrl ??
    representativePlacement?.matchedImageUrl ??
    null;
  const casePublicIdLabel = formatPublicId(adminCase.publicId);
  const notifiedName =
    adminCase.workflow.notified.name ??
    adminCase.siteSignals.domainOwner?.organization ??
    adminCase.siteSignals.domainOwner?.name ??
    null;
  const notifiedEmail =
    adminCase.workflow.notified.email ??
    adminCase.siteSignals.domainOwner?.email ??
    adminCase.siteSignals.emails[0] ??
    null;
  const communicationDraftContext = {
    casePublicId: adminCase.publicId,
    casePublicIdLabel,
    clientName: adminCase.organization.name,
    domain: adminCase.domain,
    sourceUrl: adminCase.sourceUrl,
    finalUrl: adminCase.finalUrl,
    assetTitle: adminCase.asset.title,
    notifiedName,
    notifiedEmail,
  };
  const communicationDrafts = Object.fromEntries(
    ADMIN_CASE_COMMUNICATION_ACTIONS.map((action) => [
      action,
      buildAdminCaseCommunicationDraft(
        action,
        communicationDraftContext,
        buildCaseCommunicationSnapshot,
      ),
    ]),
  ) as Record<AdminCaseCommunicationActionKind, AdminCaseCommunicationDraft>;
  const communicationAttachments = (["rhf", "soa", "proofdata", "metadata"] as const).map(
    (kind) => {
      const document = adminCase.workflow.documents.find((item) => item.kind === kind);
      const hasStoredFile =
        Boolean(document?.downloadUrl) &&
        (document?.status === "attached" ||
          document?.status === "signed" ||
          document?.status === "sent");
      const hasSnapshot =
        (kind === "rhf" && Boolean(adminCase.latestSignedDeclaration)) ||
        (kind === "soa" && currentSoa?.status === "signed");

      return {
        id:
          document?.id ??
          (kind === "soa" && currentSoa ? `soa:${currentSoa.id}` : `missing:${kind}`),
        kind,
        title: document?.title ?? DOCUMENT_KIND_LABELS[kind],
        fileName: document?.fileName ?? null,
        source:
          kind === "soa" && !hasStoredFile && currentSoa?.status === "signed"
            ? "client_representation_document"
            : (document?.source ?? "missing"),
        status: document?.status ?? currentSoa?.status ?? "missing",
        available: hasStoredFile || hasSnapshot,
      } satisfies CommunicationAttachmentPreview;
    },
  );
  const actionContext = {
    organizationId: adminCase.organization.id,
    casePublicId: adminCase.publicId,
    casePublicIdLabel,
    sraDefaults,
    communicationDrafts,
    communicationAttachments,
  };

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Button asChild size="sm" variant="ghost" className="-ml-2 mb-2">
              <Link href="/admin/cases">
                <ArrowLeftIcon className="size-4" />
                Voltar
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                Caso {casePublicIdLabel}
              </h1>
              <Badge variant={getDetectionStatusVariant(adminCase.status)}>
                {formatDetectionStatus(adminCase.status)}
              </Badge>
              <Badge variant="outline">
                {WORKFLOW_STAGE_LABELS[adminCase.workflow.stage]}
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {adminCase.organization.name} • {formatDomain(adminCase.domain)} • Imagem{" "}
              {formatPublicId(adminCase.asset.publicId)}
            </p>
          </div>

          <AdminCaseActionMenu context={actionContext} />
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-4">
          <Section title="Análise visual">
            <div className="grid gap-4 lg:grid-cols-2">
              <ImagePanel
                title="Imagem original"
                imageUrl={adminCase.asset.primaryImageUrl}
                alt={adminCase.asset.title}
                fallback="A imagem original ainda não possui preview disponível."
              />
              <ImagePanel
                title="Imagem encontrada / evidência"
                imageUrl={evidencePreviewUrl}
                alt={`Preview do caso ${adminCase.publicId}`}
                fallback="Nenhuma evidência visual foi preservada ainda para este caso."
              />
            </div>
          </Section>

          <Section title="Resumo operacional">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoItem label="Encaminhado pelo cliente" value={formatDate(adminCase.clientReviewedAt)} />
              <InfoItem label="Última detecção" value={formatDate(adminCase.latestSeenAt)} />
              <InfoItem
                label="Capturas válidas"
                value={`${adminCase.capturedEvidenceCount}/${adminCase.placementsCount}`}
              />
              <InfoItem
                label="Cobertura"
                value={formatEvidenceCoverage(adminCase.evidenceCoverage)}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InfoItem label="Título da imagem" value={adminCase.asset.title} />
              <InfoItem
                label="Arquivo original"
                value={adminCase.asset.originalFileName ?? "Não informado"}
              />
              <InfoItem breakAll label="URL base" value={adminCase.sourceUrl} />
              <InfoItem
                breakAll
                label="Destino final"
                value={adminCase.finalUrl ?? "Não identificado"}
              />
            </div>
          </Section>

          <DocumentsPanel adminCase={adminCase} />
          <PagesPanel adminCase={adminCase} />
          <SiteSignals adminCase={adminCase} />
        </main>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="size-4 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Próximo passo
              </h2>
            </div>
            <div className="mt-4 grid gap-4">
              <InfoItem
                label="Etapa"
                value={WORKFLOW_STAGE_LABELS[adminCase.workflow.stage]}
              />
              <InfoItem
                label="Ação sugerida"
                value={adminCase.workflow.nextAction ?? "Executar ação conforme análise"}
              />
              <InfoItem
                label="Documentação"
                value={
                  adminCase.workflow.readiness.canSendDocumentation
                    ? "Base documental pronta"
                    : `${adminCase.workflow.readiness.missingDocumentationKinds.length} pendência(s)`
                }
              />
              <InfoItem
                label="Negociação"
                value={
                  adminCase.workflow.settlement
                    ? SETTLEMENT_STATUS_LABELS[adminCase.workflow.settlement.displayStatus]
                    : "Sem negociação registrada"
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold tracking-tight">Histórico</h2>
            </div>
            <div className="mt-4">
              <Timeline adminCase={adminCase} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Contexto rápido</h2>
            <div className="mt-4 grid gap-4">
              <InfoItem label="Cliente" value={adminCase.organization.name} />
              <InfoItem
                label="E-mail do cliente"
                value={adminCase.organization.billingEmail ?? "Sem e-mail de cobrança"}
              />
              <InfoItem
                label="IDs"
                value={`Caso ${casePublicIdLabel} • Imagem ${formatPublicId(adminCase.asset.publicId)}`}
              />
            </div>
            <div className="mt-4 grid gap-2">
              <Button asChild className="w-full justify-start" size="sm" variant="outline">
                <a href={adminCase.sourceUrl} target="_blank" rel="noreferrer">
                  Abrir origem
                  <ExternalLinkIcon className="size-4" />
                </a>
              </Button>
              {adminCase.finalUrl && adminCase.finalUrl !== adminCase.sourceUrl ? (
                <Button asChild className="w-full justify-start" size="sm" variant="outline">
                  <a href={adminCase.finalUrl} target="_blank" rel="noreferrer">
                    Abrir destino final
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
