"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3Icon, SearchIcon } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
      return "Sem limite definido";
  }
}

function formatLimit(value: number | null, unit: string) {
  if (value === null) {
    return "Sem limite";
  }

  return `${value.toLocaleString("pt-BR")} ${unit}`;
}

function EditPlanDialog({ row }: { row: AdminPlanListItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState(row.billingInterval);
  const [scanFrequencyCap, setScanFrequencyCap] = useState(row.scanFrequencyCap ?? "none");
  const [isActive, setIsActive] = useState(row.isActive ? "true" : "false");
  const [isPending, startTransition] = useTransition();

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
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "Nao foi possivel atualizar este plano.");
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit3Icon className="size-4" />
          Editar
        </Button>
      </DialogTrigger>
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
              <label
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                htmlFor={`plan-name-${row.id}`}
              >
                Nome
              </label>
              <Input
                defaultValue={row.name}
                disabled={isPending}
                id={`plan-name-${row.id}`}
                name="name"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                htmlFor={`plan-code-${row.id}`}
              >
                Codigo
              </label>
              <Input
                disabled
                id={`plan-code-${row.id}`}
                value={row.code}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
              htmlFor={`plan-description-${row.id}`}
            >
              Descricao
            </label>
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
              <label
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                htmlFor={`plan-price-${row.id}`}
              >
                Preco
              </label>
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
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Periodicidade
              </label>
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
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </label>
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
              <label
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                htmlFor={`plan-assets-${row.id}`}
              >
                Limite de imagens
              </label>
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
              <label
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                htmlFor={`plan-team-${row.id}`}
              >
                Limite de usuarios
              </label>
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
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Frequencia maxima
              </label>
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intervalFilter, setIntervalFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        normalizedSearch &&
        ![row.code, row.name, row.description]
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

      if (intervalFilter !== "all" && row.billingInterval !== intervalFilter) {
        return false;
      }

      return true;
    });
  }, [intervalFilter, rows, search, statusFilter]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros de planos</p>
              <p className="text-sm text-muted-foreground">
                Busque por nome, codigo, status e periodicidade.
              </p>
            </div>
            <Badge variant="outline">{filteredRows.length} plano(s)</Badge>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Buscar plano
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, codigo ou descricao"
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
                Periodicidade
              </label>
              <Select onValueChange={setIntervalFilter} value={intervalFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setIntervalFilter("all");
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
              <TableHead>Plano</TableHead>
              <TableHead>Preco</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Assinaturas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="align-top">
                    <div className="min-w-[16rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{row.name}</p>
                      </div>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        {row.description ?? "Sem descricao cadastrada."}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Atualizado em {formatDate(row.updatedAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[10rem]">
                      <p className="font-semibold text-foreground">
                        {formatPlanPrice(row.priceCents, row.currency)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatBillingInterval(row.billingInterval)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[13rem] space-y-1 text-sm">
                      <p>{formatLimit(row.maxAssets, "imagem(ns)")}</p>
                      <p>{formatLimit(row.maxTeamMembers, "usuario(s)")}</p>
                      <p className="text-muted-foreground">
                        {formatScanFrequency(row.scanFrequencyCap)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-[10rem] text-sm">
                      <p className="font-medium text-foreground">
                        {row.activeSubscriptions}/{row.totalSubscriptions}
                      </p>
                      <p className="mt-1 text-muted-foreground">ativas ou operacionais</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={row.isActive ? "secondary" : "destructive"}>
                      {row.isActive ? "Plano ativo" : "Plano inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <EditPlanDialog row={row} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-28 text-center" colSpan={6}>
                  Nenhum plano encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
