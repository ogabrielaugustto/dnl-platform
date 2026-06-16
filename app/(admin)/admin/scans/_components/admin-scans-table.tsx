"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
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
import type { AdminScanListItem } from "@/lib/dal/admin-scans";
import { formatPublicId } from "@/lib/public-id";

type AdminScansTableProps = {
  rows: AdminScanListItem[];
};

function formatDate(value: string | null, emptyLabel = "Ainda nao iniciou") {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(value: number | null) {
  if (typeof value !== "number" || value < 0) {
    return "Duracao indisponivel";
  }

  if (value < 1000) {
    return `${value} ms`;
  }

  const seconds = value / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} min ${remainingSeconds}s`;
}

function formatJobType(value: AdminScanListItem["type"]) {
  switch (value) {
    case "manual_scan":
      return "Manual";
    case "scheduled_scan":
      return "Agendada";
    case "retry_scan":
      return "Reprocessamento";
    default:
      return value;
  }
}

function formatJobStatus(value: AdminScanListItem["status"]) {
  switch (value) {
    case "pending":
      return "Na fila";
    case "processing":
      return "Processando";
    case "completed":
      return "Concluida";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelada";
    default:
      return value;
  }
}

function formatRunStatus(value: NonNullable<AdminScanListItem["latestRun"]>["status"]) {
  switch (value) {
    case "started":
      return "Iniciada";
    case "vision_completed":
      return "Busca concluida";
    case "evidence_pending":
      return "Evidencias pendentes";
    case "completed":
      return "Execucao concluida";
    case "failed":
      return "Execucao falhou";
    default:
      return value;
  }
}

function formatFrequency(value: NonNullable<AdminScanListItem["monitoringRule"]>["frequency"]) {
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
      return value;
  }
}

function getBadgeVariantForJobStatus(status: AdminScanListItem["status"]) {
  switch (status) {
    case "processing":
      return "default";
    case "completed":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function getBadgeVariantForRunStatus(
  status: NonNullable<AdminScanListItem["latestRun"]>["status"] | "none",
) {
  switch (status) {
    case "completed":
      return "secondary";
    case "failed":
      return "destructive";
    case "started":
    case "vision_completed":
    case "evidence_pending":
      return "default";
    default:
      return "outline";
  }
}

function formatRequester(row: AdminScanListItem) {
  if (row.requestedBy?.fullName || row.requestedBy?.email) {
    return row.requestedBy.fullName ?? row.requestedBy.email ?? "Usuario interno";
  }

  return row.type === "scheduled_scan" ? "Sistema DNL" : "Sem solicitante";
}

function formatShortId(value: string) {
  return value.slice(0, 8);
}

export function AdminScansTable({ rows }: AdminScansTableProps) {
  const [search, setSearch] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [runStatusFilter, setRunStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const organizations = useMemo(
    () =>
      Array.from(
        new Map(
          rows.map((row) => [
            row.organization.id,
            { id: row.organization.id, name: row.organization.name },
          ]),
        ).values(),
      ).sort((left, right) => left.name.localeCompare(right.name)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        normalizedSearch &&
        ![
          row.id,
          row.organization.name,
          row.asset.title,
          row.asset.publicId ? String(row.asset.publicId) : "",
          row.monitoringRule?.name,
          row.requestedBy?.fullName,
          row.requestedBy?.email,
          row.latestRun?.workerId,
          row.errorMessage,
          row.latestRun?.errorMessage,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (organizationFilter !== "all" && row.organization.id !== organizationFilter) {
        return false;
      }

      if (jobStatusFilter !== "all" && row.status !== jobStatusFilter) {
        return false;
      }

      if (typeFilter !== "all" && row.type !== typeFilter) {
        return false;
      }

      if (runStatusFilter === "none") {
        return row.latestRun === null;
      }

      if (runStatusFilter !== "all" && row.latestRun?.status !== runStatusFilter) {
        return false;
      }

      return true;
    });
  }, [jobStatusFilter, organizationFilter, rows, runStatusFilter, search, typeFilter]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros das varreduras</p>
              <p className="text-sm text-muted-foreground">
                Pesquise por cliente, imagem, regra, solicitante, worker ou erro
                para acompanhar a fila completa.
              </p>
            </div>
            <Badge variant="outline">{filteredRows.length} varredura(s)</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Buscar varredura
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cliente, imagem, regra, usuario, worker ou erro"
                  value={search}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Cliente
              </label>
              <Select onValueChange={setOrganizationFilter} value={organizationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Status da fila
              </label>
              <Select onValueChange={setJobStatusFilter} value={jobStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Na fila</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="completed">Concluidas</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Tipo
              </label>
              <Select onValueChange={setTypeFilter} value={typeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="manual_scan">Manual</SelectItem>
                  <SelectItem value="scheduled_scan">Agendada</SelectItem>
                  <SelectItem value="retry_scan">Reprocessamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Ultima execucao
              </label>
              <Select onValueChange={setRunStatusFilter} value={runStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer estado</SelectItem>
                  <SelectItem value="none">Sem execucao</SelectItem>
                  <SelectItem value="started">Iniciada</SelectItem>
                  <SelectItem value="vision_completed">Busca concluida</SelectItem>
                  <SelectItem value="evidence_pending">Evidencias pendentes</SelectItem>
                  <SelectItem value="completed">Execucao concluida</SelectItem>
                  <SelectItem value="failed">Execucao falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end xl:col-span-3">
              <Button
                onClick={() => {
                  setSearch("");
                  setOrganizationFilter("all");
                  setJobStatusFilter("all");
                  setRunStatusFilter("all");
                  setTypeFilter("all");
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
        <Table className="table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Varredura</TableHead>
              <TableHead>Cliente e imagem</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Andamento</TableHead>
              <TableHead>Execucao</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => {
                const latestError =
                  row.latestRun?.errorMessage ?? row.errorMessage ?? null;

                return (
                  <TableRow key={row.id}>
                    <TableCell className="align-top">
                      <div className="min-w-0 max-w-[14rem]">
                        <p className="font-medium text-foreground">
                          Job {formatShortId(row.id)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Agendada em {formatDate(row.scheduledAt)}
                        </p>
                        <p className="mt-2 break-words text-xs text-muted-foreground">
                          Solicitante: {formatRequester(row)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="min-w-0 max-w-[16rem]">
                        <p className="font-medium text-foreground">
                          {row.organization.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {row.asset.publicId
                            ? `Imagem ${formatPublicId(row.asset.publicId)}`
                            : "Imagem sem ID publico"}
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {row.asset.title ?? "Titulo nao informado"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex min-w-0 max-w-[14rem] flex-col gap-2">
                        <Badge variant="outline">{formatJobType(row.type)}</Badge>
                        <div className="text-sm">
                          <p className="break-words font-medium text-foreground">
                            {row.monitoringRule?.name ?? "Sem regra vinculada"}
                          </p>
                          <p className="mt-1 break-words text-xs text-muted-foreground">
                            {row.monitoringRule
                              ? `${formatFrequency(row.monitoringRule.frequency)} ${row.monitoringRule.isActive ? "ativa" : "pausada"}`
                              : "Disparo manual ou legado"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="min-w-0 max-w-[12rem] space-y-2">
                        <Badge variant={getBadgeVariantForJobStatus(row.status)}>
                          {formatJobStatus(row.status)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Tentativas: {row.attempts}/{row.maxAttempts}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Prioridade {row.priority}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="min-w-0 max-w-[16rem] space-y-2">
                        <Badge
                          variant={getBadgeVariantForRunStatus(
                            row.latestRun?.status ?? "none",
                          )}
                        >
                          {row.latestRun
                            ? formatRunStatus(row.latestRun.status)
                            : "Sem execucao"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Inicio: {formatDate(row.latestRun?.startedAt ?? row.startedAt)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fim:{" "}
                          {formatDate(
                            row.latestRun?.finishedAt ?? row.finishedAt,
                            "Ainda em andamento",
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.latestRun
                            ? `Tentativa #${row.latestRun.attemptNumber} • ${formatDuration(row.latestRun.durationMs)}`
                            : "Aguardando worker"}
                        </p>
                        {row.latestRun?.workerId ? (
                          <p className="break-all text-xs text-muted-foreground">
                            Worker: {row.latestRun.workerId}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="min-w-0 max-w-[20rem] space-y-2">
                        <Badge variant={row.detections.count > 0 ? "default" : "outline"}>
                          {row.detections.count} ocorrencia(s)
                        </Badge>
                        {row.detections.publicIds.length > 0 ? (
                          <p className="max-w-full whitespace-normal break-all text-xs text-muted-foreground">
                            IDs:{" "}
                            {row.detections.publicIds
                              .map((publicId) => formatPublicId(publicId))
                              .join(", ")}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Nenhuma ocorrencia vinculada.
                          </p>
                        )}
                        {latestError ? (
                          <p className="max-w-full whitespace-normal break-all text-xs text-destructive">
                            {latestError}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Sem erro registrado.
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="h-28 text-center" colSpan={6}>
                  Nenhuma varredura encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
