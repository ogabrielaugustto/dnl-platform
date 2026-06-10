import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { updateDetectionStatusAction } from "@/app/actions/detections";
import { DetectionDetailsTabs } from "./_components/detection-details-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { getDetectionDetails } from "@/lib/dal/detections";
import { formatPublicId } from "@/lib/public-id";

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

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

function isCaseStatus(status: string) {
  return status === "unauthorized";
}

function DecisionButton({
  detectionId,
  nextStatus,
  label,
  reason,
  variant = "outline",
}: {
  detectionId: string;
  nextStatus: string;
  label: string;
  reason?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  return (
    <form action={updateDetectionStatusAction}>
      <input type="hidden" name="detectionId" value={detectionId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <input type="hidden" name="scope" value="incident" />
      <input type="hidden" name="redirectTo" value={`/detections/${detectionId}`} />
      {reason ? <input type="hidden" name="reason" value={reason} /> : null}
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

function ImagePanel(props: {
  title: string;
  imageUrl: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-medium text-foreground">{props.title}</h2>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
        {props.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.imageUrl}
            alt={props.alt}
            className="h-full min-h-72 w-full object-contain"
          />
        ) : (
          <div className="flex min-h-72 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {props.fallback}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function DetectionDetailsPage({
  params,
}: DetectionDetailsPageProps) {
  const { id } = await params;
  const detection = await getDetectionDetails(id);
  const comparisonEvidence =
    detection.evidences.find((item) => item.matchedImageUrl || item.screenshotUrl) ??
    detection.latestEvidence;
  const matchedImageUrl =
    comparisonEvidence?.matchedImageUrl ??
    comparisonEvidence?.screenshotUrl ??
    detection.matchedImageUrl ??
    null;
  const isCase = isCaseStatus(detection.incident.incidentStatus);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <Button asChild size="sm" variant="ghost" className="-ml-2 mb-2">
            <Link href="/detections">
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Validar uso encontrado
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCase
              ? `Caso ${formatPublicId(detection.casePublicId)} / `
              : ""}
            Ocorrencia {formatPublicId(detection.publicId)} / Imagem{" "}
            {formatPublicId(detection.asset.publicId)}
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
            <DetectionDetailsTabs
              detectionId={detection.id}
              currentSourceUrl={detection.sourceUrl}
              matchedImageSourceUrl={
                comparisonEvidence?.matchedImageSourceUrl ?? detection.matchedImageUrl ?? null
              }
              siteSnapshot={comparisonEvidence?.siteSnapshot ?? null}
              evidences={detection.evidences}
              incident={detection.incident}
              currentPage={detection.currentPage}
            />
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Decisao do grupo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A decisao abaixo vale para esta imagem neste dominio.
            </p>
            <div className="mt-4 grid gap-2">
              <DecisionButton
                detectionId={detection.id}
                nextStatus="ignored"
                label="Nao e a mesma imagem"
                reason="not_same_image"
              />
              <DecisionButton
                detectionId={detection.id}
                nextStatus="authorized"
                label="Uso autorizado"
              />
              <DecisionButton
                detectionId={detection.id}
                nextStatus="unauthorized"
                label="Uso nao autorizado"
                variant="default"
              />
              <DecisionButton
                detectionId={detection.id}
                nextStatus="pending"
                label="Revisar depois"
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Site autorizado
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A lista de dominios autorizados entra em uma proxima etapa. Por enquanto,
              marque o grupo como uso autorizado.
            </p>
            <Button className="mt-4 w-full" disabled size="sm" variant="outline">
              Adicionar dominio autorizado
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Contexto
            </h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em]">
                  Imagem
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPublicId(detection.asset.publicId)}
                </p>
                <Link
                  href="/gallery"
                  className="mt-1 block text-foreground underline underline-offset-4"
                >
                  {detection.asset.title}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em]">
                  {isCase ? "Caso / ocorrencia" : "Ocorrencia"}
                </p>
                <p className="mt-1 text-foreground">
                  {isCase
                    ? `${formatPublicId(detection.casePublicId)} / `
                    : ""}
                  {formatPublicId(detection.publicId)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em]">
                  Dominio
                </p>
                <p className="mt-1 break-all text-foreground">
                  {formatDomain(detection.incident.domain)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em]">
                  Ultimo achado
                </p>
                <p className="mt-1 text-foreground">{formatDate(detection.lastSeenAt)}</p>
              </div>
              <Button asChild className="w-full" size="sm" variant="outline">
                <a href={detection.sourceUrl} target="_blank" rel="noreferrer">
                  Abrir pagina encontrada
                </a>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
