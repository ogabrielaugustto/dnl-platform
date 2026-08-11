"use client";

import * as React from "react";
import Link from "next/link";
import { EyeIcon, FilterXIcon, SearchIcon } from "lucide-react";
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
import { type DetectionCaseListItem } from "@/lib/dal/detections";
import { formatPublicId } from "@/lib/public-id";

type ClientCasesTableProps = {
  rows: DetectionCaseListItem[];
};

type FilterState = {
  caseId: string;
  imageId: string;
  occurrenceId: string;
  domainOrUrl: string;
  status: string;
  evidenceCoverage: string;
};

const defaultFilters: FilterState = {
  caseId: "",
  imageId: "",
  occurrenceId: "",
  domainOrUrl: "",
  status: "all",
  evidenceCoverage: "all",
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
      return "Caso aberto para acompanhamento";
    case "notificacao_enviada":
      return "Notificacao enviada";
    case "marcada_como_resolvida":
      return "Caso resolvido";
    case "marcada_como_ignorada":
      return "Caso encerrado sem prosseguir";
    case "marcada_como_uso_autorizado":
      return "Uso autorizado";
    case "marcada_como_possivel_infracao":
      return "Em revisao";
    default:
      return value.replaceAll("_", " ");
  }
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

function ClientCasePreviewSheet({
  row,
  open,
  onOpenChange,
}: {
  row: DetectionCaseListItem | null;
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
                Preview rapido do andamento antes de abrir a analise completa do caso.
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
                  title="Imagem encontrada / evidencia"
                  src={row.matchedImageUrl ?? row.screenshotUrl}
                  alt={`Preview do caso ${row.publicId}`}
                  fallback="A equipe ainda nao preservou uma evidencia visual deste caso."
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

              <div className="rounded-lg border border-border bg-card/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Resumo
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium text-foreground">{row.asset.title}</p>
                  <p className="text-muted-foreground">
                    Caso {formatPublicId(row.publicId)} • Imagem {formatPublicId(row.asset.publicId)}
                  </p>
                  <p className="text-muted-foreground">{formatDomain(row.domain)}</p>
                  <p className="break-all text-muted-foreground">
                    {row.primaryPageTitle ?? row.sourceUrl}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card/70 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Ultimo andamento
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    {row.latestAction
                      ? formatActionLabel(row.latestAction.action)
                      : "Aguardando novo andamento da equipe DNL"}
                  </p>
                  <p className="text-muted-foreground">
                    {row.latestAction
                      ? `${row.latestAction.actorName ?? row.latestAction.actorEmail ?? "Equipe DNL"} em ${formatDate(row.latestAction.createdAt)}`
                      : "O caso foi aberto e ainda nao recebeu atualizacoes adicionais."}
                  </p>
                  {row.latestAction?.notes ? (
                    <p className="text-muted-foreground">{row.latestAction.notes}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm">
                  <Link href={`/cases/${row.publicId}`}>Abrir analise</Link>
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function ClientCasesTable({ rows }: ClientCasesTableProps) {
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [activePreview, setActivePreview] = React.useState<DetectionCaseListItem | null>(null);
  const pageSize = 10;

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

      return true;
    });
  }, [filters, rows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const paginatedRows = filteredRows.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setPageIndex(0);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card">
          <div className="px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Filtros de acompanhamento</p>
                  <p className="text-sm text-muted-foreground">
                    Cruze IDs, dominio, status e evidencia para localizar rapido o caso certo.
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
                <div className="space-y-2 xl:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Dominio, titulo ou URL
                  </label>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={filters.domainOrUrl}
                      onChange={(event) => updateFilter("domainOrUrl", event.target.value)}
                      placeholder="Busque por dominio, URL, titulo da pagina ou nome da imagem"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                  items={[
                    ["all", `Todos os status (${rows.length})`],
                    ["unauthorized", "Em andamento"],
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
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {paginatedRows.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Nenhum caso encontrado
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajuste os filtros para localizar outro caso em acompanhamento.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[220px_minmax(260px,1fr)_170px_130px_250px] gap-4 border-b border-border bg-muted/30 px-5 py-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground xl:grid">
                <span>Caso / imagem</span>
                <span>Pagina / dominio</span>
                <span>Status</span>
                <span>Escopo</span>
                <span>Andamento</span>
              </div>

              <div className="divide-y divide-border">
                {paginatedRows.map((row) => (
                  <article
                    key={row.key}
                    className="grid gap-5 px-5 py-5 xl:grid-cols-[220px_minmax(260px,1fr)_170px_130px_250px] xl:items-center"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <p className="font-medium text-foreground">
                        Caso {formatPublicId(row.publicId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Imagem {formatPublicId(row.asset.publicId)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{row.asset.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Ocorrencias:{" "}
                        {row.detectionPublicIds
                          .slice(0, 3)
                          .map((value) => formatPublicId(value))
                          .join(", ")}
                        {row.detectionPublicIds.length > 3 ? "..." : ""}
                      </p>
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate font-medium text-foreground">{formatDomain(row.domain)}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {row.primaryPageTitle ?? row.sourceUrl}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ultimo achado em {formatDate(row.latestSeenAt)}
                      </p>
                    </div>

                    <div className="flex min-w-[9rem] flex-col gap-2">
                      <Badge variant={getDetectionStatusVariant(row.status)} className="w-fit">
                        {formatDetectionStatus(row.status)}
                      </Badge>
                      <Badge
                        variant={getEvidenceCoverageVariant(row.evidenceCoverage)}
                        className="w-fit"
                      >
                        {formatEvidenceCoverage(row.evidenceCoverage)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{row.pagesCount} pagina(s)</p>
                      <p>{row.capturedEvidenceCount}/{row.placementsCount} com captura</p>
                    </div>

                    <div className="space-y-3">
                      <div className="min-w-0 text-sm">
                        <p className="line-clamp-2 font-medium text-foreground">
                          {row.latestAction
                            ? formatActionLabel(row.latestAction.action)
                            : "Aguardando atualizacao"}
                        </p>
                        <p className="mt-1 truncate text-muted-foreground">
                          {row.latestAction
                            ? `${row.latestAction.actorName ?? row.latestAction.actorEmail ?? "Equipe DNL"} • ${formatDate(row.latestAction.createdAt)}`
                            : "Sem novo andamento registrado"}
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
                          <Link href={`/cases/${row.publicId}`}>Abrir analise</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

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

      <ClientCasePreviewSheet
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
