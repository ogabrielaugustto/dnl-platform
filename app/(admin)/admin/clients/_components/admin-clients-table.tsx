"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, PowerIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { updateClientScanFrequencyAction } from "@/app/actions/admin-clients";
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
import type { AdminClientListItem } from "@/lib/dal/admin-clients";
import {
  formatMonitoringFrequency,
  monitoringFrequencyOptions,
} from "@/lib/monitoring-frequency";

type AdminClientsTableProps = {
  rows: AdminClientListItem[];
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

function formatSubscriptionStatus(value: string | null) {
  switch (value) {
    case "trialing":
      return "Trial";
    case "active":
      return "Ativa";
    case "past_due":
      return "Pagamento pendente";
    case "paused":
      return "Pausada";
    case "cancelled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    default:
      return "Sem assinatura";
  }
}

function formatMembershipRole(value: "owner" | "admin" | "member") {
  switch (value) {
    case "owner":
      return "Responsavel";
    case "admin":
      return "Administrador";
    default:
      return "Membro";
  }
}

function ClientUserActionButtons({
  isActive,
  userId,
  email,
}: {
  email: string | null;
  isActive: boolean;
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function runToggle() {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("nextIsActive", String(!isActive));
    formData.set("scope", "client");

    startTransition(async () => {
      const result = await toggleAdminUserActiveAction(formData);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "Nao foi possivel atualizar este acesso.");
    });
  }

  function runPasswordReset() {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("scope", "client");

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
    <div className="flex min-w-[14rem] flex-wrap justify-end gap-2">
      <Button
        disabled={isPending}
        onClick={runToggle}
        size="sm"
        variant={isActive ? "outline" : "default"}
      >
        <PowerIcon className="size-4" />
        {isActive ? "Desativar" : "Reativar"}
      </Button>
      <Button
        disabled={isPending || !email}
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

function ClientFrequencyControl({
  organizationId,
  organizationName,
  value,
}: {
  organizationId: string;
  organizationName: string;
  value: AdminClientListItem["scanFrequency"];
}) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextValue: AdminClientListItem["scanFrequency"]) {
    setCurrentValue(nextValue);

    const formData = new FormData();
    formData.set("organizationId", organizationId);
    formData.set("frequency", nextValue);

    startTransition(async () => {
      const result = await updateClientScanFrequencyAction(formData);

      if (result.status === "success") {
        toast.success(`${organizationName}: ${result.message}`);
        router.refresh();
        return;
      }

      setCurrentValue(value);
      toast.error(result.message ?? "Nao foi possivel salvar a frequencia.");
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Acoes
      </p>
      <Select
        disabled={isPending}
        onValueChange={handleChange}
        value={currentValue}
      >
        <SelectTrigger className="w-full min-w-[14rem]">
          <SelectValue placeholder="Selecione a frequencia" />
        </SelectTrigger>
        <SelectContent>
          {monitoringFrequencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Salva automaticamente ao trocar a frequencia.
      </p>
    </div>
  );
}

export function AdminClientsTable({ rows }: AdminClientsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows
      .map((row) => {
        const organizationMatchesSearch =
          !normalizedSearch ||
          [row.name, row.billingEmail]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        const baseUsers = row.clientUsers.filter((user) => {
          if (statusFilter !== "all") {
            const expectedActive = statusFilter === "active";

            if (user.isActive !== expectedActive) {
              return false;
            }
          }

          if (roleFilter !== "all" && user.role !== roleFilter) {
            return false;
          }

          return true;
        });

        const visibleUsers = normalizedSearch
          ? organizationMatchesSearch
            ? baseUsers
            : baseUsers.filter((user) =>
                [user.fullName, user.email].join(" ").toLowerCase().includes(normalizedSearch),
              )
          : baseUsers;

        return {
          ...row,
          visibleUsers,
        };
      })
      .filter((row) => {
        if (organizationFilter !== "all" && row.id !== organizationFilter) {
          return false;
        }

        const hasSearch = normalizedSearch.length > 0;
        const hasMemberFilters = statusFilter !== "all" || roleFilter !== "all";

        if (!hasSearch && statusFilter === "all" && roleFilter === "all") {
          return true;
        }

        const organizationMatchesSearch =
          !hasSearch ||
          [row.name, row.billingEmail]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        if (!hasSearch && hasMemberFilters) {
          return row.visibleUsers.length > 0;
        }

        return organizationMatchesSearch || row.visibleUsers.length > 0;
      });
  }, [organizationFilter, roleFilter, rows, search, statusFilter]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros de clientes</p>
              <p className="text-sm text-muted-foreground">
                Busque por cliente, organizacao, status do acesso e papel do usuario.
              </p>
            </div>
            <Badge variant="outline">{filteredRows.length} cliente(s)</Badge>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Buscar cliente
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cliente, e-mail ou organizacao"
                  value={search}
                />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </label>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Papel de acesso
              </label>
              <Select onValueChange={setRoleFilter} value={roleFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os perfis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="owner">Responsavel</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Organizacao
              </label>
              <Select onValueChange={setOrganizationFilter} value={organizationFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as organizacoes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as organizacoes</SelectItem>
                  {rows.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setRoleFilter("all");
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

      <div className="space-y-4 p-4 md:p-5">
        {filteredRows.length > 0 ? (
          filteredRows.map((row) => (
            <section
              key={row.id}
              className="overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="grid gap-4 border-b border-border px-4 py-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">{row.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.billingEmail ?? "Sem e-mail de cobranca"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Criado em {formatDate(row.createdAt)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={row.isActive ? "secondary" : "destructive"}>
                      {row.isActive ? "Cliente ativo" : "Cliente inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {formatSubscriptionStatus(row.subscriptionStatus)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Plano: <span className="font-medium text-foreground">{row.planName ?? "Basic manual"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Frequencia atual:{" "}
                    <span className="font-medium text-foreground">
                      {formatMonitoringFrequency(row.scanFrequency)}
                    </span>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-lg border border-border bg-card px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Acessos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {row.activeClientUsers}/{row.totalClientUsers}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ativos nesta organizacao
                    </p>
                  </div>
                  <ClientFrequencyControl
                    organizationId={row.id}
                    organizationName={row.name}
                    value={row.scanFrequency}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ultimo acesso</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {row.visibleUsers.length > 0 ? (
                      row.visibleUsers.map((user) => (
                        <TableRow key={`${row.id}:${user.userId}`}>
                          <TableCell className="align-top">
                            <div className="min-w-[14rem]">
                              <p className="font-medium text-foreground">
                                {user.fullName ?? "Cliente sem nome"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {user.email ?? "Sem e-mail"}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                Criado em {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="min-w-[10rem]">
                              <Badge variant="outline">
                                {formatMembershipRole(user.role)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge variant={user.isActive ? "secondary" : "destructive"}>
                              {user.isActive ? "Acesso ativo" : "Acesso bloqueado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="min-w-[10rem] text-sm">
                              <p className="font-medium text-foreground">
                                {formatDate(user.lastSignedInAt)}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                Login individual do cliente
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <ClientUserActionButtons
                              email={user.email}
                              isActive={user.isActive}
                              userId={user.userId}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="h-24 text-center" colSpan={5}>
                          Nenhum acesso de cliente encontrado para os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Nenhum cliente encontrado
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste os filtros para localizar a organizacao ou o acesso que voce quer administrar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
