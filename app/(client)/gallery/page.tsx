import Link from "next/link";
import { Plus } from "lucide-react";
import { AssetFolderFilter } from "@/app/(client)/gallery/_components/asset-folder-filter";
import { AssetMonitoringCard } from "@/app/(client)/gallery/_components/asset-monitoring-card";
import { RenameFolderForm } from "@/app/(client)/gallery/_components/rename-folder-form";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Button } from "@/components/ui/button";
import {
  listOrganizationAssetFolders,
  listOrganizationAssets,
} from "@/lib/dal/assets";

type AssetsPageProps = {
  searchParams: Promise<{
    uploaded?: string;
    created?: string;
    queued?: string;
    pending?: string;
    failed?: string;
    scan?: string;
    worker?: string;
    folder?: string;
    view?: string;
  }>;
};

type AssetViewMode = "cards" | "rows";

function buildFlashMessage(params: Awaited<AssetsPageProps["searchParams"]>) {
  if (params.uploaded && params.created) {
    return `Importacao concluida: ${params.uploaded} imagem(ns) recebida(s), ${params.created} adicionada(s), ${params.queued ?? "0"} busca(s) iniciada(s), ${params.pending ?? "0"} aguardando processamento e ${params.failed ?? "0"} com falha.`;
  }

  if (params.scan === "1") {
    return params.worker === "pending"
      ? "Nova busca criada. Ela foi registrada e sera processada em instantes."
      : "Nova busca criada com sucesso.";
  }

  return null;
}

export default async function GalleryPage({ searchParams }: AssetsPageProps) {
  const params = await searchParams;
  const activeFolderId =
    params.folder && params.folder !== "unassigned" ? params.folder : null;
  const unassignedSelected = params.folder === "unassigned";
  const viewMode: AssetViewMode = params.view === "rows" ? "rows" : "cards";
  const [assets, allAssets, folders] = await Promise.all([
    listOrganizationAssets({
      folderId: activeFolderId,
      includeUnassigned: unassignedSelected,
    }),
    listOrganizationAssets(),
    listOrganizationAssetFolders(),
  ]);
  const flashMessage = buildFlashMessage(params);
  const totalAssetsCount = allAssets.length;
  const unassignedCount = allAssets.filter((asset) => !asset.folder).length;
  const activeFolder =
    folders.find((folder) => folder.id === activeFolderId) ?? null;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Galeria
          </p>
          <div>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              Imagens monitoradas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Edite nomes, organize pastas, ative monitoramento e revise
              ocorrencias direto na lista.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <RefreshDataButton size="sm" />
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/gallery/new">
              <Plus className="size-4" aria-hidden="true" />
              Adicionar imagem
            </Link>
          </Button>
        </div>
      </header>

      {flashMessage ? (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            {flashMessage}
          </div>
        </div>
      ) : null}

      <AssetFolderFilter
        folders={folders}
        activeFolderId={activeFolderId}
        unassignedSelected={unassignedSelected}
        totalAssetsCount={totalAssetsCount}
        unassignedCount={unassignedCount}
        viewMode={viewMode}
      />

      {activeFolder ? (
        <RenameFolderForm
          key={`${activeFolder.id}:${activeFolder.name}`}
          folderId={activeFolder.id}
          currentName={activeFolder.name}
        />
      ) : null}

      {assets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center shadow-sm">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Nenhuma imagem encontrada neste recorte
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Importe novas imagens ou altere o filtro de pasta para visualizar
            outros itens da organizacao.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/gallery/new">Adicionar imagens</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === "rows"
              ? "space-y-3"
              : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          }
        >
          {assets.map((asset, index) => (
            <AssetMonitoringCard
              key={asset.id}
              asset={asset}
              prioritizeImage={index < 5}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </section>
  );
}
