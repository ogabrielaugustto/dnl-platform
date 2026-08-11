import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { listAdminAssets } from "@/lib/dal/admin-assets";
import { AdminAssetsGallery } from "./_components/admin-assets-gallery";

export default async function AdminAssetsPage() {
  const assets = await listAdminAssets();
  const activeClients = new Set(assets.map((asset) => asset.organization.id)).size;
  const withDetections = assets.filter((asset) => asset.detectionsCount > 0).length;
  const pendingAssets = assets.filter((asset) =>
    ["pending", "processing"].includes(asset.statusSummary.kind),
  ).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administracao
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Galeria
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Base global de imagens monitoradas, agrupada por cliente, com filtros
            operacionais e acoes rapidas para limpeza da galeria.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{assets.length} imagem(ns)</Badge>
          <Badge variant="secondary">{activeClients} cliente(s)</Badge>
          <Badge variant="default">{withDetections} com ocorrencias</Badge>
          <Badge variant="outline">{pendingAssets} em fila/processando</Badge>
          <RefreshDataButton size="sm" />
        </div>
      </header>

      <AdminAssetsGallery rows={assets} />
    </section>
  );
}
