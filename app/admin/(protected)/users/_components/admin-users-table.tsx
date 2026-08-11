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
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EllipsisIcon,
  KeyRoundIcon,
  PowerIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  sendAdminUserPasswordResetAction,
  toggleAdminUserActiveAction,
} from "@/app/actions/admin-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type {
  AdminOrganizationListItem,
  AdminUserListItem,
} from "@/lib/dal/admin-management";

type AdminUsersTableProps = {
  organizations: AdminOrganizationListItem[];
  rows: AdminUserListItem[];
};

const columnLabels: Record<string, string> = {
  accessType: "Acesso",
  actions: "Acoes",
  isActive: "Status",
  lastSignedInAt: "Ultimo acesso",
  organizations: "Organizacoes",
  user: "Usuario",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Nunca acessou";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAccessType(value: AdminUserListItem["accessType"]) {
  switch (value) {
    case "internal":
      return "Interno";
    case "client":
      return "Cliente";
    case "hybrid":
      return "Hibrido";
    default:
      return "Sem acesso";
  }
}

function getSystemRoleLabel(value: AdminUserListItem["systemRole"]) {
  switch (value) {
    case "super_admin":
      return "Super admin";
    case "admin":
      return "Admin";
    default:
      return "Usuario";
  }
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

function UserActionsMenu({ row }: { row: AdminUserListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function runToggle() {
    const formData = new FormData();
    formData.set("userId", row.id);
    formData.set("nextIsActive", String(!row.isActive));
    formData.set("scope", "internal");

    startTransition(async () => {
      const result = await toggleAdminUserActiveAction(formData);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "Nao foi possivel atualizar este usuario.");
    });
  }

  function runPasswordReset() {
    const formData = new FormData();
    formData.set("userId", row.id);
    formData.set("scope", "internal");

    startTransition(async () => {
      const result = await sendAdminUserPasswordResetAction(formData);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "Nao foi possivel enviar o reset de senha.");
    });
  }

  return (
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
        <DropdownMenuItem disabled={isPending} onClick={runToggle}>
          <PowerIcon className="size-4" />
          {row.isActive ? "Desativar" : "Reativar"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPending || !row.email}
          onClick={runPasswordReset}
        >
          <KeyRoundIcon className="size-4" />
          Resetar senha
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminUsersTable({ organizations, rows }: AdminUsersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = React.useMemo<ColumnDef<AdminUserListItem>[]>(
    () => [
      {
        id: "user",
        accessorFn: (row) => row.fullName ?? row.email ?? "",
        header: ({ column }) => <SortableHeader column={column} title="Usuario" />,
        cell: ({ row }) => (
          <div className="min-w-[14rem]">
            <p className="font-medium text-foreground">
              {row.original.fullName ?? "Usuario sem nome"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.original.email ?? "Sem e-mail"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Criado em {formatDate(row.original.createdAt)}
            </p>
          </div>
        ),
        enableHiding: false,
        filterFn: (row, _id, value) => {
          const search = String(value ?? "").trim().toLowerCase();

          if (!search) {
            return true;
          }

          return [
            row.original.fullName,
            row.original.email,
            row.original.memberships
              .map((membership) => membership.organizationName)
              .join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);
        },
      },
      {
        accessorKey: "accessType",
        header: "Acesso",
        cell: ({ row }) => (
          <div className="flex min-w-[9rem] flex-col items-start gap-2">
            <Badge variant="outline">
              {formatAccessType(row.original.accessType)}
            </Badge>
            <Badge variant="secondary">
              {getSystemRoleLabel(row.original.systemRole)}
            </Badge>
          </div>
        ),
        filterFn: (row, id, value) => {
          if (value === "all") {
            return true;
          }

          return row.getValue(id) === value;
        },
      },
      {
        id: "organizations",
        header: "Organizacoes",
        cell: ({ row }) => (
          <div className="min-w-[15rem] space-y-2 text-sm">
            {row.original.memberships.length > 0 ? (
              row.original.memberships.slice(0, 3).map((membership) => (
                <div key={`${row.original.id}:${membership.organizationId}`}>
                  <p className="font-medium text-foreground">
                    {membership.organizationName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {membership.role} {membership.isActive ? "ativo" : "inativo"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Sem organizacao vinculada.</p>
            )}
            {row.original.memberships.length > 3 ? (
              <p className="text-xs text-muted-foreground">
                +{row.original.memberships.length - 3} organizacao(oes)
              </p>
            ) : null}
          </div>
        ),
        filterFn: (row, _id, value) => {
          if (value === "all") {
            return true;
          }

          return row.original.memberships.some(
            (membership) => membership.organizationId === value,
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "destructive"}>
            {row.original.isActive ? "Conta ativa" : "Conta inativa"}
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
        accessorKey: "lastSignedInAt",
        header: ({ column }) => (
          <SortableHeader column={column} title="Ultimo acesso" />
        ),
        cell: ({ row }) => (
          <div className="min-w-[10rem] text-sm">
            <p className="font-medium text-foreground">
              {formatDate(row.original.lastSignedInAt)}
            </p>
            <p className="mt-1 text-muted-foreground">
              Sessao controlada pelo painel
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <UserActionsMenu row={row.original} />,
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) =>
              table.getColumn("user")?.setFilterValue(event.target.value)
            }
            placeholder="Filtrar usuarios..."
            value={(table.getColumn("user")?.getFilterValue() as string) ?? ""}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            onValueChange={(value) =>
              table.getColumn("isActive")?.setFilterValue(value)
            }
            value={
              (table.getColumn("isActive")?.getFilterValue() as string) ?? "all"
            }
          >
            <SelectTrigger className="w-full sm:w-[9rem]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              table.getColumn("accessType")?.setFilterValue(value)
            }
            value={
              (table.getColumn("accessType")?.getFilterValue() as string) ?? "all"
            }
          >
            <SelectTrigger className="w-full sm:w-[10rem]">
              <SelectValue placeholder="Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="internal">Interno</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="hybrid">Hibrido</SelectItem>
              <SelectItem value="unassigned">Sem acesso</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              table.getColumn("organizations")?.setFilterValue(value)
            }
            value={
              (table.getColumn("organizations")?.getFilterValue() as string) ??
              "all"
            }
          >
            <SelectTrigger className="w-full sm:w-[14rem]">
              <SelectValue placeholder="Organizacao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas organizacoes</SelectItem>
              {organizations.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full sm:w-auto" variant="outline">
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
                    {columnLabels[column.id] ?? column.id}
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
                  Nenhum usuario encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} usuario(s) encontrado(s).
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="hidden items-center gap-2 md:flex">
            <Label htmlFor="users-rows-per-page">Linhas por pagina</Label>
            <Select
              onValueChange={(value) => table.setPageSize(Number(value))}
              value={`${table.getState().pagination.pageSize}`}
            >
              <SelectTrigger className="w-20" id="users-rows-per-page">
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
    </div>
  );
}
