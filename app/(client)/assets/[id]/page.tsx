import { PagePlaceholder } from "@/components/app/page-placeholder";

type AssetDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetDetailsPage({
  params,
}: AssetDetailsPageProps) {
  const { id } = await params;

  return (
    <PagePlaceholder
      eyebrow="Client"
      title={`Asset ${id}`}
      description="Detalhe inicial do ativo com espaco para preview, arquivos e historico de varreduras."
    />
  );
}
