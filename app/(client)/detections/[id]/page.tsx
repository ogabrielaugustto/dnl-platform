import Link from "next/link";
import { updateDetectionStatusAction } from "@/app/actions/detections";
import { DetectionDetailsTabs } from "./_components/detection-details-tabs";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  formatEvidenceStatus,
  formatSimilarityScore,
  getDetectionStatusHelp,
  getDetectionStatusVariant,
  getEvidenceCoverageHelp,
  getEvidenceCoverageVariant,
  getEvidenceStatusHelp,
  getEvidenceStatusVariant,
} from "@/lib/detection-ui";
import { getDetectionDetails } from "@/lib/dal/detections";

type DetectionDetailsPageProps = {
  params: Promise<{
    id: string;
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

function StatusActionButton({
  detectionId,
  nextStatus,
  label,
}: {
  detectionId: string;
  nextStatus: string;
  label: string;
}) {
  return (
    <form action={updateDetectionStatusAction}>
      <input type="hidden" name="detectionId" value={detectionId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <input type="hidden" name="redirectTo" value={`/detections/${detectionId}`} />
      <Button type="submit" size="sm" variant="outline">
        {label}
      </Button>
    </form>
  );
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

export default async function DetectionDetailsPage({
  params,
}: DetectionDetailsPageProps) {
  const { id } = await params;
  const detection = await getDetectionDetails(id);
  const comparisonEvidence =
    detection.evidences.find((item) => item.matchedImageUrl || item.screenshotUrl) ??
    detection.latestEvidence;

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/detections">Incidentes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{formatDomain(detection.incident.domain)}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {detection.currentPage?.pageTitle ?? "Pagina encontrada"}
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Registro tecnico</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Registro tecnico em revisao
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
              Validacao do incidente
            </h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground">
              Este detalhe mostra um placement tecnico dentro de um incidente agrupado
              por imagem e site. Use as abas para separar pagina, evidencias e dados
              do dominio sem perder o contexto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5">
              <Badge variant={getDetectionStatusVariant(detection.status)}>
                {formatDetectionStatus(detection.status)}
              </Badge>
              <InfoTooltip content={getDetectionStatusHelp(detection.status)} />
            </div>
            {detection.latestEvidence ? (
              <div className="inline-flex items-center gap-1.5">
                <Badge variant={getEvidenceStatusVariant(detection.latestEvidence.captureStatus)}>
                  Evidencia: {formatEvidenceStatus(detection.latestEvidence.captureStatus)}
                </Badge>
                <InfoTooltip
                  content={getEvidenceStatusHelp(detection.latestEvidence.captureStatus)}
                />
              </div>
            ) : null}
            <div className="inline-flex items-center gap-1.5">
              <Badge variant={getEvidenceCoverageVariant(detection.incident.evidenceCoverage)}>
                {formatEvidenceCoverage(detection.incident.evidenceCoverage)}
              </Badge>
              <InfoTooltip
                content={getEvidenceCoverageHelp(detection.incident.evidenceCoverage)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/detections">Voltar para incidentes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/gallery/${detection.asset.id}`}>Abrir imagem na galeria</Link>
          </Button>
          <Button asChild>
            <a href={detection.sourceUrl} target="_blank" rel="noreferrer">
              Abrir pagina encontrada
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-muted/25 p-4">
              <p className="text-sm text-muted-foreground">Similaridade</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {formatSimilarityScore(detection.confidenceScore)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/25 p-4">
              <p className="text-sm text-muted-foreground">Pagina atual</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {detection.currentPage?.placementsCount ?? 1} placement(s)
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/25 p-4">
              <p className="text-sm text-muted-foreground">Incidente no site</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {detection.incident.pagesCount} pagina(s)
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/25 p-4">
              <p className="text-sm text-muted-foreground">Ultima aparicao</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {formatDate(detection.lastSeenAt)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <DetectionDetailsTabs
              assetTitle={detection.asset.title}
              assetImageUrl={detection.asset.primaryImageUrl}
              detectionId={detection.id}
              currentSourceUrl={detection.sourceUrl}
              matchedImageUrl={
                comparisonEvidence?.matchedImageUrl ?? detection.matchedImageUrl ?? null
              }
              matchedImageSourceUrl={
                comparisonEvidence?.matchedImageSourceUrl ?? detection.matchedImageUrl ?? null
              }
              siteSnapshot={comparisonEvidence?.siteSnapshot ?? null}
              evidences={detection.evidences}
              incident={detection.incident}
              currentPage={detection.currentPage}
            />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Decisao
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Uma deteccao nao significa automaticamente infracao. Escolha o
              status que melhor representa a analise humana deste registro.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusActionButton
                detectionId={detection.id}
                nextStatus="possible_infringement"
                label="Possivel infracao"
              />
              <StatusActionButton
                detectionId={detection.id}
                nextStatus="unauthorized"
                label="Uso nao autorizado"
              />
              <StatusActionButton
                detectionId={detection.id}
                nextStatus="authorized"
                label="Uso autorizado"
              />
              <StatusActionButton
                detectionId={detection.id}
                nextStatus="resolved"
                label="Resolvido"
              />
              <StatusActionButton
                detectionId={detection.id}
                nextStatus="ignored"
                label="Ignorar"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Contexto do incidente
            </h2>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground">
              <p>
                O cliente revisa este caso como um incidente do site{" "}
                <span className="text-foreground">
                  {formatDomain(detection.incident.domain)}
                </span>
                . Este registro tecnico faz parte desse agrupamento.
              </p>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Pagina encontrada
                </p>
                <a
                  href={detection.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block break-all text-sm text-foreground underline underline-offset-4"
                >
                  {detection.sourceUrl}
                </a>
                {detection.pageTitle ? (
                  <p className="mt-3">
                    Titulo detectado: <span className="text-foreground">{detection.pageTitle}</span>
                  </p>
                ) : null}
                {detection.reviewedByName ? (
                  <p className="mt-2">
                    Ultima revisao por{" "}
                    <span className="text-foreground">{detection.reviewedByName}</span>.
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Incidente agrupado
                  </span>
                  <Badge variant="outline">{detection.incident.pagesCount} pagina(s)</Badge>
                </div>
                <p className="mt-3 text-foreground">
                  {detection.incident.placementsCount} placement(s) tecnicos
                  distribuidos no mesmo site.
                </p>
                <p className="mt-2">
                  Primeira aparicao em{" "}
                  <span className="text-foreground">
                    {formatDate(detection.incident.firstSeenAt)}
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
