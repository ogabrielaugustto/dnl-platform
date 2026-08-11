"use client";

import { useMemo, useState } from "react";
import { ActivityIcon, SearchIcon } from "lucide-react";
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
import type { AdminActivityPageData } from "@/lib/dal/admin-management";

type AdminActivitiesTableProps = AdminActivityPageData;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAction(value: string) {
  switch (value) {
    case "user_invited":
      return "Convite enviado";
    case "user_access_updated":
      return "Acesso atualizado";
    case "user_activated":
      return "Usuario reativado";
    case "user_deactivated":
      return "Usuario desativado";
    case "password_reset_sent":
      return "Reset de senha enviado";
    case "client_scan_frequency_updated":
      return "Frequencia de monitoramento atualizada";
    case "monitoring_source_created":
      return "Fonte monitorada cadastrada";
    case "monitoring_source_updated":
      return "Fonte monitorada atualizada";
    case "monitoring_source_activated":
      return "Fonte monitorada ativada";
    case "monitoring_source_paused":
      return "Fonte monitorada pausada";
    case "marcada_como_possivel_infracao":
      return "Caso marcado como possivel infracao";
    case "marcada_como_uso_nao_autorizado":
      return "Caso marcado como uso nao autorizado";
    case "notificacao_enviada":
      return "Notificacao enviada";
    case "marcada_como_resolvida":
      return "Caso resolvido";
    case "marcada_como_ignorada":
      return "Caso ignorado";
    case "marcada_como_uso_autorizado":
      return "Uso autorizado";
    default:
      return value.replaceAll("_", " ");
  }
}

function formatEntity(value: string) {
  switch (value) {
    case "user":
      return "Usuario";
    case "case":
      return "Caso";
    case "monitoring_source":
      return "Fonte monitorada";
    case "organization":
      return "Organizacao";
    default:
      return value.replaceAll("_", " ");
  }
}

export function AdminActivitiesTable({
  internalUsers,
  rows,
}: AdminActivitiesTableProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        normalizedSearch &&
        ![
          row.actor.name,
          row.actor.email,
          row.organization.name,
          row.action,
          row.entity,
          row.summary,
          row.detail,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (sourceFilter !== "all" && row.source !== sourceFilter) {
        return false;
      }

      if (userFilter !== "all" && row.actor.id !== userFilter) {
        return false;
      }

      return true;
    });
  }, [rows, search, sourceFilter, userFilter]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros de atividade</p>
              <p className="text-sm text-muted-foreground">
                Acompanhe o historico interno da equipe DNL por usuario, tipo e contexto da acao.
              </p>
            </div>
            <Badge variant="outline">{filteredRows.length} atividade(s)</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Buscar atividade
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Usuario, organizacao, acao ou contexto"
                  value={search}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Tipo
              </label>
              <Select onValueChange={setSourceFilter} value={sourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as fontes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="audit">Gestao admin</SelectItem>
                  <SelectItem value="case">Andamento de caso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Usuario interno
              </label>
              <Select onValueChange={setUserFilter} value={userFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {internalUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Button
              onClick={() => {
                setSearch("");
                setSourceFilter("all");
                setUserFilter("all");
              }}
              type="button"
              variant="ghost"
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Atividade</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Contexto</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="align-top">
                    <div className="min-w-[16rem]">
                      <p className="font-medium text-foreground">
                        {formatAction(row.action)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {row.summary ?? formatEntity(row.entity)}
                      </p>
                      {row.detail ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.detail}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[12rem]">
                      <p className="font-medium text-foreground">
                        {row.actor.name ?? "Equipe DNL"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.actor.email ?? "Sem e-mail"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[14rem] text-sm">
                      <p className="font-medium text-foreground">
                        {row.organization.name ?? "Sem organizacao"}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {formatEntity(row.entity)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex min-w-[10rem] flex-col gap-2">
                      <Badge variant="outline">
                        <ActivityIcon className="size-3.5" />
                        {row.source === "audit" ? "Gestao admin" : "Caso"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">{formatDate(row.occurredAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-28 text-center" colSpan={5}>
                  Nenhuma atividade encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
