import { AssetDetailPanel } from "@/app/(client)/gallery/_components/asset-detail-panel";
import { getAssetDetails } from "@/lib/dal/assets";

type AssetDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    created?: string;
    scan?: string;
    worker?: string;
  }>;
};

export default async function AssetDetailsPage({
  params,
  searchParams,
}: AssetDetailsPageProps) {
  const { id } = await params;
  const [asset, pageSearchParams] = await Promise.all([
    getAssetDetails(id),
    searchParams,
  ]);
  const flashMessage =
    pageSearchParams.created === "1"
      ? pageSearchParams.worker === "pending"
        ? "Imagem cadastrada. A primeira busca foi registrada e sera processada em instantes."
        : "Imagem cadastrada e primeira busca iniciada."
      : pageSearchParams.scan === "1"
        ? pageSearchParams.worker === "pending"
          ? "Nova busca criada. Ela foi registrada e sera processada em instantes."
          : "Nova busca criada com sucesso."
        : null;

  return (
    <>
      {flashMessage ? (
        <div className="px-6 pt-6 md:px-8">
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            {flashMessage}
          </div>
        </div>
      ) : null}
      <AssetDetailPanel asset={asset} />
    </>
  );
}
