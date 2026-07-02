import { LiveWorkflowRefresh } from "@/app/(client)/_components/live-workflow-refresh";
import { GalleryWorkspace } from "@/app/(client)/gallery/_components/gallery-workspace";
import {
  listOrganizationAssetFolders,
  listOrganizationAssets,
  requireActiveOrganization,
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
  }>;
};

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
  const { organizationId } = await requireActiveOrganization();
  const activeFolderId =
    params.folder && params.folder !== "unassigned" ? params.folder : null;
  const unassignedSelected = params.folder === "unassigned";
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
  const hasActiveWork = allAssets.some(
    (asset) =>
      asset.statusSummary.kind === "pending" ||
      asset.statusSummary.kind === "processing",
  );
  const activeFolder =
    folders.find((folder) => folder.id === activeFolderId) ?? null;

  return (
    <>
      <LiveWorkflowRefresh
        organizationId={organizationId}
        hasActiveWork={hasActiveWork}
      />
      <GalleryWorkspace
        assets={assets}
        folders={folders}
        activeFolderId={activeFolderId}
        activeFolderName={activeFolder?.name ?? null}
        unassignedSelected={unassignedSelected}
        totalAssetsCount={totalAssetsCount}
        unassignedCount={unassignedCount}
        flashMessage={flashMessage}
      />
    </>
  );
}
