import Image from "next/image";
import Link from "next/link";
import { RenameAssetTitleForm } from "@/app/(client)/gallery/_components/rename-asset-title-form";
import { getAssetLicenseLabel } from "@/lib/asset-license";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssetDetails, MonitoringRuleFrequency } from "@/lib/dal/assets";

function formatDate(value: string | null) {
  if (!value) {
    return "Nao disponivel";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function translateFrequency(value: MonitoringRuleFrequency | null | undefined) {
  switch (value) {
    case "hourly":
      return "A cada hora";
    case "daily":
      return "Diariamente";
    case "weekly":
      return "Semanalmente";
    case "monthly":
      return "Mensalmente";
    default:
      return "Sem agendamento";
  }
}

function translateJobStatus(value: AssetDetails["scanJobs"][number]["status"]) {
  switch (value) {
    case "pending":
      return "Na fila";
    case "processing":
      return "Em andamento";
    case "completed":
      return "Concluida";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelada";
    default:
      return "Nao iniciada";
  }
}

function getStatusVariant(kind: AssetDetails["statusSummary"]["kind"]) {
  switch (kind) {
    case "completed_with_detections":
      return "destructive";
    case "completed_without_detections":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function buildSummaryMessage(asset: AssetDetails) {
  if (asset.statusSummary.kind === "completed_with_detections") {
    return "Esta imagem ja possui ocorrencias e a validacao humana continua na central de deteccoes.";
  }

  if (asset.statusSummary.kind === "completed_without_detections") {
    return "A ultima busca terminou sem localizar usos desta imagem.";
  }

  if (asset.statusSummary.kind === "failed") {
    return "A ultima busca nao foi concluida com sucesso. O acompanhamento detalhado continua fora da galeria.";
  }

  if (asset.statusSummary.kind === "pending") {
    return "Esta imagem ja entrou na fila e sera analisada em breve.";
  }

  if (asset.statusSummary.kind === "idle") {
    return "Esta imagem foi cadastrada, mas ainda nao passou por uma busca.";
  }

  return "Estamos analisando esta imagem e reunindo os primeiros sinais encontrados.";
}

function OverviewCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function AssetDetailPanel({ asset }: { asset: AssetDetails }) {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
          <div className="relative min-h-80 bg-muted/30">
            {asset.primaryFile?.publicUrl ? (
              <Image
                src={asset.primaryFile.publicUrl}
                alt={asset.title}
                fill
                sizes="(max-width: 1024px) 100vw, 340px"
                className="object-cover"
              />
            ) : (
              <div className="flex min-h-80 items-center justify-center px-8 text-center text-sm text-muted-foreground">
                O preview da imagem principal nao esta disponivel.
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {asset.folder ? asset.folder.name : "Sem pasta"}
                </p>
                <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                  {asset.title}
                </h1>
                <p className="mt-3 max-w-3xl text-base text-muted-foreground">
                  {buildSummaryMessage(asset)}
                </p>
                <RenameAssetTitleForm assetId={asset.id} currentTitle={asset.title} />
                {asset.description ? (
                  <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                    {asset.description}
                  </p>
                ) : null}
              </div>

              <Badge variant={getStatusVariant(asset.statusSummary.kind)}>
                {asset.statusSummary.label}
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <OverviewCard
                label="Ocorrencias"
                value={`${asset.detectionsCount} registro(s)`}
                helper="A validacao detalhada acontece em deteccoes."
              />
              <OverviewCard
                label="Busca automatica"
                value={translateFrequency(asset.monitoringRule?.frequency)}
                helper={`Proxima analise: ${formatDate(asset.monitoringRule?.nextRunAt ?? null)}`}
              />
              <OverviewCard
                label="Ultima busca"
                value={
                  asset.latestScanJob
                    ? translateJobStatus(asset.latestScanJob.status)
                    : "Ainda nao iniciada"
                }
                helper={
                  asset.latestScanJob
                    ? `Solicitada em ${formatDate(asset.latestScanJob.scheduledAt)}`
                    : "A varredura acontece pelo fluxo normal da plataforma."
                }
              />
              <OverviewCard
                label="Licenca"
                value={getAssetLicenseLabel(asset.licenseType) ?? "Nao informada"}
                helper={asset.author ? `Autor: ${asset.author}` : "Autor nao informado"}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="secondary" asChild>
                <Link href={`/detections?asset=${asset.id}`}>Revisar ocorrencias</Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/gallery">Voltar para galeria</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Detalhes da imagem
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <OverviewCard label="Pasta" value={asset.folder?.name ?? "Sem pasta"} />
            <OverviewCard
              label="Nome do arquivo"
              value={asset.primaryFile?.originalFileName ?? "Nao informado"}
            />
            <OverviewCard label="Enviada em" value={formatDate(asset.createdAt)} />
            <OverviewCard
              label="Licenca"
              value={getAssetLicenseLabel(asset.licenseType) ?? "Nao informada"}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Acompanhamento
          </h2>
          <div className="mt-5 grid gap-4">
            <OverviewCard
              label="Status atual"
              value={asset.statusSummary.label}
              helper={asset.statusSummary.description}
            />
            <OverviewCard
              label="Busca automatica"
              value={translateFrequency(asset.monitoringRule?.frequency)}
              helper={`Proxima analise: ${formatDate(asset.monitoringRule?.nextRunAt ?? null)}`}
            />
            <OverviewCard
              label="Ultima busca"
              value={
                asset.latestScanJob
                  ? translateJobStatus(asset.latestScanJob.status)
                  : "Ainda nao iniciada"
              }
              helper={
                asset.latestScanJob
                  ? `Solicitada em ${formatDate(asset.latestScanJob.scheduledAt)}`
                  : "A varredura acontece pelo fluxo normal da plataforma."
              }
            />
            <OverviewCard
              label="Ocorrencias"
              value={`${asset.detectionsCount} registro(s)`}
              helper="A revisao detalhada continua na central de deteccoes."
            />
          </div>
        </section>
      </div>
    </section>
  );
}
