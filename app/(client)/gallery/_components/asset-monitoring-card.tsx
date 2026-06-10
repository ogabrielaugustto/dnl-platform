import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ArchiveAssetForm } from "@/app/(client)/gallery/_components/archive-asset-form";
import { AssetMonitoringToggle } from "@/app/(client)/gallery/_components/asset-monitoring-toggle";
import { RenameAssetTitleForm } from "@/app/(client)/gallery/_components/rename-asset-title-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssetListItem, MonitoringRuleFrequency } from "@/lib/dal/assets";
import { formatMonitoringFrequency } from "@/lib/monitoring-frequency";
import { formatPublicId } from "@/lib/public-id";

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
  return formatMonitoringFrequency(value);
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

function getMonitoringLabel(asset: AssetListItem) {
  if (!asset.monitoringRule) {
    return "Sem agenda";
  }

  if (!asset.monitoringRule.isActive) {
    return "Desativado";
  }

  return translateFrequency(asset.monitoringRule.frequency);
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
      <article className="rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative h-24 overflow-hidden rounded-md border border-border bg-muted/30 sm:w-28 lg:h-20 lg:w-20 xl:h-24 xl:w-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-black/35 to-transparent" />
            <div className="absolute left-2 top-2 z-10">
              <ArchiveAssetForm assetId={asset.id} floating />
            </div>
            <div className="absolute right-2 top-2 z-10">
              <AssetMonitoringToggle
                assetId={asset.id}
                isActive={asset.monitoringRule?.isActive ?? false}
                floating
              />
            </div>
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
                    Imagem {formatPublicId(asset.publicId)}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {asset.folder?.name ?? "Sem pasta"}
                  </p>
                  <Badge
                    variant={getStatusVariant(asset.statusSummary.kind)}
                    className="max-w-[10rem] truncate text-[10px]"
                  >
                    {asset.statusSummary.label}
                  </Badge>
                </div>
                <div className="mt-2 max-w-xl">
                  <RenameAssetTitleForm
                    assetId={asset.id}
                    currentTitle={asset.title}
                    compact
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-3 xl:grid-cols-2">
                <div>
                  <p className="font-medium text-foreground">Busca</p>
                  <p className="truncate">{getMonitoringLabel(asset)}</p>
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
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/detections?asset=${asset.id}`}>
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Ocorrencias
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card p-2 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted/30">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="absolute left-2.5 top-2.5 z-20">
          <ArchiveAssetForm assetId={asset.id} floating />
        </div>
        <div className="absolute right-2.5 top-2.5 z-20">
          <AssetMonitoringToggle
            assetId={asset.id}
            isActive={asset.monitoringRule?.isActive ?? false}
            floating
          />
        </div>
        {asset.primaryFile?.publicUrl ? (
          <Image
            src={asset.primaryFile.publicUrl}
            alt={asset.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
            loading={prioritizeImage ? "eager" : "lazy"}
            priority={prioritizeImage}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Preview indisponivel
          </div>
        )}
      </div>

      <div className="space-y-2.5 px-1 pb-1 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 pt-0.5">
            <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Imagem {formatPublicId(asset.publicId)}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {asset.folder?.name ?? "Sem pasta"}
            </p>
          </div>

          <Badge
            variant={getStatusVariant(asset.statusSummary.kind)}
            className="max-w-[7rem] shrink-0 truncate rounded-full px-2 py-0 text-[10px] font-medium"
          >
            {asset.statusSummary.label}
          </Badge>
        </div>

        <RenameAssetTitleForm
          assetId={asset.id}
          currentTitle={asset.title}
          compact
        />

        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{getMonitoringLabel(asset)}</span>
          <span className="size-1 rounded-full bg-muted-foreground/35" aria-hidden="true" />
          <span className="truncate">
            Ultima busca: {translateJobStatus(asset.latestScanJob?.status)}
          </span>
        </div>

        <div className="flex items-center">
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-8 w-full min-w-0 bg-muted/45 shadow-none hover:bg-muted"
          >
            <Link href={`/detections?asset=${asset.id}`}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Ocorrencias
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
