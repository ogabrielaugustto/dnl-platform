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

type DetectionDetailsTabsProps = {
  assetTitle: string;
  assetImageUrl: string | null;
  detectionId: string;
  currentSourceUrl: string;
  matchedImageUrl: string | null;
  matchedImageSourceUrl: string | null;
  siteSnapshot: DetectionSiteSnapshot | null;
  evidences: DetectionEvidenceListItem[];
  incident: DetectionIncidentListItem;
  currentPage: DetectionIncidentPageGroup | null;
};

function buildEvidenceLabel(value: string | null) {
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
  subtitle: string;
  imageUrl: string | null;
  alt: string;
  fallback: string;
  unoptimized?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card/60 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {props.subtitle}
      </p>
      <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
        {props.title}
      </h3>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/30">
        {props.imageUrl ? (
          props.imageUrl.startsWith("/api/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.imageUrl}
              alt={props.alt}
              className="h-full min-h-80 w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.imageUrl}
              alt={props.alt}
              className="h-full min-h-80 w-full object-contain"
            />
          )
        ) : (
          <div className="flex min-h-80 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {props.fallback}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteInfoList(props: { label: string; values: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
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

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-sm font-medium text-foreground">{value}</p>
      {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function DetectionDetailsTabs({
  assetTitle,
  assetImageUrl,
  detectionId,
  currentSourceUrl,
  matchedImageUrl,
  matchedImageSourceUrl,
  siteSnapshot,
  evidences,
  incident,
  currentPage,
}: DetectionDetailsTabsProps) {
  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList
        variant="line"
        className="w-full justify-start overflow-x-auto border-b border-border p-0"
      >
        <TabsTrigger value="summary" className="flex-none px-4 py-3">
          Resumo
        </TabsTrigger>
        <TabsTrigger value="uses" className="flex-none px-4 py-3">
          Usos do site
        </TabsTrigger>
        <TabsTrigger value="evidence" className="flex-none px-4 py-3">
          Evidencias
        </TabsTrigger>
        <TabsTrigger value="owner" className="flex-none px-4 py-3">
          Dados do site
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="pt-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <ImagePanel
            title="Sua imagem original"
            subtitle={assetTitle}
            imageUrl={assetImageUrl}
            alt={assetTitle}
            fallback="A imagem principal ainda nao possui preview disponivel."
          />

          <ImagePanel
            title="Imagem encontrada"
            subtitle="Registro preservado do uso"
            imageUrl={matchedImageUrl}
            alt={`Imagem encontrada para a ocorrencia ${detectionId}`}
            fallback="A imagem encontrada ainda nao foi preservada pelo worker."
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            label="Site"
            value={incident.domain || "Nao identificado"}
            helper={`${incident.pagesCount} pagina(s) e ${incident.placementsCount} placement(s) no incidente.`}
          />
          <SummaryMetric
            label="Pagina atual"
            value={currentPage?.pageTitle ?? "Pagina sem titulo identificado"}
            helper={`Esta pagina concentra ${currentPage?.placementsCount ?? 1} placement(s) tecnico(s).`}
          />
          <SummaryMetric
            label="Cobertura do incidente"
            value={formatEvidenceCoverage(incident.evidenceCoverage)}
            helper={
              incident.statusNote
                ? incident.statusNote
                : `${incident.capturedEvidenceCount} registro(s) com evidencia capturada.`
            }
          />
          <SummaryMetric
            label="Registro tecnico"
            value={formatDetectionStatus(
              currentPage?.placements.find((placement) => placement.id === detectionId)?.status ??
                "pending",
            )}
            helper="Este detalhe continua sendo o placement tecnico usado para auditoria e rastreabilidade."
          />
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            URL da pagina em revisao
          </p>
          <a
            href={currentSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all text-sm text-foreground underline underline-offset-4"
          >
            {currentSourceUrl}
          </a>

          {matchedImageSourceUrl ? (
            <p className="mt-3 break-all text-sm text-muted-foreground">
              Origem da imagem preservada: {matchedImageSourceUrl}
            </p>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="uses" className="pt-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getDetectionStatusVariant(incident.incidentStatus)}>
                {formatDetectionStatus(incident.incidentStatus)}
              </Badge>
              <Badge variant={getEvidenceCoverageVariant(incident.evidenceCoverage)}>
                {formatEvidenceCoverage(incident.evidenceCoverage)}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Este incidente agrupa a mesma imagem neste site. Cada bloco abaixo
              representa uma pagina/uso, e cada linha interna representa um
              placement tecnico encontrado pelo worker.
            </p>
          </div>

          {incident.pages.map((page) => (
            <div key={page.key} className="rounded-2xl border border-border bg-card/60 p-4">
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
                    <Badge variant="default">Pagina atual</Badge>
                  ) : null}
                  <Badge variant="outline">{page.placementsCount} placement(s)</Badge>
                  <Badge variant={getEvidenceCoverageVariant(page.evidenceCoverage)}>
                    {formatEvidenceCoverage(page.evidenceCoverage)}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {page.placements.map((placement) => (
                  <div
                    key={placement.id}
                    className="rounded-2xl border border-border bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getDetectionStatusVariant(placement.status)}>
                            {formatDetectionStatus(placement.status)}
                          </Badge>
                          <Badge variant="outline">
                            {formatDetectionMatchType(placement.matchType)}
                          </Badge>
                          {placement.id === detectionId ? (
                            <Badge variant="secondary">Registro atual</Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Ultima aparicao em {buildEvidenceLabel(placement.lastSeenAt)}
                        </p>
                      </div>

                      {placement.id === detectionId ? (
                        <span className="text-sm font-medium text-foreground">Em revisao</span>
                      ) : (
                        <Link
                          href={`/detections/${placement.id}`}
                          className="text-sm font-medium text-foreground underline underline-offset-4"
                        >
                          Abrir registro
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="evidence" className="pt-6">
        <div className="space-y-3">
          {evidences.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <p className="text-sm text-muted-foreground">
                Ainda nao existe evidencia cadastrada para este registro tecnico.
              </p>
            </div>
          ) : (
            evidences.map((evidence) => (
              <div key={evidence.id} className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Captura de {buildEvidenceLabel(evidence.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Status: {formatEvidenceStatus(evidence.captureStatus)}
                    </p>
                  </div>
                  <Badge variant={getEvidenceStatusVariant(evidence.captureStatus)}>
                    {formatEvidenceStatus(evidence.captureStatus)}
                  </Badge>
                </div>

                {evidence.finalUrl ? (
                  <a
                    href={evidence.finalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block break-all text-sm text-muted-foreground underline underline-offset-4"
                  >
                    {evidence.finalUrl}
                  </a>
                ) : null}

                {evidence.captureErrorMessage ? (
                  <p className="mt-3 text-sm text-destructive">{evidence.captureErrorMessage}</p>
                ) : null}

                <div className="mt-4">
                  <ImagePanel
                    title="Imagem encontrada preservada"
                    subtitle="Arquivo salvo pelo worker"
                    imageUrl={evidence.matchedImageUrl}
                    alt={`Imagem encontrada da evidencia ${evidence.id}`}
                    fallback="Sem imagem preservada nesta captura."
                  />
                </div>

                <details className="group mt-4 rounded-2xl border border-border bg-muted/20">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span>Abrir screenshot da pagina</span>
                    <span className="text-xs text-muted-foreground">
                      {evidence.screenshotUrl ? "Contexto visual disponivel" : "Sem screenshot"}
                    </span>
                  </summary>

                  <div className="border-t border-border p-4">
                    <ImagePanel
                      title="Screenshot da pagina"
                      subtitle="Contexto visual"
                      imageUrl={evidence.screenshotUrl}
                      alt={`Screenshot da evidencia ${evidence.id}`}
                      fallback="Sem screenshot salvo nesta captura."
                    />
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="owner" className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dominio</p>
            <p className="mt-3 break-all text-sm font-medium text-foreground">
              {siteSnapshot?.domain ?? "Nao identificado"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Nome do site
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {siteSnapshot?.siteName ?? "Nao informado"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Titulo da pagina
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {siteSnapshot?.title ?? "Nao informado"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Registro / RDAP
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {siteSnapshot?.rdap?.registrar ?? "Nao informado"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            URL final analisada
          </p>
          <p className="mt-3 break-all text-sm text-foreground">
            {siteSnapshot?.finalUrl ?? "Nao informado"}
          </p>
          {siteSnapshot?.description ? (
            <p className="mt-3 text-sm text-muted-foreground">{siteSnapshot.description}</p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <SiteInfoList
            label="CNPJ encontrados"
            values={siteSnapshot?.cnpjCandidates ?? []}
            emptyLabel="Nenhum CNPJ encontrado no snapshot."
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

        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-2xl font-semibold tracking-tight">
              Entidades do registro
            </h3>
            <Badge variant="outline">{siteSnapshot?.rdap?.entities.length ?? 0}</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {siteSnapshot?.rdap?.entities.length ? (
              siteSnapshot.rdap.entities.map((entity, index) => (
                <div
                  key={`${entity.handle ?? "entity"}-${index}`}
                  className="rounded-2xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {entity.organization ?? entity.name ?? entity.handle ?? "Entidade"}
                      </p>
                      {entity.email ? (
                        <p className="mt-1 text-sm text-muted-foreground">{entity.email}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entity.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                O worker ainda nao conseguiu identificar dados de registro suficientes
                para este dominio.
              </p>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
