import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { DetectionDetailsTabs } from "./_components/detection-details-tabs";
import { IncidentActionsPanel } from "./_components/incident-actions-panel";
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
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site não identificado";
  }

  return value;
}

function isCaseStatus(status: string) {
  return status === "unauthorized";
}

function ImagePanel(props: {
  title: string;
  imageUrl: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 ">
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
            Ocorrência {formatPublicId(detection.publicId)} / Imagem{" "}
            {formatPublicId(detection.asset.publicId)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getDetectionStatusVariant(detection.incident.incidentStatus)}>
            {formatDetectionStatus(detection.incident.incidentStatus)}
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
              fallback="A imagem principal ainda não possui preview disponível."
            />
            <ImagePanel
              title="Imagem encontrada"
              imageUrl={matchedImageUrl}
              alt={`Imagem encontrada para a ocorrência ${detection.id}`}
              fallback="A imagem encontrada ainda não foi preservada pelo worker."
            />
          </div>

          <section className="rounded-lg border border-border bg-card p-4 ">
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
          <section className="rounded-lg border border-border bg-card p-4 ">
            <IncidentActionsPanel
              detectionId={detection.id}
              currentStatus={detection.incident.incidentStatus}
            />
          </section>
        </aside>
      </div>
    </section>
  );
}
