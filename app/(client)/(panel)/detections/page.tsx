import Link from "next/link";
import { LiveWorkflowRefresh } from "@/app/(client)/(panel)/_components/live-workflow-refresh";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listOrganizationAssets,
  requireActiveOrganization,
} from "@/lib/dal/assets";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { listDetectionIncidents } from "@/lib/dal/detections";
import { type DetectionSourceScope } from "@/lib/dal/detection-source-scope";
import { formatPublicId } from "@/lib/public-id";

type DetectionsPageProps = {
  searchParams: Promise<{
    asset?: string;
    status?: string;
    nationality?: string;
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
  nationality?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (filters.assetId) {
    searchParams.set("asset", filters.assetId);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.nationality) {
    searchParams.set("nationality", filters.nationality);
  }

  const query = searchParams.toString();
  return query ? `/detections?${query}` : "/detections";
}

function filterClasses(isActive: boolean) {
  return isActive
    ? "border-primary bg-primary/10 text-foreground"
    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground";
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

function parseNationalityFilter(value: string | null | undefined): DetectionSourceScope | null {
  if (value === "national" || value === "international" || value === "unknown") {
    return value;
  }

  return null;
}

function formatSourceScope(value: DetectionSourceScope) {
  switch (value) {
    case "national":
      return "BR Nacional";
    case "international":
      return "Internacional";
    case "unknown":
      return "Origem indefinida";
  }
}

function sourceScopeBadgeClasses(value: DetectionSourceScope) {
  switch (value) {
    case "national":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "international":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "unknown":
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

export default async function DetectionsPage({ searchParams }: DetectionsPageProps) {
  const params = await searchParams;
  const { organizationId } = await requireActiveOrganization();
  const effectiveStatus =
    !params.status || params.status === "all"
      ? params.status === "all"
        ? null
        : "pending"
      : params.status;
  const effectiveNationality = parseNationalityFilter(params.nationality);
  const [allIncidents, incidents, assets] = await Promise.all([
    listDetectionIncidents({
      assetId: params.asset ?? null,
    }),
    listDetectionIncidents({
      assetId: params.asset ?? null,
      status: effectiveStatus,
      sourceScope: effectiveNationality,
    }),
    listOrganizationAssets(),
  ]);
  const activeAssetLabel =
    params.asset && (incidents.length > 0 || allIncidents.length > 0)
      ? `Imagem ${formatPublicId(incidents[0]?.asset.publicId ?? allIncidents[0]?.asset.publicId)}`
      : null;
  const pendingCount = allIncidents.filter((item) => item.incidentStatus === "pending").length;
  const hasActiveWork = assets.some(
    (asset) =>
      asset.statusSummary.kind === "pending" ||
      asset.statusSummary.kind === "processing",
  );

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Ocorrencias
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Fila de validacao
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount} grupo(s) aguardando decisao humana.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshDataButton size="sm" />
          <Button asChild size="sm" variant="outline">
            <Link href="/gallery">Galeria</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Status
          </span>
          {[
            { value: "pending", label: "Pendentes" },
            { value: "unauthorized", label: "Possiveis casos" },
            { value: "authorized", label: "Autorizados" },
            { value: "ignored", label: "Ignorados" },
            { value: "all", label: "Todos" },
          ].map((option) => (
            <Link
              key={option.value}
              href={buildDetectionsHref({
                assetId: params.asset ?? null,
                status: option.value,
                nationality: params.nationality ?? null,
              })}
              className={`inline-flex rounded-full border px-3 py-1 text-sm transition-colors ${filterClasses((params.status ?? "pending") === option.value)}`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Nacionalidade
          </span>
          {[
            { value: "all", label: "Todas" },
            { value: "national", label: "Nacionais" },
            { value: "international", label: "Internacionais" },
            { value: "unknown", label: "Indefinidas" },
          ].map((option) => (
            <Link
              key={option.value}
              href={buildDetectionsHref({
                assetId: params.asset ?? null,
                status: params.status ?? null,
                nationality: option.value === "all" ? null : option.value,
              })}
              className={`inline-flex rounded-full border px-3 py-1 text-sm transition-colors ${filterClasses((params.nationality ?? "all") === option.value)}`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {params.asset ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/35 px-3 py-2 text-sm">
            <p className="text-muted-foreground">
              Imagem:{" "}
              <span className="font-medium text-foreground">
                {activeAssetLabel ?? "selecionada"}
              </span>
            </p>
            <Button asChild size="sm" variant="ghost">
              <Link
                href={buildDetectionsHref({
                  status: params.status ?? null,
                  nationality: params.nationality ?? null,
                })}
              >
                Limpar filtro
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <LiveWorkflowRefresh
        organizationId={organizationId}
        hasActiveWork={hasActiveWork}
      />

      {incidents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center ">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Nenhuma ocorrencia neste recorte
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou revise a galeria para acompanhar as imagens monitoradas.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="hidden grid-cols-[90px_minmax(220px,1.4fr)_minmax(180px,1fr)_110px_130px_140px_110px] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground xl:grid">
            <span>ID</span>
            <span>Obra</span>
            <span>Dominio</span>
            <span>Paginas</span>
            <span>Evidencias</span>
            <span>Ultimo achado</span>
            <span className="text-right">Acao</span>
          </div>

          <div className="divide-y divide-border">
            {incidents.map((incident) => (
              <article
                key={incident.key}
                className="grid gap-3 px-4 py-4 xl:grid-cols-[90px_minmax(220px,1.4fr)_minmax(180px,1fr)_110px_130px_140px_110px] xl:items-center"
              >
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground xl:hidden">
                    ID
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatPublicId(incident.publicId)}
                  </p>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted/30">
                    {incident.asset.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={incident.asset.primaryImageUrl}
                        alt={incident.asset.title}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href="/gallery"
                      className="mt-1 block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Imagem {formatPublicId(incident.asset.publicId)}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={getDetectionStatusVariant(incident.incidentStatus)}>
                        {formatDetectionStatus(incident.incidentStatus)}
                      </Badge>
                      {incident.statusNote ? (
                        <span className="text-xs text-muted-foreground">
                          {incident.statusNote}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {formatDomain(incident.domain)}
                    </p>
                    <Badge
                      variant="outline"
                      className={sourceScopeBadgeClasses(incident.sourceScope)}
                    >
                      {formatSourceScope(incident.sourceScope)}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {incident.primaryPageTitle ?? "Pagina sem titulo identificado"}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{incident.pagesCount}</span>{" "}
                  pagina(s)
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getEvidenceCoverageVariant(incident.evidenceCoverage)}>
                    {formatEvidenceCoverage(incident.evidenceCoverage)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {incident.capturedEvidenceCount}/{incident.placementsCount}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {formatDate(incident.latestSeenAt)}
                </p>

                <div className="flex justify-start xl:justify-end">
                  <Button asChild size="sm">
                    <Link href={`/detections/${incident.primaryDetectionId}`}>Analisar</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
