"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2Icon,
  FilterXIcon,
  FolderIcon,
  SearchIcon,
} from "lucide-react";
import { AdminArchiveAssetForm } from "@/app/(admin)/admin/assets/_components/admin-archive-asset-form";
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
import { formatPublicId } from "@/lib/public-id";
import type { AdminAssetListItem } from "@/lib/dal/admin-assets";

type AdminAssetsGalleryProps = {
  rows: AdminAssetListItem[];
};

type FilterState = {
  imageId: string;
  client: string;
  organization: string;
  status: string;
};

const defaultFilters: FilterState = {
  imageId: "",
  client: "",
  organization: "",
  status: "all",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMonitoringFrequency(value: string | null | undefined) {
  switch (value) {
    case "hourly":
      return "Hora em hora";
    case "daily":
      return "Diaria";
    case "weekly":
      return "Semanal";
    case "monthly":
      return "Mensal";
    default:
      return "Nao configurada";
  }
}

function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) {
    return "Tamanho nao informado";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
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

function getStatusVariant(kind: AdminAssetListItem["statusSummary"]["kind"]) {
  switch (kind) {
    case "completed_with_detections":
      return "default";
    case "failed":
      return "destructive";
    case "completed_without_detections":
      return "secondary";
    default:
      return "outline";
  }
}

export function AdminAssetsGallery({ rows }: AdminAssetsGalleryProps) {
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
  const pageSize = 12;
  const filteredOrganizations = React.useMemo(
    () =>
      organizations.filter((organization) =>
        includesNormalized([organization.name], folderSearch),
      ),
    [folderSearch, organizations],
  );

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (!matchesIdFilter(row.publicId, filters.imageId)) {
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

      if (filters.status !== "all" && row.statusSummary.kind !== filters.status) {
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
    const groups = new Map<string, { organization: AdminAssetListItem["organization"]; items: AdminAssetListItem[] }>();

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
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-medium text-foreground">Clientes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Navegue como pastas para abrir a galeria por cliente.
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
                <p className="text-sm font-medium text-foreground">Filtros da galeria</p>
                <p className="text-sm text-muted-foreground">
                  Busque por imagem, cliente e organizacao com paginação operacional.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{filteredRows.length} imagem(ns)</Badge>
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
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  ID da imagem
                </label>
                <Input
                  value={filters.imageId}
                  onChange={(event) => updateFilter("imageId", event.target.value)}
                  placeholder="Ex.: 000123"
                />
              </div>

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

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Organizacao
                </label>
                <Input
                  value={filters.organization}
                  onChange={(event) => updateFilter("organization", event.target.value)}
                  placeholder="UUID ou nome da organizacao"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="idle">Sem varredura</SelectItem>
                    <SelectItem value="pending">Aguardando varredura</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="completed_with_detections">Com ocorrencias</SelectItem>
                    <SelectItem value="completed_without_detections">Sem ocorrencias</SelectItem>
                    <SelectItem value="failed">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-4 py-5 md:px-5">
          {groupedRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Nenhuma imagem encontrada
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajuste os filtros para localizar outra galeria de cliente.
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={group.organization.isActive ? "secondary" : "destructive"}>
                      {group.organization.isActive ? "Cliente ativo" : "Cliente inativo"}
                    </Badge>
                    <Badge variant="outline">{group.items.length} imagem(ns) nesta pagina</Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {group.items.map((asset) => (
                    <article
                      key={asset.id}
                      className="flex h-full flex-col rounded-xl border border-border bg-card/70 shadow-sm"
                    >
                      <div className="aspect-[4/3] overflow-hidden rounded-t-xl border-b border-border bg-muted/30">
                        {asset.primaryFile?.publicUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.primaryFile.publicUrl}
                            alt={asset.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Preview indisponivel
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-4 p-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">Imagem {formatPublicId(asset.publicId)}</Badge>
                            <Badge variant={getStatusVariant(asset.statusSummary.kind)}>
                              {asset.statusSummary.label}
                            </Badge>
                          </div>
                          <h3 className="mt-3 font-medium text-foreground">{asset.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {asset.primaryFile?.originalFileName ?? "Sem nome de arquivo"}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoBlock
                            label="Monitoramento"
                            value={
                              asset.monitoringRule
                                ? formatMonitoringFrequency(asset.monitoringRule.frequency)
                                : "Nao configurado"
                            }
                          />
                          <InfoBlock
                            label="Ocorrencias"
                            value={String(asset.detectionsCount)}
                          />
                          <InfoBlock
                            label="Criada em"
                            value={formatDate(asset.createdAt)}
                          />
                          <InfoBlock
                            label="Arquivo"
                            value={formatBytes(asset.primaryFile?.sizeBytes)}
                          />
                        </div>

                        <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                          {asset.statusSummary.description}
                        </div>

                        {asset.latestDetectionPublicIds.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {asset.latestDetectionPublicIds.map((publicId) => (
                              <Badge key={publicId} variant="outline">
                                Ocorrencia {formatPublicId(publicId)}
                              </Badge>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-auto flex flex-col gap-3 pt-1">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/detections?image=${asset.publicId}`}>
                                Ver ocorrencias
                              </Link>
                            </Button>
                            {asset.detectionsCount > 0 ? (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/cases?image=${asset.publicId}`}>
                                  Ver casos
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                          <AdminArchiveAssetForm assetId={asset.id} />
                        </div>
                      </div>
                    </article>
                  ))}
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
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
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
