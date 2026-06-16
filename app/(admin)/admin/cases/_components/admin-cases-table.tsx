"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2Icon,
  EyeIcon,
  ExternalLinkIcon,
  FilterXIcon,
  FolderIcon,
  SearchIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { formatPublicId } from "@/lib/public-id";

type AdminCaseTableRow = {
  key: string;
  publicId: number;
  representativeDetectionId: string;
  detectionPublicIds: number[];
  organization: {
    id: string;
    name: string;
    billingEmail: string | null;
  };
  asset: {
    id: string;
    publicId: number;
    title: string;
    primaryImageUrl: string | null;
    originalFileName: string | null;
  };
  domain: string;
  normalizedDomain: string;
  primaryPageTitle: string | null;
  sourceUrl: string;
  finalUrl: string | null;
  matchedImageUrl: string | null;
  screenshotUrl: string | null;
  status: string;
  latestSeenAt: string;
  clientReviewedAt: string | null;
  evidenceCoverage: string;
  pagesCount: number;
  placementsCount: number;
  capturedEvidenceCount: number;
  siteSignals: {
    cnpjCandidates: string[];
    emails: string[];
    phones: string[];
    siteName: string | null;
  };
  latestAction: {
    action: string;
    actorName: string | null;
    actorEmail: string | null;
    createdAt: string;
    notes: string | null;
    reason: string | null;
  } | null;
  placements: Array<{
    id: string;
    publicId: number;
    sourceUrl: string;
    pageTitle: string | null;
    status: string;
    confidenceScore: number | null;
    lastSeenAt: string;
  }>;
};

type AdminCasesTableProps = {
  rows: AdminCaseTableRow[];
};

type FilterState = {
  caseId: string;
  imageId: string;
  occurrenceId: string;
  clientName: string;
  clientEmail: string;
  domainOrUrl: string;
  status: string;
  evidenceCoverage: string;
  latestAction: string;
};

const defaultFilters: FilterState = {
  caseId: "",
  imageId: "",
  occurrenceId: "",
  clientName: "",
  clientEmail: "",
  domainOrUrl: "",
  status: "all",
  evidenceCoverage: "all",
  latestAction: "all",
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

function formatActionLabel(value: string) {
  switch (value) {
    case "marcada_como_uso_nao_autorizado":
      return "Cliente confirmou a infracao";
    case "notificacao_enviada":
      return "Notificacao enviada";
    case "marcada_como_resolvida":
      return "Caso resolvido";
    case "marcada_como_ignorada":
      return "Caso ignorado";
    case "marcada_como_uso_autorizado":
      return "Marcado como uso autorizado";
    default:
      return value.replaceAll("_", " ");
  }
}

function formatList(values: string[], fallback: string) {
  if (values.length === 0) {
    return fallback;
  }

  return values.slice(0, 3).join(" • ");
}

function includesNormalized(haystack: string | null | undefined, needle: string) {
  if (!needle.trim()) {
    return true;
  }

  return (haystack ?? "").toLowerCase().includes(needle.trim().toLowerCase());
}

function matchesIdFilter(values: number[], filterValue: string) {
  const normalized = filterValue.trim();

  if (!normalized) {
    return true;
  }

  return values.some((value) => value.toString().includes(normalized));
}

function PreviewImage({
  title,
  src,
  alt,
  fallback,
}: {
  title: string;
  src: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-48 w-full object-contain" />
        ) : (
          <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCasePreviewSheet({
  row,
  open,
  onOpenChange,
}: {
  row: AdminCaseTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {row ? (
          <>
            <SheetHeader className="border-b border-border/70 pb-4">
              <SheetTitle>Caso {formatPublicId(row.publicId)}</SheetTitle>
              <SheetDescription>
                Preview rapido para triagem operacional antes de abrir o detalhe completo.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewImage
                  title="Imagem original"
                  src={row.asset.primaryImageUrl}
                  alt={row.asset.title}
                  fallback="A imagem original ainda nao possui preview disponivel."
                />
                <PreviewImage
                  title="Captura encontrada"
                  src={row.matchedImageUrl ?? row.screenshotUrl}
                  alt={`Preview do caso ${row.publicId}`}
                  fallback="A captura de evidencia ainda nao esta disponivel."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={getDetectionStatusVariant(row.status)}>
                  {formatDetectionStatus(row.status)}
                </Badge>
                <Badge variant={getEvidenceCoverageVariant(row.evidenceCoverage)}>
                  {formatEvidenceCoverage(row.evidenceCoverage)}
                </Badge>
                <Badge variant="outline">{row.pagesCount} pagina(s)</Badge>
                <Badge variant="outline">{row.placementsCount} ocorrencia(s)</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Identificacao
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-foreground">Caso:</span>{" "}
                      {formatPublicId(row.publicId)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Imagem:</span>{" "}
                      {formatPublicId(row.asset.publicId)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Ocorrencias:</span>{" "}
                      {row.detectionPublicIds.map((value) => formatPublicId(value)).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Cliente
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="font-medium text-foreground">{row.organization.name}</p>
                    <p>{row.organization.billingEmail ?? "Sem e-mail de cobranca"}</p>
                    <p>Encaminhado em {formatDate(row.clientReviewedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card/70 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Contexto da captura
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium text-foreground">{formatDomain(row.domain)}</p>
                  <p>{row.asset.title}</p>
                  <p className="break-all text-muted-foreground">
                    {row.primaryPageTitle ?? row.sourceUrl}
                  </p>
                  {row.finalUrl ? (
                    <p className="break-all text-muted-foreground">
                      Destino final: {row.finalUrl}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Sinais
                  </p>
                  <p className="mt-3 text-sm">
                    {row.siteSignals.siteName ?? "Site sem nome identificado"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    E-mails
                  </p>
                  <p className="mt-3 text-sm">
                    {formatList(row.siteSignals.emails, "Nenhum e-mail")}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    CNPJ / telefone
                  </p>
                  <p className="mt-3 text-sm">
                    {formatList(
                      [...row.siteSignals.cnpjCandidates, ...row.siteSignals.phones],
                      "Nenhum sinal",
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card/70 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Ultimo andamento
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    {row.latestAction
                      ? formatActionLabel(row.latestAction.action)
                      : "Sem historico registrado"}
                  </p>
                  <p>
                    {row.latestAction
                      ? `${row.latestAction.actorName ?? row.latestAction.actorEmail ?? "Equipe DNL"} em ${formatDate(row.latestAction.createdAt)}`
                      : "Nenhuma acao foi registrada ate agora."}
                  </p>
                  {row.latestAction?.notes ? (
                    <p className="text-muted-foreground">{row.latestAction.notes}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm">
                  <Link href={`/admin/cases/${row.organization.id}/${row.publicId}`}>
                    Ver detalhes completos
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={row.sourceUrl} target="_blank" rel="noreferrer">
                    Abrir origem
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
                {row.finalUrl && row.finalUrl !== row.sourceUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={row.finalUrl} target="_blank" rel="noreferrer">
                      Abrir destino final
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function AdminCasesTable({ rows }: AdminCasesTableProps) {
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  const [folderSearch, setFolderSearch] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [activePreview, setActivePreview] = React.useState<AdminCaseTableRow | null>(null);
  const pageSize = 10;
  const organizations = React.useMemo(
    () =>
      Array.from(
        new Map(
          rows.map((row) => [
            row.organization.id,
            {
              id: row.organization.id,
              name: row.organization.name,
              count: rows.filter((candidate) => candidate.organization.id === row.organization.id).length,
            },
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [rows],
  );
  const filteredOrganizations = React.useMemo(
    () =>
      organizations.filter((organization) =>
        includesNormalized(organization.name, folderSearch),
      ),
    [folderSearch, organizations],
  );

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (!matchesIdFilter([row.publicId], filters.caseId)) {
        return false;
      }

      if (!matchesIdFilter([row.asset.publicId], filters.imageId)) {
        return false;
      }

      if (!matchesIdFilter(row.detectionPublicIds, filters.occurrenceId)) {
        return false;
      }

      if (!includesNormalized(row.organization.name, filters.clientName)) {
        return false;
      }

      if (!includesNormalized(row.organization.billingEmail, filters.clientEmail)) {
        return false;
      }

      if (
        ![
          row.domain,
          row.normalizedDomain,
          row.sourceUrl,
          row.finalUrl,
          row.primaryPageTitle,
          row.asset.title,
        ].some((value) => includesNormalized(value, filters.domainOrUrl))
      ) {
        return false;
      }

      if (filters.status !== "all" && row.status !== filters.status) {
        return false;
      }

      if (filters.evidenceCoverage !== "all" && row.evidenceCoverage !== filters.evidenceCoverage) {
        return false;
      }

      if (
        filters.latestAction !== "all" &&
        (row.latestAction?.action ?? "sem_historico") !== filters.latestAction
      ) {
        return false;
      }

      return true;
    });
  }, [filters, rows]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedRows = filteredRows.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );
  const groupedRows = React.useMemo(() => {
    const groups = new Map<
      string,
      { organization: AdminCaseTableRow["organization"]; items: AdminCaseTableRow[] }
    >();

    for (const row of paginatedRows) {
      const current = groups.get(row.organization.id) ?? {
        organization: row.organization,
        items: [],
      };
      current.items.push(row);
      groups.set(row.organization.id, current);
    }

    return [...groups.values()].sort((left, right) =>
      left.organization.name.localeCompare(right.organization.name),
    );
  }, [paginatedRows]);

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setPageIndex(0);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-4">
            <p className="text-sm font-medium text-foreground">Clientes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Abra os casos cliente por cliente.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={folderSearch}
                onChange={(event) => setFolderSearch(event.target.value)}
                placeholder="Filtrar pasta por cliente"
                className="pl-9"
              />
            </div>

            <button
              type="button"
              onClick={() => updateFilter("clientName", "")}
              className={cnFolderButton(filters.clientName.trim().length === 0)}
            >
              <span className="flex items-center gap-2">
                <FolderIcon className="size-4" />
                Todos os clientes
              </span>
              <Badge variant="outline">{rows.length}</Badge>
            </button>

            {filteredOrganizations.map((organization) => (
              <button
                key={organization.id}
                type="button"
                onClick={() => updateFilter("clientName", organization.name)}
                className={cnFolderButton(
                  filters.clientName.trim().toLowerCase() === organization.name.toLowerCase(),
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <Building2Icon className="size-4 shrink-0" />
                  <span className="truncate">{organization.name}</span>
                </span>
                <Badge variant="outline">{organization.count}</Badge>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Filtros operacionais</p>
                  <p className="text-sm text-muted-foreground">
                    Cruze IDs, cliente, dominio, status e andamento para localizar casos rapido.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{filteredRows.length} resultado(s)</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPageIndex(0);
                      setFilters(defaultFilters);
                    }}
                  >
                    <FilterXIcon className="size-4" />
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FilterInput
                  label="ID da imagem"
                  value={filters.imageId}
                  onChange={(value) => updateFilter("imageId", value)}
                  placeholder="Ex.: 000123"
                />
                <FilterInput
                  label="ID do caso"
                  value={filters.caseId}
                  onChange={(value) => updateFilter("caseId", value)}
                  placeholder="Ex.: 000456"
                />
                <FilterInput
                  label="ID da ocorrencia"
                  value={filters.occurrenceId}
                  onChange={(value) => updateFilter("occurrenceId", value)}
                  placeholder="Ex.: 000789"
                />
                <FilterInput
                  label="Cliente / nome"
                  value={filters.clientName}
                  onChange={(value) => updateFilter("clientName", value)}
                  placeholder="Empresa, responsavel, marca..."
                />
                <FilterInput
                  label="E-mail"
                  value={filters.clientEmail}
                  onChange={(value) => updateFilter("clientEmail", value)}
                  placeholder="cliente@empresa.com"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2 xl:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Dominio, titulo ou URL
                  </label>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={filters.domainOrUrl}
                      onChange={(event) => updateFilter("domainOrUrl", event.target.value)}
                      placeholder="Busque por dominio, URL, titulo da pagina ou ativo"
                      className="pl-9"
                    />
                  </div>
                </div>
                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                  items={[
                    ["all", "Todos os status"],
                    ["unauthorized", "Uso nao autorizado"],
                    ["takedown_sent", "Notificacao enviada"],
                    ["resolved", "Resolvido"],
                  ]}
                />
                <FilterSelect
                  label="Evidencia"
                  value={filters.evidenceCoverage}
                  onValueChange={(value) => updateFilter("evidenceCoverage", value)}
                  items={[
                    ["all", "Todas as coberturas"],
                    ["captured", "Cobertura completa"],
                    ["partial", "Cobertura parcial"],
                    ["pending", "Captura pendente"],
                    ["failed", "Sem captura util"],
                  ]}
                />
                <FilterSelect
                  label="Ultimo andamento"
                  value={filters.latestAction}
                  onValueChange={(value) => updateFilter("latestAction", value)}
                  items={[
                    ["all", "Todos os andamentos"],
                    ["sem_historico", "Sem historico"],
                    ["marcada_como_uso_nao_autorizado", "Cliente confirmou a infracao"],
                    ["notificacao_enviada", "Notificacao enviada"],
                    ["marcada_como_resolvida", "Caso resolvido"],
                    ["marcada_como_ignorada", "Caso ignorado"],
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 px-4 py-5 md:px-5">
            {groupedRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Nenhum caso encontrado
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ajuste os filtros para localizar outro grupo de casos.
                </p>
              </div>
            ) : (
              groupedRows.map((group) => (
                <section key={group.organization.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FolderIcon className="size-4" />
                        <span className="truncate">{group.organization.name}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {group.organization.billingEmail ?? "Sem e-mail de cobranca"}
                      </p>
                    </div>
                    <Badge variant="outline">{group.items.length} caso(s) nesta pagina</Badge>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="hidden grid-cols-[minmax(160px,1fr)_minmax(150px,0.95fr)_minmax(280px,1.4fr)_140px_130px_160px] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground xl:grid">
                      <span>Caso / imagem</span>
                      <span>Cliente</span>
                      <span>Pagina / dominio</span>
                      <span>Status</span>
                      <span>Escopo</span>
                      <span>Acoes</span>
                    </div>

                    <div className="divide-y divide-border">
                      {group.items.map((row) => (
                        <article
                          key={row.key}
                          className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(160px,1fr)_minmax(150px,0.95fr)_minmax(280px,1.4fr)_140px_130px_160px] xl:items-center"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              Caso {formatPublicId(row.publicId)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Imagem {formatPublicId(row.asset.publicId)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Ocorrencias:{" "}
                              {row.detectionPublicIds
                                .slice(0, 3)
                                .map((value) => formatPublicId(value))
                                .join(", ")}
                              {row.detectionPublicIds.length > 3 ? "..." : ""}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{row.organization.name}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {row.organization.billingEmail ?? "Sem e-mail de cobranca"}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{formatDomain(row.domain)}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {row.primaryPageTitle ?? row.sourceUrl}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {row.asset.title}
                            </p>
                          </div>

                          <div className="flex min-w-[8rem] flex-col gap-2">
                            <Badge variant={getDetectionStatusVariant(row.status)}>
                              {formatDetectionStatus(row.status)}
                            </Badge>
                            <Badge variant={getEvidenceCoverageVariant(row.evidenceCoverage)}>
                              {formatEvidenceCoverage(row.evidenceCoverage)}
                            </Badge>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{row.pagesCount} pagina(s)</p>
                            <p className="mt-1">
                              {row.capturedEvidenceCount}/{row.placementsCount} com captura
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActivePreview(row)}
                            >
                              <EyeIcon className="size-4" />
                              Preview
                            </Button>
                            <Button asChild size="sm">
                              <Link href={`/admin/cases/${row.organization.id}/${row.publicId}`}>
                                Detalhes
                              </Link>
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {safePageIndex + 1} de {pageCount}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                disabled={safePageIndex === 0}
              >
                Anterior
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
                disabled={safePageIndex >= pageCount - 1}
              >
                Proxima
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AdminCasePreviewSheet
        row={activePreview}
        open={Boolean(activePreview)}
        onOpenChange={(open) => {
          if (!open) {
            setActivePreview(null);
          }
        }}
      />
    </>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Array<[string, string]>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([itemValue, itemLabel]) => (
            <SelectItem key={itemValue} value={itemValue}>
              {itemLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function cnFolderButton(active: boolean) {
  return [
    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors",
    active
      ? "border-primary/30 bg-primary/10 text-foreground"
      : "border-border bg-background hover:bg-muted/40",
  ].join(" ");
}
