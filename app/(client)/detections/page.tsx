import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusHelp,
  getDetectionStatusVariant,
  getEvidenceCoverageHelp,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { listDetectionIncidents } from "@/lib/dal/detections";

type DetectionsPageProps = {
  searchParams: Promise<{
    asset?: string;
    status?: string;
    evidence?: string;
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

function buildDetectionsHref(filters: {
  assetId?: string | null;
  status?: string | null;
  evidence?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (filters.assetId) {
    searchParams.set("asset", filters.assetId);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.evidence) {
    searchParams.set("evidence", filters.evidence);
  }

  const query = searchParams.toString();
  return query ? `/detections?${query}` : "/detections";
}

function filterClasses(isActive: boolean) {
  return isActive
    ? "border-primary bg-primary/10 text-foreground"
    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground";
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

export default async function DetectionsPage({ searchParams }: DetectionsPageProps) {
  const params = await searchParams;
  const [allIncidents, incidents] = await Promise.all([
    listDetectionIncidents({
      assetId: params.asset ?? null,
    }),
    listDetectionIncidents({
      assetId: params.asset ?? null,
      status: params.status ?? null,
      evidenceCoverage: params.evidence ?? null,
    }),
  ]);
  const activeAssetTitle =
    params.asset && (incidents.length > 0 || allIncidents.length > 0)
      ? (incidents[0]?.asset.title ?? allIncidents[0]?.asset.title ?? null)
      : null;
  const pendingCount = allIncidents.filter((item) => item.incidentStatus === "pending").length;
  const reviewCount = allIncidents.filter(
    (item) =>
      item.incidentStatus === "possible_infringement" ||
      item.incidentStatus === "unauthorized",
  ).length;
  const resolvedCount = allIncidents.filter(
    (item) =>
      item.incidentStatus === "authorized" ||
      item.incidentStatus === "resolved" ||
      item.incidentStatus === "ignored" ||
      item.incidentStatus === "takedown_sent",
  ).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Central de ocorrencias
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
              Revisao humana por incidente
            </h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground">
              Revise cada incidente por imagem e site. Depois, abra as paginas e
              os registros tecnicos somente quando precisar aprofundar a analise.
            </p>
          </div>

          <Button asChild variant="outline" size="lg">
            <Link href="/gallery">Voltar para galeria</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Aguardando validacao</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Exigem atencao</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{reviewCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Ja tratadas</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{resolvedCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Status
          </span>
          <Link
            href={buildDetectionsHref({
              assetId: params.asset ?? null,
              status: null,
              evidence: params.evidence ?? null,
            })}
            className={`inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(!params.status)}`}
          >
            Todos
          </Link>
          {[
            { value: "pending", label: "Aguardando validacao" },
            { value: "possible_infringement", label: "Possivel infracao" },
            { value: "unauthorized", label: "Uso nao autorizado" },
            { value: "resolved", label: "Resolvidos" },
          ].map((option) => (
            <Link
              key={option.value}
              href={buildDetectionsHref({
                assetId: params.asset ?? null,
                status: option.value,
                evidence: params.evidence ?? null,
              })}
              className={`inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(params.status === option.value)}`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Evidencia
          </span>
          <Link
            href={buildDetectionsHref({
              assetId: params.asset ?? null,
              status: params.status ?? null,
              evidence: null,
            })}
            className={`inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(!params.evidence)}`}
          >
            Todas
          </Link>
          {[
            { value: "captured", label: "Completa" },
            { value: "partial", label: "Parcial" },
            { value: "pending", label: "Pendente" },
            { value: "failed", label: "Sem captura util" },
          ].map((option) => (
            <Link
              key={option.value}
              href={buildDetectionsHref({
                assetId: params.asset ?? null,
                status: params.status ?? null,
                evidence: option.value,
              })}
              className={`inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(params.evidence === option.value)}`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {params.asset ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/25 px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Filtrando pelos incidentes da imagem{" "}
              <span className="font-medium text-foreground">
                {activeAssetTitle ?? "selecionada"}
              </span>
              .
            </p>
            <Button asChild size="sm" variant="ghost">
              <Link
                href={buildDetectionsHref({
                  status: params.status ?? null,
                  evidence: params.evidence ?? null,
                })}
              >
                Limpar filtro da imagem
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {incidents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center shadow-sm">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Nenhum incidente encontrado neste recorte
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Ajuste os filtros ou rode uma nova busca nas imagens da sua galeria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <article
              key={incident.key}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
                  {incident.asset.primaryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={incident.asset.primaryImageUrl}
                      alt={incident.asset.title}
                      className="h-full min-h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      A imagem original ainda nao possui preview disponivel.
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        {formatDomain(incident.domain)}
                      </p>
                      <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                        {incident.primaryPageTitle ?? "Uso encontrado no site"}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Imagem monitorada:{" "}
                        <Link
                          href={`/gallery/${incident.asset.id}`}
                          className="font-medium text-foreground underline underline-offset-4"
                        >
                          {incident.asset.title}
                        </Link>
                      </p>
                      {incident.statusNote ? (
                        <p className="mt-2 text-sm text-muted-foreground">{incident.statusNote}.</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5">
                        <Badge variant={getDetectionStatusVariant(incident.incidentStatus)}>
                          {formatDetectionStatus(incident.incidentStatus)}
                        </Badge>
                        <InfoTooltip content={getDetectionStatusHelp(incident.incidentStatus)} />
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Badge variant={getEvidenceCoverageVariant(incident.evidenceCoverage)}>
                          {formatEvidenceCoverage(incident.evidenceCoverage)}
                        </Badge>
                        <InfoTooltip content={getEvidenceCoverageHelp(incident.evidenceCoverage)} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-muted/25 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Paginas do site
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {incident.pagesCount} pagina(s)
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/25 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Variantes tecnicas
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {incident.placementsCount} registro(s)
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/25 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Primeira aparicao
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDate(incident.firstSeenAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/25 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Ultima aparicao
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatDate(incident.latestSeenAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button asChild>
                      <Link href={`/detections/${incident.primaryDetectionId}`}>
                        Abrir revisao do incidente
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/gallery/${incident.asset.id}`}>Ver imagem na galeria</Link>
                    </Button>
                  </div>

                  <details className="group mt-5 rounded-2xl border border-border bg-muted/20">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      <span>Ver paginas e usos encontrados</span>
                      <span className="text-xs text-muted-foreground">
                        {incident.pagesCount} pagina(s) / {incident.placementsCount} registro(s)
                      </span>
                    </summary>

                    <div className="border-t border-border px-4 py-4">
                      <div className="space-y-3">
                        {incident.pages.map((page) => (
                          <div
                            key={page.key}
                            className="rounded-2xl border border-border bg-card/70 p-4"
                          >
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
                                <Badge variant="outline">
                                  {page.placementsCount} placement(s)
                                </Badge>
                                <Badge variant={getEvidenceCoverageVariant(page.evidenceCoverage)}>
                                  {formatEvidenceCoverage(page.evidenceCoverage)}
                                </Badge>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Primeira aparicao
                                </p>
                                <p className="mt-2 text-sm font-medium text-foreground">
                                  {formatDate(page.firstSeenAt)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Ultima aparicao
                                </p>
                                <p className="mt-2 text-sm font-medium text-foreground">
                                  {formatDate(page.lastSeenAt)}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-border bg-muted/20 p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  Capturas prontas
                                </p>
                                <p className="mt-2 text-sm font-medium text-foreground">
                                  {page.capturedEvidenceCount} registro(s)
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
