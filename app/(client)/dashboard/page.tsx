import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ImageIcon,
  SearchCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  listOrganizationAssets,
  requireActiveOrganization,
} from "@/lib/dal/assets";
import { listDetectionIncidents } from "@/lib/dal/detections";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { formatPublicId } from "@/lib/public-id";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  href: string;
  tone: "default" | "warning" | "success" | "muted";
};

type SummaryCardProps = {
  description: string;
  icon: LucideIcon;
  label: string;
  tone: "blue" | "amber" | "emerald" | "rose";
  value: number;
};

function getFirstName(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "cliente";
  }

  return trimmed.split(/\s+/)[0] ?? "cliente";
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(new Date()),
  );

  if (hour < 12) {
    return {
      label: "Bom dia",
      icon: "☀️",
    };
  }

  if (hour < 18) {
    return {
      label: "Boa tarde",
      icon: "🌤️",
    };
  }

  return {
    label: "Boa noite",
    icon: "🌙",
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

function buildActivityFeed(params: {
  assets: Awaited<ReturnType<typeof listOrganizationAssets>>;
  incidents: Awaited<ReturnType<typeof listDetectionIncidents>>;
}): ActivityItem[] {
  const assetActivities = params.assets
    .filter((asset) => asset.latestScanJob)
    .map((asset) => ({
      id: `asset-${asset.id}`,
      title: asset.statusSummary.label,
      description: `${asset.title} / Imagem ${formatPublicId(asset.publicId)}`,
      occurredAt:
        asset.latestScanJob?.finishedAt ??
        asset.latestScanJob?.startedAt ??
        asset.latestScanJob?.scheduledAt ??
        asset.createdAt,
      href: `/gallery`,
      tone:
        asset.statusSummary.kind === "failed"
          ? "warning"
          : asset.statusSummary.kind === "completed_without_detections"
            ? "success"
            : asset.statusSummary.kind === "idle"
              ? "muted"
              : "default",
    })) satisfies ActivityItem[];

  const incidentActivities = params.incidents.map((incident) => ({
    id: `incident-${incident.key}`,
    title:
      incident.incidentStatus === "unauthorized"
        ? "Caso aberto para acompanhamento DNL"
        : formatDetectionStatus(incident.incidentStatus),
    description: `${formatDomain(incident.domain)} / ${incident.asset.title}`,
    occurredAt: incident.latestSeenAt,
    href: `/detections/${incident.primaryDetectionId}`,
    tone:
      incident.incidentStatus === "unauthorized"
        ? "warning"
        : incident.incidentStatus === "authorized" ||
            incident.incidentStatus === "resolved"
          ? "success"
          : "default",
  })) satisfies ActivityItem[];

  return [...incidentActivities, ...assetActivities]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime(),
    )
    .slice(0, 6);
}

function getActivityToneClass(tone: ActivityItem["tone"]) {
  switch (tone) {
    case "warning":
      return "bg-destructive/10 text-destructive ring-destructive/20";
    case "success":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300";
    case "muted":
      return "bg-muted text-muted-foreground ring-border";
    default:
      return "bg-primary/10 text-primary ring-primary/20";
  }
}

function getSummaryToneClasses(tone: SummaryCardProps["tone"]) {
  switch (tone) {
    case "amber":
      return {
        accent: "bg-amber-500",
        icon: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-300",
        panel: "from-amber-500/8",
      };
    case "emerald":
      return {
        accent: "bg-emerald-500",
        icon: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
        panel: "from-emerald-500/8",
      };
    case "rose":
      return {
        accent: "bg-rose-500",
        icon: "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-300",
        panel: "from-rose-500/8",
      };
    default:
      return {
        accent: "bg-primary",
        icon: "bg-primary/10 text-primary ring-primary/20",
        panel: "from-primary/8",
      };
  }
}

function SummaryCard({
  description,
  icon: Icon,
  label,
  tone,
  value,
}: SummaryCardProps) {
  const toneClasses = getSummaryToneClasses(tone);

  return (
    <article
      className={`relative isolate min-h-[154px] overflow-hidden rounded-xl border border-border bg-gradient-to-br ${toneClasses.panel} to-card p-5 shadow-sm ring-1 ring-foreground/5 transition-colors hover:border-foreground/20`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${toneClasses.accent}`}
      />
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <p className="max-w-[9rem] text-xs font-medium uppercase leading-5 text-muted-foreground">
            {label}
          </p>
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses.icon}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <div>
          <p className="font-heading text-4xl font-semibold leading-none tracking-tight">
            {value}
          </p>
          <p className="mt-3 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const { context } = await requireActiveOrganization();
  const [assets, incidents, pendingIncidents, cases] = await Promise.all([
    listOrganizationAssets(),
    listDetectionIncidents(),
    listDetectionIncidents({ status: "pending" }),
    listDetectionIncidents({ status: "unauthorized" }),
  ]);
  const firstName = getFirstName(context.fullName ?? context.email);
  const greeting = getGreeting();
  const monitoredAssetsCount = assets.filter(
    (asset) => asset.monitoringRule?.isActive,
  ).length;
  const processingAssetsCount = assets.filter(
    (asset) =>
      asset.statusSummary.kind === "pending" ||
      asset.statusSummary.kind === "processing",
  ).length;
  const withoutDetectionsCount = assets.filter(
    (asset) => asset.statusSummary.kind === "completed_without_detections",
  ).length;
  const activityFeed = buildActivityFeed({ assets, incidents });
  const nextIncident = pendingIncidents[0] ?? null;

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            <span>{greeting.label}, {firstName}</span>
            <span className="ml-2 align-middle text-2xl" aria-hidden="true">
              {greeting.icon}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe suas imagens, varreduras e ocorrencias pendentes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshDataButton size="sm" />
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/gallery/new">
              <UploadCloudIcon className="size-4" />
              Enviar imagem
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/detections">
              Revisar ocorrencias
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[
          {
            label: "Imagens cadastradas",
            value: assets.length,
            description: `${monitoredAssetsCount} com monitoramento ativo`,
            icon: ImageIcon,
            tone: "blue" as const,
          },
          {
            label: "Em varredura",
            value: processingAssetsCount,
            description: "Buscas aguardando ou processando",
            icon: Clock3Icon,
            tone: "amber" as const,
          },
          {
            label: "Aguardando validacao",
            value: pendingIncidents.length,
            description: "Ocorrencias para decisao humana",
            icon: SearchCheckIcon,
            tone: "emerald" as const,
          },
          {
            label: "Casos DNL",
            value: cases.length,
            description: "Usos nao autorizados em acompanhamento",
            icon: BriefcaseIcon,
            tone: "rose" as const,
          },
        ].map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)_minmax(300px,0.85fr)]">
        <Card className="rounded-xl">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Fila de acao</CardTitle>
                <CardDescription>
                  O que o cliente precisa revisar antes de virar caso.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/detections">Ver fila</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {nextIncident ? (
              <div className="grid gap-4 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
                <div className="size-[72px] overflow-hidden rounded-lg border border-border bg-muted/30">
                  {nextIncident.asset.primaryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nextIncident.asset.primaryImageUrl}
                      alt={nextIncident.asset.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Ocorrencia {formatPublicId(nextIncident.publicId)} / Imagem{" "}
                    {formatPublicId(nextIncident.asset.publicId)}
                  </p>
                  <h2 className="mt-1 truncate font-heading text-xl font-semibold">
                    {nextIncident.asset.title}
                  </h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    Encontrada em {formatDomain(nextIncident.domain)}. Confirme
                    se o uso e autorizado, ignorado ou nao autorizado.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={getDetectionStatusVariant(
                        nextIncident.incidentStatus,
                      )}
                    >
                      {formatDetectionStatus(nextIncident.incidentStatus)}
                    </Badge>
                    <Badge
                      variant={getEvidenceCoverageVariant(
                        nextIncident.evidenceCoverage,
                      )}
                    >
                      {formatEvidenceCoverage(nextIncident.evidenceCoverage)}
                    </Badge>
                  </div>
                </div>
                <Button asChild className="w-full lg:w-auto">
                  <Link href={`/detections/${nextIncident.primaryDetectionId}`}>
                    Analisar
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                  <CheckCircle2Icon className="size-5" />
                </div>
                <h2 className="mt-3 font-heading text-xl font-semibold">
                  Nenhuma ocorrencia pendente
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Quando a varredura encontrar imagens semelhantes, elas
                  aparecem aqui para validacao antes de qualquer conclusao.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Atividades recentes</CardTitle>
                <CardDescription>
                  Ultimas movimentacoes da conta.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/gallery">Galeria</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {activityFeed.length > 0 ? (
              <div className="divide-y divide-border">
                {activityFeed.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="grid gap-2 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span
                      className={`size-2 rounded-full ring-4 ${getActivityToneClass(item.tone)}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.occurredAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                <p className="font-heading text-lg font-semibold">
                  Nenhuma atividade recente
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Envie a primeira imagem para iniciar o monitoramento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="border-b border-border">
            <CardTitle>Insights rapidos</CardTitle>
            <CardDescription>Resumo do momento.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6">
            <div className="flex items-start gap-3 rounded-lg bg-muted/25 p-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <SparklesIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {withoutDetectionsCount} sem ocorrencias
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Imagens sem correspondencias na ultima busca.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-muted/25 p-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                <AlertTriangleIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {pendingIncidents.length} aguardando decisao
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ocorrencias que precisam da validacao do cliente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
