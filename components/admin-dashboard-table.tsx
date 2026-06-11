"use client";

import * as React from "react";
import Link from "next/link";
import type {
  AdminDashboardCaseRow,
  AdminDashboardDetectionRow,
  AdminDashboardUserRow,
} from "@/lib/dal/admin-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDetectionStatus, getDetectionStatusVariant } from "@/lib/detection-ui";
import { formatPublicId } from "@/lib/public-id";

type AdminDashboardTableProps = {
  cases: AdminDashboardCaseRow[];
  detections: AdminDashboardDetectionRow[];
  users: AdminDashboardUserRow[];
};

type DashboardTabValue = "cases" | "detections" | "users";

const tabMeta: Record<
  DashboardTabValue,
  {
    actionHref: string;
    actionLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    label: string;
  }
> = {
  cases: {
    actionHref: "/admin/detections",
    actionLabel: "Abrir fila",
    emptyTitle: "Nenhum caso recente",
    emptyDescription:
      "Os casos aparecem aqui quando uma ocorrencia e marcada como nao autorizada.",
    label: "Casos",
  },
  detections: {
    actionHref: "/admin/detections",
    actionLabel: "Ver ocorrencias",
    emptyTitle: "Nenhuma ocorrencia recente",
    emptyDescription:
      "Quando o worker detectar novas paginas, elas aparecem nesta aba.",
    label: "Ocorrencias",
  },
  users: {
    actionHref: "/admin/clients",
    actionLabel: "Ver clientes",
    emptyTitle: "Nenhum usuario novo",
    emptyDescription:
      "Novos cadastros e convites ativos aparecem aqui para acompanhamento.",
    label: "Usuarios",
  },
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

function formatDomain(value: string | null) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

function formatSystemRole(value: AdminDashboardUserRow["systemRole"]) {
  switch (value) {
    case "super_admin":
      return "Super admin";
    case "admin":
      return "Admin";
    default:
      return "Usuario";
  }
}

function formatMembershipRole(value: AdminDashboardUserRow["membershipRole"]) {
  switch (value) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin da org";
    case "member":
      return "Membro";
    default:
      return "Sem organizacao";
  }
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function CasesTable({ rows }: { rows: AdminDashboardCaseRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={tabMeta.cases.emptyTitle}
        description={tabMeta.cases.emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Caso</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead>Dominio</TableHead>
            <TableHead>Aberto em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {formatPublicId(row.casePublicId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ocorrencia {formatPublicId(row.casePublicId)}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-3">{row.organizationName}</TableCell>
              <TableCell className="py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.assetTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Imagem {formatPublicId(row.assetPublicId)}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-3">{formatDomain(row.domain)}</TableCell>
              <TableCell className="py-3">
                <Badge variant={getDetectionStatusVariant(row.status)}>
                  {formatDetectionStatus(row.status)}
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDate(row.openedAt)}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DetectionsTable({ rows }: { rows: AdminDashboardDetectionRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={tabMeta.detections.emptyTitle}
        description={tabMeta.detections.emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Ocorrencia</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ultima captura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-3">
                <p className="font-medium">{formatPublicId(row.publicId)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDomain(row.domain)}
                </p>
              </TableCell>
              <TableCell className="py-3">{row.organizationName}</TableCell>
              <TableCell className="py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.assetTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Imagem {formatPublicId(row.assetPublicId)}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Badge variant={getDetectionStatusVariant(row.status)}>
                  {formatDetectionStatus(row.status)}
                </Badge>
              </TableCell>
              <TableCell className="py-3">{formatDate(row.lastSeenAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UsersTable({ rows }: { rows: AdminDashboardUserRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={tabMeta.users.emptyTitle}
        description={tabMeta.users.emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Organizacao</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Ultimo acesso</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {row.fullName ?? row.email ?? "Usuario sem nome"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.email ?? "Sem e-mail"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-3">
                {row.organizationName ?? "Sem organizacao"}
              </TableCell>
              <TableCell className="py-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{formatSystemRole(row.systemRole)}</Badge>
                  <Badge variant="secondary">
                    {formatMembershipRole(row.membershipRole)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="py-3">
                {formatDate(row.lastSignedInAt)}
              </TableCell>
              <TableCell className="py-3">{formatDate(row.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminDashboardTable({
  cases,
  detections,
  users,
}: AdminDashboardTableProps) {
  const [activeTab, setActiveTab] = React.useState<DashboardTabValue>("cases");

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as DashboardTabValue)}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Select
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DashboardTabValue)}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="admin-dashboard-view-selector"
          >
            <SelectValue placeholder="Selecionar lista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cases">Casos</SelectItem>
            <SelectItem value="detections">Ocorrencias</SelectItem>
            <SelectItem value="users">Usuarios</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="cases">
            Casos <Badge variant="secondary">{cases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="detections">
            Ocorrencias <Badge variant="secondary">{detections.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="users">
            Usuarios <Badge variant="secondary">{users.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={tabMeta[activeTab].actionHref}>
              {tabMeta[activeTab].actionLabel}
            </Link>
          </Button>
        </div>
      </div>

      <TabsContent
        value="cases"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <CasesTable rows={cases} />
      </TabsContent>
      <TabsContent
        value="detections"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <DetectionsTable rows={detections} />
      </TabsContent>
      <TabsContent
        value="users"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <UsersTable rows={users} />
      </TabsContent>
    </Tabs>
  );
}
