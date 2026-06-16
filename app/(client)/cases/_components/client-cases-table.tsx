"use client";

import * as React from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatEvidenceCoverage,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { formatPublicId } from "@/lib/public-id";

type ClientCaseTableRow = {
  key: string;
  publicId: number;
  casePublicId: number;
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
  latestSeenAt: string;
  evidenceCoverage: string;
  pagesCount: number;
  placementsCount: number;
  capturedEvidenceCount: number;
  primaryDetectionId: string;
  bestMatchedImageUrl: string | null;
  pages: Array<{
    key: string;
    sourceUrl: string;
    pageTitle: string | null;
    placements: Array<{
      id: string;
      publicId: number;
    }>;
  }>;
};

type ClientCasesTableProps = {
  rows: ClientCaseTableRow[];
};

type FilterState = {
  caseId: string;
  imageId: string;
  occurrenceId: string;
  domainOrUrl: string;
  evidenceCoverage: string;
};

const defaultFilters: FilterState = {
  caseId: "",
  imageId: "",
  occurrenceId: "",
  domainOrUrl: "",
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

function ClientCasePreviewSheet({
  row,
  open,
  onOpenChange,
}: {
  row: ClientCaseTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {row ? (
          <>
            <SheetHeader className="border-b border-border/70 pb-4">
              <SheetTitle>Caso {formatPublicId(row.casePublicId)}</SheetTitle>
              <SheetDescription>
                Preview rapido do caso antes de abrir a analise completa.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 p-4">
              <div className="grid gap-4">
                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Imagem original
                  </p>
                  <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
                    {row.asset.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.asset.primaryImageUrl}
                        alt={row.asset.title}
                        className="h-52 w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                        Preview da imagem nao disponivel.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Imagem encontrada
                  </p>
                  <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
                    {row.bestMatchedImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.bestMatchedImageUrl}
                        alt={`Imagem encontrada do caso ${row.casePublicId}`}
                        className="h-52 w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                        A evidencia visual ainda nao foi preservada.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="destructive">Uso nao autorizado</Badge>
                <Badge variant={getEvidenceCoverageVariant(row.evidenceCoverage)}>
                  {formatEvidenceCoverage(row.evidenceCoverage)}
                </Badge>
                <Badge variant="outline">{row.pagesCount} pagina(s)</Badge>
                <Badge variant="outline">{row.placementsCount} ocorrencia(s)</Badge>
              </div>

              <div className="rounded-lg border border-border bg-card/70 p-3 text-sm">
                <p className="font-medium text-foreground">{row.asset.title}</p>
                <p className="mt-2 text-muted-foreground">
                  Caso {formatPublicId(row.casePublicId)} • Imagem{" "}
                  {formatPublicId(row.asset.publicId)}
                </p>
                <p className="mt-2 text-muted-foreground">{formatDomain(row.domain)}</p>
                <p className="mt-2 break-all text-muted-foreground">
                  {row.primaryPageTitle ?? row.pages[0]?.sourceUrl ?? "URL nao identificada"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/detections/${row.primaryDetectionId}`}>Abrir analise</Link>
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
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "latestSeenAt", desc: true },
  ]);
  const [activePreview, setActivePreview] = React.useState<ClientCaseTableRow | null>(null);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const occurrencePublicIds = row.pages.flatMap((page) =>
        page.placements.map((placement) => placement.publicId),
      );

      if (!matchesIdFilter([row.casePublicId], filters.caseId)) {
        return false;
      }

      if (!matchesIdFilter([row.asset.publicId], filters.imageId)) {
        return false;
      }

      if (!matchesIdFilter(occurrencePublicIds, filters.occurrenceId)) {
        return false;
      }

      if (
        ![
          row.domain,
          row.normalizedDomain,
          row.primaryPageTitle,
          row.asset.title,
          ...row.pages.map((page) => page.sourceUrl),
        ].some((value) => includesNormalized(value, filters.domainOrUrl))
      ) {
        return false;
      }

      if (filters.evidenceCoverage !== "all" && row.evidenceCoverage !== filters.evidenceCoverage) {
        return false;
      }

      return true;
    });
  }, [filters, rows]);

  const columns = React.useMemo<ColumnDef<ClientCaseTableRow>[]>(
    () => [
      {
        id: "case",
        header: "Caso",
        accessorFn: (row) => row.casePublicId,
        cell: ({ row }) => (
          <div className="min-w-[14rem]">
            <p className="font-medium text-foreground">
              Caso {formatPublicId(row.original.casePublicId)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Imagem {formatPublicId(row.original.asset.publicId)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.original.pages
                .flatMap((page) => page.placements.map((placement) => placement.publicId))
                .slice(0, 3)
                .map((value) => formatPublicId(value))
                .join(", ")}
            </p>
          </div>
        ),
      },
      {
        id: "asset",
        header: "Ativo",
        accessorFn: (row) => row.asset.title,
        cell: ({ row }) => (
          <div className="min-w-[16rem]">
            <p className="font-medium text-foreground">{row.original.asset.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.original.asset.originalFileName ?? "Arquivo sem nome original"}
            </p>
          </div>
        ),
      },
      {
        id: "domain",
        header: "Pagina / dominio",
        accessorFn: (row) => row.domain,
        cell: ({ row }) => (
          <div className="min-w-[18rem]">
            <p className="font-medium text-foreground">{formatDomain(row.original.domain)}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {row.original.primaryPageTitle ?? row.original.pages[0]?.sourceUrl ?? "Sem URL"}
            </p>
          </div>
        ),
      },
      {
        id: "evidence",
        header: "Evidencia",
        accessorFn: (row) => row.evidenceCoverage,
        cell: ({ row }) => (
          <div className="min-w-[10rem]">
            <Badge variant="destructive">Uso nao autorizado</Badge>
            <Badge
              variant={getEvidenceCoverageVariant(row.original.evidenceCoverage)}
              className="mt-2"
            >
              {formatEvidenceCoverage(row.original.evidenceCoverage)}
            </Badge>
          </div>
        ),
      },
      {
        id: "scope",
        header: "Escopo",
        accessorFn: (row) => row.placementsCount,
        cell: ({ row }) => (
          <div className="min-w-[10rem] text-sm">
            <p className="font-medium text-foreground">
              {row.original.pagesCount} pagina(s)
            </p>
            <p className="mt-1 text-muted-foreground">
              {row.original.capturedEvidenceCount}/{row.original.placementsCount} com captura
            </p>
          </div>
        ),
      },
      {
        id: "latestSeenAt",
        header: "Ultima deteccao",
        accessorFn: (row) => new Date(row.latestSeenAt).getTime(),
        cell: ({ row }) => (
          <div className="min-w-[11rem] text-sm">
            <p className="font-medium text-foreground">{formatDate(row.original.latestSeenAt)}</p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acoes",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex min-w-[12rem] flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setActivePreview(row.original)}>
              <EyeIcon className="size-4" />
              Preview
            </Button>
            <Button asChild size="sm">
              <Link href={`/detections/${row.original.primaryDetectionId}`}>Abrir analise</Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 12,
      },
    },
  });

  function updateFilter<Key extends keyof FilterState>(key: Key, value: FilterState[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Filtros de acompanhamento</p>
                <p className="text-sm text-muted-foreground">
                  Localize rapido um caso por IDs, pagina, dominio ou cobertura de evidencia.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{filteredRows.length} resultado(s)</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilters(defaultFilters)}
                >
                  <FilterXIcon className="size-4" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                  ID do caso
                </label>
                <Input
                  value={filters.caseId}
                  onChange={(event) => updateFilter("caseId", event.target.value)}
                  placeholder="Ex.: 000456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  ID da ocorrencia
                </label>
                <Input
                  value={filters.occurrenceId}
                  onChange={(event) => updateFilter("occurrenceId", event.target.value)}
                  placeholder="Ex.: 000789"
                />
              </div>
              <div className="space-y-2 xl:col-span-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Dominio, URL ou ativo
                </label>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.domainOrUrl}
                    onChange={(event) => updateFilter("domainOrUrl", event.target.value)}
                    placeholder="Busque por dominio, URL ou nome da imagem"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2 xl:col-span-2">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Cobertura de evidencia
                </label>
                <Select
                  value={filters.evidenceCoverage}
                  onValueChange={(value) => updateFilter("evidenceCoverage", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as coberturas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as coberturas</SelectItem>
                    <SelectItem value="captured">Cobertura completa</SelectItem>
                    <SelectItem value="partial">Cobertura parcial</SelectItem>
                    <SelectItem value="pending">Captura pendente</SelectItem>
                    <SelectItem value="failed">Sem captura util</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center">
                    Nenhum caso encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Proxima
            </Button>
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
