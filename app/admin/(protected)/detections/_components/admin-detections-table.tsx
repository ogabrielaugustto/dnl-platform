"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  EyeIcon,
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
import type { AdminDetectionIncidentListItem } from "@/lib/dal/admin-detections";
import { formatPublicId } from "@/lib/public-id";

type AdminDetectionsTableProps = {
  rows: AdminDetectionIncidentListItem[];
};

type FilterState = {
  imageId: string;
  occurrenceId: string;
  caseId: string;
  client: string;
  organization: string;
  status: string;
  evidence: string;
};

const defaultFilters: FilterState = {
  imageId: "",
  occurrenceId: "",
  caseId: "",
  client: "",
  organization: "",
  status: "all",
  evidence: "all",
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

function matchesIdFilter(value: number, filterValue: string) {
  const normalized = filterValue.trim();

  if (!normalized) {
    return true;
  }

  return value.toString().includes(normalized);
}

function includesNormalized(values: Array<string | null | undefined>, needle: string) {
  if (!needle.trim()) {
    return true;
  }

  const normalizedNeedle = needle.trim().toLowerCase();
  return values.some((value) => (value ?? "").toLowerCase().includes(normalizedNeedle));
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

function AdminDetectionPreviewSheet({
  row,
  open,
  onOpenChange,
}: {
  row: AdminDetectionIncidentListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {row ? (
          <>
            <SheetHeader className="border-b border-border/70 pb-4">
              <SheetTitle>Ocorrencia {formatPublicId(row.publicId)}</SheetTitle>
              <SheetDescription>
                Preview rapido da ocorrencia antes de abrir o detalhe completo.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewImage
                  title="Imagem original"
                  src={row.asset.primaryImageUrl}
                  alt={row.asset.title}
                  fallback="Sem preview da imagem original."
                />
                <PreviewImage
                  title="Imagem encontrada"
                  src={row.bestMatchedImageUrl}
                  alt={`Preview da ocorrencia ${row.publicId}`}
                  fallback="Sem imagem encontrada preservada."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={getDetectionStatusVariant(row.incidentStatus)}>
                  {formatDetectionStatus(row.incidentStatus)}
                </Badge>
                <Badge variant={getEvidenceCoverageVariant(row.evidenceCoverage)}>
                  {formatEvidenceCoverage(row.evidenceCoverage)}
                </Badge>
                <Badge variant="outline">{row.pagesCount} pagina(s)</Badge>
                <Badge variant="outline">{row.placementsCount} registro(s)</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard
                  title="Cliente"
                  lines={[
                    row.organization.name,
                    row.organization.billingEmail ?? "Sem e-mail de cobranca",
                    row.organization.document ?? "Sem documento",
                  ]}
                />
                <InfoCard
                  title="Identificacao"
                  lines={[
                    `Imagem ${formatPublicId(row.asset.publicId)}`,
                    `Ocorrencia ${formatPublicId(row.publicId)}`,
                    `Caso ${formatPublicId(row.casePublicId)}`,
                  ]}
                />
              </div>

              <InfoCard
                title="Contexto"
                lines={[
                  formatDomain(row.domain),
                  row.primaryPageTitle ?? "Pagina sem titulo",
                  `Ultimo achado em ${formatDate(row.latestSeenAt)}`,
                  row.statusNote ?? "Sem observacao adicional",
                ]}
              />

              <div className="space-y-2 rounded-lg border border-border bg-card/70 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Paginas do grupo
                </p>
                {row.pages.slice(0, 4).map((page) => (
                  <div key={page.key} className="rounded-md border border-border/70 bg-muted/25 px-3 py-2">
                    <p className="font-medium text-foreground">
                      {page.pageTitle ?? "Pagina sem titulo identificado"}
                    </p>
                    <p className="mt-1 break-all text-muted-foreground">{page.sourceUrl}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm">
                  <Link href={`/admin/detections/${row.organization.id}/${row.primaryDetectionId}`}>
                    Detalhes
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={row.pages[0]?.sourceUrl ?? "#"} target="_blank" rel="noreferrer">
                    Abrir origem
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function AdminDetectionsTable({ rows }: AdminDetectionsTableProps) {
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
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  const [folderSearch, setFolderSearch] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);
  const [activePreview, setActivePreview] = React.useState<AdminDetectionIncidentListItem | null>(null);
  const pageSize = 10;
  const filteredOrganizations = React.useMemo(
    () =>
      organizations.filter((organization) =>
        includesNormalized([organization.name], folderSearch),
      ),
    [folderSearch, organizations],
  );

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (!matchesIdFilter(row.asset.publicId, filters.imageId)) {
        return false;
      }

      if (!matchesIdFilter(row.publicId, filters.occurrenceId)) {
        return false;
      }

      if (!matchesIdFilter(row.casePublicId, filters.caseId)) {
        return false;
      }

      if (
        !includesNormalized(
          [row.organization.name, row.organization.billingEmail, row.organization.document],
          filters.client,
        )
      ) {
        return false;
      }

      if (
        !includesNormalized(
          [row.organization.name, row.organization.document, row.organization.id],
          filters.organization,
        )
      ) {
        return false;
      }

      if (filters.status !== "all" && row.incidentStatus !== filters.status) {
        return false;
      }

      if (filters.evidence !== "all" && row.evidenceCoverage !== filters.evidence) {
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
    const groups = new Map<string, { organization: AdminDetectionIncidentListItem["organization"]; items: AdminDetectionIncidentListItem[] }>();

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
            Abra as ocorrencias cliente por cliente.
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
            onClick={() => updateFilter("organization", "")}
            className={cnFolderButton(filters.organization.trim().length === 0)}
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
                onClick={() => updateFilter("organization", organization.name)}
                className={cnFolderButton(
                  filters.organization.trim().toLowerCase() === organization.name.toLowerCase(),
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <FolderIcon className="size-4 shrink-0" />
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
                  <p className="text-sm font-medium text-foreground">Filtros de ocorrencias</p>
                  <p className="text-sm text-muted-foreground">
                    Cruze imagem, ocorrencia, caso, cliente e organizacao em uma lista global.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{filteredRows.length} ocorrencia(s)</Badge>
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

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <LabeledInput
                  label="ID da imagem"
                  value={filters.imageId}
                  onChange={(value) => updateFilter("imageId", value)}
                  placeholder="Ex.: 000123"
                />
                <LabeledInput
                  label="ID da ocorrencia"
                  value={filters.occurrenceId}
                  onChange={(value) => updateFilter("occurrenceId", value)}
                  placeholder="Ex.: 000456"
                />
                <LabeledInput
                  label="ID do caso"
                  value={filters.caseId}
                  onChange={(value) => updateFilter("caseId", value)}
                  placeholder="Ex.: 000789"
                />
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Cliente
                  </label>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={filters.client}
                      onChange={(event) => updateFilter("client", event.target.value)}
                      placeholder="Nome, documento ou e-mail"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <LabeledInput
                  label="Organizacao"
                  value={filters.organization}
                  onChange={(value) => updateFilter("organization", value)}
                  placeholder="UUID ou nome da organizacao"
                />
                <LabeledSelect
                  label="Status"
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                  items={[
                    ["all", "Todos os status"],
                    ["pending", "Aguardando validacao"],
                    ["possible_infringement", "Possivel infracao"],
                    ["unauthorized", "Uso nao autorizado"],
                    ["takedown_sent", "Notificacao enviada"],
                    ["resolved", "Resolvido"],
                    ["authorized", "Uso autorizado"],
                    ["ignored", "Ignorado"],
                  ]}
                />
                <LabeledSelect
                  label="Evidencia"
                  value={filters.evidence}
                  onValueChange={(value) => updateFilter("evidence", value)}
                  items={[
                    ["all", "Todas as coberturas"],
                    ["captured", "Cobertura completa"],
                    ["partial", "Cobertura parcial"],
                    ["pending", "Captura pendente"],
                    ["failed", "Sem captura util"],
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 px-4 py-5 md:px-5">
            {groupedRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Nenhuma ocorrencia encontrada
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ajuste os filtros para localizar outro grupo de ocorrencias.
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
                        {group.organization.billingEmail ?? "Sem e-mail de cobranca"}{" "}
                        {group.organization.document ? `• ${group.organization.document}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{group.items.length} ocorrencia(s) nesta pagina</Badge>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="hidden grid-cols-[minmax(150px,1fr)_minmax(140px,0.85fr)_minmax(280px,1.4fr)_140px_120px_160px] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground xl:grid">
                      <span>Ocorrencia / caso</span>
                      <span>Imagem</span>
                      <span>Pagina / dominio</span>
                      <span>Status</span>
                      <span>Escopo</span>
                      <span>Acoes</span>
                    </div>

                    <div className="divide-y divide-border">
                      {group.items.map((row) => (
                        <article
                          key={row.key}
                          className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(150px,1fr)_minmax(140px,0.85fr)_minmax(280px,1.4fr)_140px_120px_160px] xl:items-center"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              Ocorrencia {formatPublicId(row.publicId)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Caso {formatPublicId(row.casePublicId)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Atualizado {formatDate(row.latestActionAt ?? row.latestSeenAt)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              Imagem {formatPublicId(row.asset.publicId)}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {row.asset.title}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{formatDomain(row.domain)}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {row.primaryPageTitle ?? row.pages[0]?.sourceUrl ?? "Sem pagina"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Ultimo achado {formatDate(row.latestSeenAt)}
                            </p>
                          </div>

                          <div className="flex min-w-[8rem] flex-col gap-2">
                            <Badge variant={getDetectionStatusVariant(row.incidentStatus)}>
                              {formatDetectionStatus(row.incidentStatus)}
                            </Badge>
                            <Badge variant={getEvidenceCoverageVariant(row.evidenceCoverage)}>
                              {formatEvidenceCoverage(row.evidenceCoverage)}
                            </Badge>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{row.pagesCount} pagina(s)</p>
                            <p className="mt-1">
                              {row.capturedEvidenceCount}/{row.placementsCount} capturada(s)
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setActivePreview(row)}
                            >
                              <EyeIcon className="size-4" />
                              Preview
                            </Button>
                            <Button asChild size="sm">
                              <Link href={`/admin/detections/${row.organization.id}/${row.primaryDetectionId}`}>
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

          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
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

      <AdminDetectionPreviewSheet
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

function LabeledInput({
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

function LabeledSelect({
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

function InfoCard({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3 space-y-2 text-sm">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
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
