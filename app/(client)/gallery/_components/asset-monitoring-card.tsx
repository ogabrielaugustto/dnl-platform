import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssetListItem, MonitoringRuleFrequency } from "@/lib/dal/assets";

function getStatusVariant(kind: AssetListItem["statusSummary"]["kind"]) {
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

type AssetViewMode = "cards" | "rows";
type LatestScanJobStatus = NonNullable<AssetListItem["latestScanJob"]>["status"];

function translateFrequency(value: MonitoringRuleFrequency) {
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

function translateJobStatus(status: LatestScanJobStatus | undefined) {
  switch (status) {
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

function buildClientSummary(asset: AssetListItem) {
  if (asset.statusSummary.kind === "completed_with_detections") {
    return `${asset.detectionsCount} ocorrencia(s) aguardando validacao humana.`;
  }

  if (asset.statusSummary.kind === "completed_without_detections") {
    return "Nenhum uso encontrado na ultima busca.";
  }

  if (asset.statusSummary.kind === "failed") {
    return "Nao conseguimos concluir a ultima busca. Tente novamente.";
  }

  if (asset.statusSummary.kind === "pending") {
    return "A imagem entrou na fila e sera analisada em breve.";
  }

  if (asset.statusSummary.kind === "idle") {
    return "Esta imagem ainda nao teve uma busca iniciada.";
  }

  return "Estamos analisando esta imagem e reunindo os primeiros resultados.";
}

export function AssetMonitoringCard({
  asset,
  prioritizeImage = false,
  viewMode = "cards",
}: {
  asset: AssetListItem;
  prioritizeImage?: boolean;
  viewMode?: AssetViewMode;
}) {
  if (viewMode === "rows") {
    return (
      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative h-24 overflow-hidden rounded-xl border border-border bg-muted/30 sm:w-28 lg:h-20 lg:w-20 xl:h-24 xl:w-24">
            {asset.primaryFile?.publicUrl ? (
              <Image
                src={asset.primaryFile.publicUrl}
                alt={asset.title}
                fill
                sizes="(max-width: 1024px) 112px, 96px"
                loading={prioritizeImage ? "eager" : "lazy"}
                priority={prioritizeImage}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                Sem preview
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {asset.folder?.name ?? "Sem pasta"}
                  </p>
                  <Badge
                    variant={getStatusVariant(asset.statusSummary.kind)}
                    className="max-w-[10rem] truncate text-[10px]"
                  >
                    {asset.statusSummary.label}
                  </Badge>
                </div>
                <h2 className="mt-1 truncate text-base font-semibold tracking-tight text-foreground">
                  {asset.title}
                </h2>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {buildClientSummary(asset)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4 xl:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">Busca</p>
                  <p className="truncate">
                    {asset.monitoringRule
                      ? translateFrequency(asset.monitoringRule.frequency)
                      : "Sem agenda"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Resultados</p>
                  <p>{asset.detectionsCount} ocorrencia(s)</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Ultima busca</p>
                  <p>{translateJobStatus(asset.latestScanJob?.status)}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Pasta</p>
                  <p className="truncate">{asset.folder?.name ?? "Sem pasta"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <Button asChild size="sm">
                  <Link href={`/gallery/${asset.id}`}>Abrir imagem</Link>
                </Button>

                <Button asChild size="sm" variant="secondary">
                  <Link href={`/detections?asset=${asset.id}`}>Ver ocorrencias</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
        {asset.primaryFile?.publicUrl ? (
          <Image
            src={asset.primaryFile.publicUrl}
            alt={asset.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
            loading={prioritizeImage ? "eager" : "lazy"}
            priority={prioritizeImage}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Preview indisponivel
          </div>
        )}
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {asset.folder?.name ?? "Sem pasta"}
            </p>
            <h2 className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight text-foreground">
              {asset.title}
            </h2>
          </div>

          <Badge
            variant={getStatusVariant(asset.statusSummary.kind)}
            className="max-w-[7rem] shrink-0 truncate text-[10px]"
          >
            {asset.statusSummary.label}
          </Badge>
        </div>

        <p className="line-clamp-2 text-[11px] text-muted-foreground">
          {buildClientSummary(asset)}
        </p>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="rounded-xl bg-muted/30 px-2 py-2">
            <p className="truncate font-medium text-foreground">Busca</p>
            <p className="truncate">
              {asset.monitoringRule
                ? translateFrequency(asset.monitoringRule.frequency)
                : "Sem agenda"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/30 px-2 py-2">
            <p className="truncate font-medium text-foreground">Resultados</p>
            <p>{asset.detectionsCount} ocorrencia(s)</p>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Ultima busca:</span>{" "}
          {translateJobStatus(asset.latestScanJob?.status)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild size="sm" className="w-full">
            <Link href={`/gallery/${asset.id}`}>Abrir</Link>
          </Button>

          <Button asChild size="sm" variant="secondary" className="w-full">
            <Link href={`/detections?asset=${asset.id}`}>Ocorrencias</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
