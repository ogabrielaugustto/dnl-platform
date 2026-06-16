"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, PowerIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import {
  sendAdminUserPasswordResetAction,
  toggleAdminUserActiveAction,
} from "@/app/actions/admin-management";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminOrganizationListItem, AdminUserListItem } from "@/lib/dal/admin-management";

type AdminUsersTableProps = {
  organizations: AdminOrganizationListItem[];
  rows: AdminUserListItem[];
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

function UserActionButtons({ row }: { row: AdminUserListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runToggle() {
    const formData = new FormData();
    formData.set("userId", row.id);
    formData.set("nextIsActive", String(!row.isActive));

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
    <div className="flex min-w-[14rem] flex-wrap gap-2">
      <Button
        disabled={isPending}
        onClick={runToggle}
        size="sm"
        variant={row.isActive ? "outline" : "default"}
      >
        <PowerIcon className="size-4" />
        {row.isActive ? "Desativar" : "Reativar"}
      </Button>
      <Button
        disabled={isPending || !row.email}
        onClick={runPasswordReset}
        size="sm"
        variant="outline"
      >
        <KeyRoundIcon className="size-4" />
        Resetar senha
      </Button>
    </div>
  );
}

export function AdminUsersTable({ organizations, rows }: AdminUsersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        normalizedSearch &&
        ![
          row.fullName,
          row.email,
          row.memberships.map((membership) => membership.organizationName).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (statusFilter !== "all") {
        const expectedActive = statusFilter === "active";

        if (row.isActive !== expectedActive) {
          return false;
        }
      }

      if (accessFilter !== "all" && row.accessType !== accessFilter) {
        return false;
      }

      if (
        organizationFilter !== "all" &&
        !row.memberships.some(
          (membership) => membership.organizationId === organizationFilter,
        )
      ) {
        return false;
      }

      return true;
    });
  }, [accessFilter, organizationFilter, rows, search, statusFilter]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros de acesso</p>
              <p className="text-sm text-muted-foreground">
                Pesquise por nome, e-mail, organizacao e estado da conta.
              </p>
            </div>
            <Badge variant="outline">{filteredRows.length} usuario(s)</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Buscar usuario
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, e-mail ou organizacao"
                  value={search}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </label>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Tipo de acesso
              </label>
              <Select onValueChange={setAccessFilter} value={accessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os acessos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="hybrid">Hibrido</SelectItem>
                  <SelectItem value="unassigned">Sem acesso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Organizacao
              </label>
              <Select onValueChange={setOrganizationFilter} value={organizationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as organizacoes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as organizacoes</SelectItem>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 xl:col-span-2">
              <Button
                className="w-full xl:w-auto"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setAccessFilter("all");
                  setOrganizationFilter("all");
                }}
                type="button"
                variant="ghost"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead>Organizacoes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ultimo acesso</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="align-top">
                    <div className="min-w-[14rem]">
                      <p className="font-medium text-foreground">
                        {row.fullName ?? "Usuario sem nome"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.email ?? "Sem e-mail"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Criado em {formatDate(row.createdAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex min-w-[12rem] flex-col gap-2">
                      <Badge variant="outline">{formatAccessType(row.accessType)}</Badge>
                      <Badge variant="secondary">{getSystemRoleLabel(row.systemRole)}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[16rem] space-y-2 text-sm">
                      {row.memberships.length > 0 ? (
                        row.memberships.slice(0, 3).map((membership) => (
                          <div key={`${row.id}:${membership.organizationId}`}>
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
                      {row.memberships.length > 3 ? (
                        <p className="text-xs text-muted-foreground">
                          +{row.memberships.length - 3} organizacao(oes)
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={row.isActive ? "secondary" : "destructive"}>
                      {row.isActive ? "Conta ativa" : "Conta inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[10rem] text-sm">
                      <p className="font-medium text-foreground">
                        {formatDate(row.lastSignedInAt)}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Sessao controlada pelo painel
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <UserActionButtons row={row} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-28 text-center" colSpan={6}>
                  Nenhum usuario encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
