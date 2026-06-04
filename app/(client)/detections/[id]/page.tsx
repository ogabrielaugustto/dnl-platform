import { PagePlaceholder } from "@/components/app/page-placeholder";

type DetectionDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DetectionDetailsPage({
  params,
}: DetectionDetailsPageProps) {
  const { id } = await params;

  return (
    <PagePlaceholder
      eyebrow="Client"
      title={`Detection ${id}`}
      description="Tela inicial para comparar o asset original, a URL encontrada e as evidencias da ocorrencia."
    />
  );
}
