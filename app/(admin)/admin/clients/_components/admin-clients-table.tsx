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
import {
  buildAdminClientTableRows,
  filterAdminClientTableRows,
  type AdminClientTableRow,
} from "./admin-clients-table-helpers";

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

function formatMembershipRole(value: "owner" | "admin" | "member" | null) {
  switch (value) {
    case "owner":
      return "Responsavel";
    case "admin":
      return "Administrador";
    case "member":
      return "Membro";
    default:
      return "Sem acesso";
  }
}

function formatAccessStatus(value: boolean | null) {
  if (value === null) {
    return "Sem acesso";
  }

  return value ? "Acesso ativo" : "Acesso bloqueado";
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
    <div className="flex min-w-[13rem] flex-wrap gap-2">
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
    <div className="min-w-[12rem]">
      <Select
        disabled={isPending}
        onValueChange={handleChange}
        value={currentValue}
      >
        <SelectTrigger className="h-9 w-full">
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
    </div>
  );
}

function ClientActionsCell({ row }: { row: AdminClientTableRow }) {
  if (!row.userId) {
    return <span className="text-sm text-muted-foreground">Sem acesso</span>;
  }

  return (
    <ClientUserActionButtons
      email={row.email}
      isActive={row.userIsActive ?? false}
      userId={row.userId}
    />
  );
}

export function AdminClientsTable({ rows }: AdminClientsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const tableRows = useMemo(() => buildAdminClientTableRows(rows), [rows]);

  const filteredRows = useMemo(() => {
    return filterAdminClientTableRows(tableRows, {
      organizationFilter,
      roleFilter,
      search,
      statusFilter,
    });
  }, [organizationFilter, roleFilter, search, statusFilter, tableRows]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1.5fr)_repeat(3,minmax(10rem,1fr))_auto]">
            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="flex items-end">
              <Button
                className="w-full md:w-auto"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setRoleFilter("all");
                  setOrganizationFilter("all");
                }}
                type="button"
                variant="ghost"
              >
                Limpar
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {filteredRows.length} linha(s) exibida(s) de {tableRows.length}.
          </p>
        </div>
      </div>

      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Organizacao</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Monitoramento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ultimo acesso</TableHead>
            <TableHead>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.length > 0 ? (
            filteredRows.map((row) => (
              <TableRow key={`${row.organizationId}:${row.userId ?? "sem-acesso"}`}>
                <TableCell className="align-top">
                  <div className="min-w-[14rem]">
                    <p className="font-medium text-foreground">
                      {row.fullName ?? "Sem acesso cadastrado"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.email ?? "Convide um usuario para este cliente"}
                    </p>
                    {row.userCreatedAt ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Criado em {formatDate(row.userCreatedAt)}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="min-w-[15rem]">
                    <p className="font-medium text-foreground">{row.organizationName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.organizationBillingEmail ?? "Sem e-mail de cobranca"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Org. criada em {formatDate(row.organizationCreatedAt)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="min-w-[10rem] text-sm">
                    <p className="font-medium text-foreground">
                      {row.planName ?? "Basic manual"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {formatSubscriptionStatus(row.subscriptionStatus)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.activeClientUsers}/{row.totalClientUsers} acesso(s)
                    </p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-2">
                    <ClientFrequencyControl
                      organizationId={row.organizationId}
                      organizationName={row.organizationName}
                      value={row.scanFrequency}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatMonitoringFrequency(row.scanFrequency)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="min-w-[10rem] text-sm">
                    <p className="font-medium text-foreground">
                      {row.organizationIsActive ? "Cliente ativo" : "Cliente inativo"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {formatAccessStatus(row.userIsActive)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatMembershipRole(row.role)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="min-w-[10rem] text-sm">
                    <p className="font-medium text-foreground">
                      {formatDate(row.lastSignedInAt)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Login individual do cliente
                    </p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <ClientActionsCell row={row} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-28 text-center" colSpan={7}>
                Nenhum cliente encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
