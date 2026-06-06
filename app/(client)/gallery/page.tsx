import Link from "next/link";
import { AssetFolderFilter } from "@/app/(client)/gallery/_components/asset-folder-filter";
import { AssetMonitoringCard } from "@/app/(client)/gallery/_components/asset-monitoring-card";
import { RenameFolderForm } from "@/app/(client)/gallery/_components/rename-folder-form";
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
  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? null;

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Galeria
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
              Imagens da sua galeria
            </h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground">
              Use esta area para subir imagens, organizar por pastas, filtrar a
              visualizacao e manter os nomes da galeria em ordem. Analises,
              ocorrencias e evidencias continuam centralizadas nas outras paginas.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href="/gallery/new">Adicionar imagens</Link>
          </Button>
        </div>

        {flashMessage ? (
          <div className="mt-6 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            {flashMessage}
          </div>
        ) : null}
      </div>

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
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center shadow-sm">
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
              prioritizeImage={index === 0}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </section>
  );
}
