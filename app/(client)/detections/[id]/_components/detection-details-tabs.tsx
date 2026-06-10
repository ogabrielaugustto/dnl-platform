"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DetectionEvidenceListItem,
  DetectionIncidentListItem,
  DetectionIncidentPageGroup,
  DetectionSiteSnapshot,
} from "@/lib/dal/detections";
import {
  formatDetectionMatchType,
  formatDetectionStatus,
  formatEvidenceCoverage,
  formatEvidenceStatus,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
  getEvidenceStatusVariant,
} from "@/lib/detection-ui";
import { formatPublicId } from "@/lib/public-id";

type DetectionDetailsTabsProps = {
  detectionId: string;
  currentSourceUrl: string;
  matchedImageSourceUrl: string | null;
  siteSnapshot: DetectionSiteSnapshot | null;
  evidences: DetectionEvidenceListItem[];
  incident: DetectionIncidentListItem;
  currentPage: DetectionIncidentPageGroup | null;
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

function ImagePanel(props: {
  title: string;
  imageUrl: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <h3 className="text-sm font-medium text-foreground">{props.title}</h3>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
        {props.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.imageUrl}
            alt={props.alt}
            className="h-full min-h-64 w-full object-contain"
          />
        ) : (
          <div className="flex min-h-64 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {props.fallback}
          </div>
        )}
      </div>
    </div>
  );
}

function isCaseStatus(status: string) {
  return status === "unauthorized";
}

function SiteInfoList(props: { label: string; values: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {props.label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.values.length > 0 ? (
          props.values.map((value) => (
            <Badge key={value} variant="outline" className="max-w-full break-all text-left">
              {value}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{props.emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

export function DetectionDetailsTabs({
  detectionId,
  currentSourceUrl,
  matchedImageSourceUrl,
  siteSnapshot,
  evidences,
  incident,
  currentPage,
}: DetectionDetailsTabsProps) {
  const isCase = isCaseStatus(incident.incidentStatus);

  return (
    <Tabs defaultValue="analysis" className="w-full">
      <TabsList
        variant="line"
        className="w-full justify-start overflow-x-auto border-b border-border p-0"
      >
        <TabsTrigger value="analysis" className="flex-none px-3 py-2">
          Analise
        </TabsTrigger>
        <TabsTrigger value="pages" className="flex-none px-3 py-2">
          Paginas
        </TabsTrigger>
        <TabsTrigger value="evidence" className="flex-none px-3 py-2">
          Evidencias
        </TabsTrigger>
        <TabsTrigger value="site" className="flex-none px-3 py-2">
          Site
        </TabsTrigger>
      </TabsList>

      <TabsContent value="analysis" className="pt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Dominio
            </p>
            <p className="mt-2 break-all text-sm font-medium text-foreground">
              {incident.domain || "Nao identificado"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {isCase ? "Caso" : "Grupo de ocorrencias"}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatPublicId(isCase ? incident.casePublicId : incident.publicId)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Evidencias
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatEvidenceCoverage(incident.evidenceCoverage)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Status atual
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {formatDetectionStatus(incident.incidentStatus)}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card/60 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            URL em revisao
          </p>
          <a
            href={currentSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block break-all text-sm text-foreground underline underline-offset-4"
          >
            {currentSourceUrl}
          </a>
          {matchedImageSourceUrl ? (
            <p className="mt-2 break-all text-sm text-muted-foreground">
              Imagem preservada: {matchedImageSourceUrl}
            </p>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="pages" className="pt-5">
        <div className="space-y-3">
          {incident.pages.map((page) => (
            <div key={page.key} className="rounded-lg border border-border bg-card/60 p-4">
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
                <div className="flex flex-wrap items-center gap-2">
                  {currentPage?.key === page.key ? (
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
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/25 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        Ocorrencia {formatPublicId(placement.publicId)}
                      </Badge>
                      <Badge variant={getDetectionStatusVariant(placement.status)}>
                        {formatDetectionStatus(placement.status)}
                      </Badge>
                      <Badge variant="outline">
                        {formatDetectionMatchType(placement.matchType)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(placement.lastSeenAt)}
                      </span>
                    </div>
                    {placement.id === detectionId ? (
                      <span className="text-sm font-medium text-foreground">Em analise</span>
                    ) : (
                      <Link
                        href={`/detections/${placement.id}`}
                        className="text-sm font-medium text-foreground underline underline-offset-4"
                      >
                        Abrir
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="evidence" className="pt-5">
        <div className="space-y-4">
          {evidences.length === 0 ? (
            <div className="rounded-lg border border-border bg-card/60 p-4">
              <p className="text-sm text-muted-foreground">
                Ainda nao existe evidencia cadastrada para este registro.
              </p>
            </div>
          ) : (
            evidences.map((evidence) => (
              <div key={evidence.id} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Captura de {formatDate(evidence.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      URL final: {evidence.finalUrl ?? "Nao informada"}
                    </p>
                  </div>
                  <Badge variant={getEvidenceStatusVariant(evidence.captureStatus)}>
                    {formatEvidenceStatus(evidence.captureStatus)}
                  </Badge>
                </div>

                {evidence.captureErrorMessage ? (
                  <p className="mt-3 text-sm text-destructive">
                    {evidence.captureErrorMessage}
                  </p>
                ) : null}

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
              </div>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="site" className="pt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Dominio
            </p>
            <p className="mt-2 break-all text-sm font-medium text-foreground">
              {siteSnapshot?.domain ?? "Nao identificado"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Nome do site
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {siteSnapshot?.siteName ?? "Nao informado"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Titulo
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {siteSnapshot?.title ?? "Nao informado"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Registro
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {siteSnapshot?.rdap?.registrar ?? "Nao informado"}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-border bg-card/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            URL final analisada
          </p>
          <p className="mt-2 break-all text-sm text-foreground">
            {siteSnapshot?.finalUrl ?? "Nao informado"}
          </p>
          {siteSnapshot?.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{siteSnapshot.description}</p>
          ) : null}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          <SiteInfoList
            label="CNPJ encontrados"
            values={siteSnapshot?.cnpjCandidates ?? []}
            emptyLabel="Nenhum CNPJ encontrado."
          />
          <SiteInfoList
            label="E-mails"
            values={siteSnapshot?.emails ?? []}
            emptyLabel="Nenhum e-mail encontrado."
          />
          <SiteInfoList
            label="Telefones"
            values={siteSnapshot?.phones ?? []}
            emptyLabel="Nenhum telefone encontrado."
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
