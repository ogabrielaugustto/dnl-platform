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
import type { AdminOrganizationListItem } from "@/lib/dal/admin-management";

type AdminOrganizationsTableProps = {
  rows: AdminOrganizationListItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminOrganizationsTable({ rows }: AdminOrganizationsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        normalizedSearch &&
        ![row.name, row.document, row.billingEmail]
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

      return true;
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros de organizacao</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome, documento ou e-mail de cobranca.
              </p>
            </div>
            <Badge variant="outline">{filteredRows.length} organizacao(oes)</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-3">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Buscar organizacao
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Empresa, documento ou e-mail"
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
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
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
              <TableHead>Organizacao</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Cobranca</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="align-top">
                    <div className="min-w-[16rem]">
                      <p className="font-medium text-foreground">{row.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{row.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {row.document ?? "Nao informado"}
                  </TableCell>
                  <TableCell className="align-top">
                    {row.billingEmail ?? "Sem e-mail de cobranca"}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[11rem] text-sm">
                      <p className="font-medium text-foreground">
                        {row.activeMembers} ativo(s)
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {row.totalMembers} membro(s) no total
                      </p>
                      {row.internalAdmins > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.internalAdmins} admin(s) interno(s) vinculado(s)
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={row.isActive ? "secondary" : "destructive"}>
                      {row.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-28 text-center" colSpan={6}>
                  Nenhuma organizacao encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
