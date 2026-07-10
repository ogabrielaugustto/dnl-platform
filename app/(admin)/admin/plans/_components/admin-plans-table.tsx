"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDownIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Edit3Icon,
  EllipsisIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAdminPlanAction } from "@/app/actions/admin-plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { AdminPlanListItem } from "@/lib/dal/admin-plans";

type AdminPlansTableProps = {
  rows: AdminPlanListItem[];
};

function formatPlanPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  })
    .format(priceCents / 100)
    .replace(/\u00a0/g, " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBillingInterval(value: AdminPlanListItem["billingInterval"]) {
  return value === "yearly" ? "Anual" : "Mensal";
}

function formatScanFrequency(value: AdminPlanListItem["scanFrequencyCap"]) {
  switch (value) {
    case "hourly":
      return "A cada hora";
    case "daily":
      return "Diaria";
    case "weekly":
      return "Semanal";
    case "monthly":
      return "Mensal";
    default:
      return "Sem limite";
  }
}

function formatLimit(value: number | null, unit: string) {
  return value === null ? "Sem limite" : `${value.toLocaleString("pt-BR")} ${unit}`;
}

function SortableHeader({
  column,
  title,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
  title: string;
}) {
  return (
    <Button
      className="-ml-3 h-8 px-3"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      type="button"
      variant="ghost"
    >
      {title}
      <ArrowUpDownIcon className="size-4" />
    </Button>
  );
}

function EditPlanDialog({
  onOpenChange,
  open,
  row,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  row: AdminPlanListItem;
}) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] =
    React.useState<AdminPlanListItem["billingInterval"]>(row.billingInterval);
  const [scanFrequencyCap, setScanFrequencyCap] = React.useState(
    row.scanFrequencyCap ?? "none",
  );
  const [isActive, setIsActive] = React.useState(
    row.isActive ? "true" : "false",
  );
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("billingInterval", billingInterval);
    formData.set("scanFrequencyCap", scanFrequencyCap);
    formData.set("isActive", isActive);

    startTransition(async () => {
      const result = await updateAdminPlanAction(formData);

      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "Nao foi possivel atualizar este plano.");
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar plano</DialogTitle>
          <DialogDescription>
            Ajuste as informacoes comerciais e os limites operacionais do plano.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <input name="planId" type="hidden" value={row.id} />

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="space-y-2">
              <Label htmlFor={`plan-name-${row.id}`}>Nome</Label>
              <Input
                defaultValue={row.name}
                disabled={isPending}
                id={`plan-name-${row.id}`}
                name="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`plan-code-${row.id}`}>Codigo</Label>
              <Input disabled id={`plan-code-${row.id}`} value={row.code} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`plan-description-${row.id}`}>Descricao</Label>
            <Textarea
              defaultValue={row.description ?? ""}
              disabled={isPending}
              id={`plan-description-${row.id}`}
              name="description"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`plan-price-${row.id}`}>Preco</Label>
              <Input
                defaultValue={row.priceInput}
                disabled={isPending}
                id={`plan-price-${row.id}`}
                inputMode="decimal"
                name="price"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Periodicidade</Label>
              <Select
                disabled={isPending}
                onValueChange={(value: AdminPlanListItem["billingInterval"]) =>
                  setBillingInterval(value)
                }
                value={billingInterval}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                disabled={isPending}
                onValueChange={setIsActive}
                value={isActive}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor={`plan-assets-${row.id}`}>Limite de imagens</Label>
              <Input
                defaultValue={row.maxAssets ?? ""}
                disabled={isPending}
                id={`plan-assets-${row.id}`}
                min={1}
                name="maxAssets"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`plan-team-${row.id}`}>Limite de usuarios</Label>
              <Input
                defaultValue={row.maxTeamMembers ?? ""}
                disabled={isPending}
                id={`plan-team-${row.id}`}
                min={1}
                name="maxTeamMembers"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label>Frequencia maxima</Label>
              <Select
                disabled={isPending}
                onValueChange={setScanFrequencyCap}
                value={scanFrequencyCap}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Frequencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem limite</SelectItem>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button disabled={isPending} type="submit">
              {isPending ? "Salvando..." : "Salvar plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPlansTable({ rows }: AdminPlansTableProps) {
  const [editingPlan, setEditingPlan] = React.useState<AdminPlanListItem | null>(
    null,
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = React.useMemo<ColumnDef<AdminPlanListItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Plano" />,
        cell: ({ row }) => (
          <div className="min-w-[16rem] max-w-lg">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{row.original.name}</p>
              {row.original.isActive ? (
                <CheckCircle2Icon className="size-4 text-emerald-600" />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {row.original.description ?? "Sem descricao cadastrada."}
            </p>
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "priceCents",
        header: ({ column }) => <SortableHeader column={column} title="Preco" />,
        cell: ({ row }) => (
          <div className="min-w-32">
            <p className="font-medium">
              {formatPlanPrice(row.original.priceCents, row.original.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBillingInterval(row.original.billingInterval)}
            </p>
          </div>
        ),
      },
      {
        id: "limits",
        header: "Limites",
        cell: ({ row }) => (
          <div className="min-w-44 text-sm">
            <p>{formatLimit(row.original.maxAssets, "imagem(ns)")}</p>
            <p className="text-muted-foreground">
              {formatLimit(row.original.maxTeamMembers, "usuario(s)")}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "scanFrequencyCap",
        header: "Varredura",
        cell: ({ row }) => (
          <span className="text-sm">
            {formatScanFrequency(row.original.scanFrequencyCap)}
          </span>
        ),
      },
      {
        accessorKey: "activeSubscriptions",
        header: ({ column }) => (
          <SortableHeader column={column} title="Assinaturas" />
        ),
        cell: ({ row }) => (
          <div className="min-w-28 text-sm">
            <p className="font-medium">
              {row.original.activeSubscriptions}/{row.original.totalSubscriptions}
            </p>
            <p className="text-xs text-muted-foreground">ativas</p>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "destructive"}>
            {row.original.isActive ? "Ativo" : "Inativo"}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          if (value === "all") {
            return true;
          }

          return row.getValue(id) === (value === "active");
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Atualizado",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Abrir acoes"
                className="size-8"
                size="icon"
                variant="ghost"
              >
                <EllipsisIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acoes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingPlan(row.original)}>
                <Edit3Icon className="size-4" />
                Editar plano
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table intentionally returns table APIs that React Compiler skips.
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      sorting,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            placeholder="Filtrar planos..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) =>
              table.getColumn("isActive")?.setFilterValue(value)
            }
            value={
              (table.getColumn("isActive")?.getFilterValue() as string) ?? "all"
            }
          >
            <SelectTrigger className="w-[9rem]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Colunas
                <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    key={column.id}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  Nenhum plano encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} plano(s) encontrado(s).
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="hidden items-center gap-2 md:flex">
            <Label htmlFor="plans-rows-per-page">Linhas por pagina</Label>
            <Select
              onValueChange={(value) => table.setPageSize(Number(value))}
              value={`${table.getState().pagination.pageSize}`}
            >
              <SelectTrigger className="w-20" id="plans-rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm font-medium">
            Pagina {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(table.getPageCount(), 1)}
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="hidden size-8 p-0 md:inline-flex"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">Primeira pagina</span>
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button
              className="size-8 p-0"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">Pagina anterior</span>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              className="size-8 p-0"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">Proxima pagina</span>
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button
              className="hidden size-8 p-0 md:inline-flex"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="sr-only">Ultima pagina</span>
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {editingPlan ? (
        <EditPlanDialog
          key={editingPlan.id}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPlan(null);
            }
          }}
          open={Boolean(editingPlan)}
          row={editingPlan}
        />
      ) : null}
    </div>
  );
}
