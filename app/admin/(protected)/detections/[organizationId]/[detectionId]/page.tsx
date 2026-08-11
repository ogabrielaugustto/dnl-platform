import Link from "next/link";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { updateAdminDetectionStatusAction } from "@/app/actions/admin-detections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { getAdminDetectionDetails } from "@/lib/dal/admin-detections";
import { formatPublicId } from "@/lib/public-id";

type AdminDetectionDetailsPageProps = {
  params: Promise<{
    organizationId: string;
    detectionId: string;
  }>;
};

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

function DecisionButton({
  detectionId,
  organizationId,
  nextStatus,
  label,
  reason,
  variant = "outline",
}: {
  detectionId: string;
  organizationId: string;
  nextStatus: string;
  label: string;
  reason?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  return (
    <form action={updateAdminDetectionStatusAction}>
      <input type="hidden" name="detectionId" value={detectionId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <input type="hidden" name="scope" value="incident" />
      <input
        type="hidden"
        name="redirectTo"
        value={`/admin/detections/${organizationId}/${detectionId}`}
      />
      {reason ? <input type="hidden" name="reason" value={reason} /> : null}
      <Button type="submit" size="sm" variant={variant} className="w-full justify-start">
        {label}
      </Button>
    </form>
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
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={alt} className="h-full min-h-72 w-full object-contain" />
        ) : (
          <div className="flex min-h-72 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AdminDetectionDetailsPage({
  params,
}: AdminDetectionDetailsPageProps) {
  const { organizationId, detectionId } = await params;
  const detection = await getAdminDetectionDetails(organizationId, detectionId);
  const comparisonEvidence =
    detection.evidences.find((item) => item.matchedImageUrl || item.screenshotUrl) ??
    detection.latestEvidence;
  const matchedImageUrl =
    comparisonEvidence?.matchedImageUrl ??
    comparisonEvidence?.screenshotUrl ??
    detection.matchedImageUrl ??
    null;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <Button asChild size="sm" variant="ghost" className="-ml-2 mb-2">
            <Link href="/admin/detections">
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Ocorrencia {formatPublicId(detection.publicId)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliente {detection.organization.name} • Caso {formatPublicId(detection.casePublicId)} •
            Imagem {formatPublicId(detection.asset.publicId)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getDetectionStatusVariant(detection.incident.incidentStatus)}>
            {formatDetectionStatus(detection.incident.incidentStatus)}
          </Badge>
          <Badge variant={getEvidenceCoverageVariant(detection.incident.evidenceCoverage)}>
            {formatEvidenceCoverage(detection.incident.evidenceCoverage)}
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ImagePanel
              title="Imagem original"
              imageUrl={detection.asset.primaryImageUrl}
              alt={detection.asset.title}
              fallback="A imagem principal ainda nao possui preview disponivel."
            />
            <ImagePanel
              title="Imagem encontrada"
              imageUrl={matchedImageUrl}
              alt={`Imagem encontrada para a ocorrencia ${detection.id}`}
              fallback="A imagem encontrada ainda nao foi preservada pelo worker."
            />
          </div>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock label="Dominio" value={formatDomain(detection.incident.domain)} />
              <InfoBlock
                label="Ultimo achado"
                value={formatDate(detection.lastSeenAt)}
              />
              <InfoBlock
                label="Capturas"
                value={`${detection.incident.capturedEvidenceCount}/${detection.incident.placementsCount}`}
              />
              <InfoBlock
                label="Responsavel"
                value={detection.reviewedByName ?? "Sem responsavel registrado"}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Paginas do grupo</h2>
            <div className="mt-4 space-y-3">
              {detection.incident.pages.map((page) => (
                <article key={page.key} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {page.pageTitle ?? "Pagina sem titulo identificado"}
                      </p>
                      <a
                        href={page.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm text-muted-foreground underline underline-offset-4"
                      >
                        {page.sourceUrl}
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detection.currentPage?.key === page.key ? (
                        <Badge variant="default">Atual</Badge>
                      ) : null}
                      <Badge variant="outline">{page.placementsCount} registro(s)</Badge>
                      <Badge variant={getEvidenceCoverageVariant(page.evidenceCoverage)}>
                        {formatEvidenceCoverage(page.evidenceCoverage)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {page.placements.map((placement) => (
                      <div
                        key={placement.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-3 py-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              Ocorrencia {formatPublicId(placement.publicId)}
                            </Badge>
                            <Badge variant={getDetectionStatusVariant(placement.status)}>
                              {formatDetectionStatus(placement.status)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Ultimo achado {formatDate(placement.lastSeenAt)}
                          </p>
                        </div>
                        {placement.id === detection.id ? (
                          <span className="text-sm font-medium text-foreground">Em analise</span>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/detections/${organizationId}/${placement.id}`}>
                              Abrir
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Evidencias</h2>
            <div className="mt-4 space-y-4">
              {detection.evidences.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Ainda nao existe evidencia cadastrada para este registro.
                </div>
              ) : (
                detection.evidences.map((evidence) => (
                  <article key={evidence.id} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Captura de {formatDate(evidence.createdAt)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          URL final: {evidence.finalUrl ?? "Nao informada"}
                        </p>
                      </div>
                      <Badge variant={getEvidenceCoverageVariant(
                        evidence.captureStatus === "captured" ? "captured" : "pending",
                      )}>
                        {evidence.captureStatus}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <ImagePanel
                        title="Imagem encontrada"
                        imageUrl={evidence.matchedImageUrl}
                        alt={`Imagem encontrada da evidencia ${evidence.id}`}
                        fallback="Sem imagem preservada nesta captura."
                      />
                      <ImagePanel
                        title="Screenshot da pagina"
                        imageUrl={evidence.screenshotUrl}
                        alt={`Screenshot da evidencia ${evidence.id}`}
                        fallback="Sem screenshot salvo nesta captura."
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Acao admin</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A decisao abaixo vale para toda a imagem neste dominio do cliente.
            </p>
            <div className="mt-4 grid gap-2">
              <DecisionButton
                detectionId={detection.id}
                organizationId={organizationId}
                nextStatus="possible_infringement"
                label="Possivel infracao"
              />
              <DecisionButton
                detectionId={detection.id}
                organizationId={organizationId}
                nextStatus="unauthorized"
                label="Uso nao autorizado"
                variant="default"
              />
              <DecisionButton
                detectionId={detection.id}
                organizationId={organizationId}
                nextStatus="takedown_sent"
                label="Notificacao enviada"
              />
              <DecisionButton
                detectionId={detection.id}
                organizationId={organizationId}
                nextStatus="resolved"
                label="Resolvido"
                variant="secondary"
              />
              <DecisionButton
                detectionId={detection.id}
                organizationId={organizationId}
                nextStatus="authorized"
                label="Uso autorizado"
              />
              <DecisionButton
                detectionId={detection.id}
                organizationId={organizationId}
                nextStatus="ignored"
                label="Ignorar"
                reason="admin_ignored"
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Cliente</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoBlock label="Organizacao" value={detection.organization.name} />
              <InfoBlock
                label="E-mail"
                value={detection.organization.billingEmail ?? "Sem e-mail de cobranca"}
              />
              <InfoBlock
                label="Documento"
                value={detection.organization.document ?? "Sem documento"}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Referencias</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoBlock label="Imagem" value={detection.asset.title} />
              <InfoBlock label="URL atual" value={detection.sourceUrl} />
              <Button asChild className="w-full" size="sm" variant="outline">
                <a href={detection.sourceUrl} target="_blank" rel="noreferrer">
                  Abrir pagina encontrada
                  <ExternalLinkIcon className="size-4" />
                </a>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
