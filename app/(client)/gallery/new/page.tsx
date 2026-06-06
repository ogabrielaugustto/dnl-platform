import { AssetBatchUploadForm } from "@/app/(client)/gallery/_components/asset-batch-upload-form";
import { listOrganizationAssetFolders } from "@/lib/dal/assets";

export default async function NewAssetPage() {
  const folders = await listOrganizationAssetFolders();

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Galeria
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
          Adicionar imagens na galeria
        </h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">
          Selecione as imagens, escolha a pasta se fizer sentido e envie. Depois,
          a plataforma continua o fluxo normal de varredura fora desta tela.
        </p>

        <div className="mt-8">
          <AssetBatchUploadForm folders={folders} />
        </div>
      </div>
    </section>
  );
}
