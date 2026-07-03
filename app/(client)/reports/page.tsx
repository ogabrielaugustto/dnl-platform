import { PagePlaceholder } from "@/components/app/page-placeholder";
import { requireActiveOrganization } from "@/lib/dal/assets";

export default async function ReportsPage() {
  await requireActiveOrganization();

  return (
    <PagePlaceholder
      eyebrow="Painel"
      title="Relatorios"
      description="Gere relatorios e acompanhe os materiais reunidos para cada ocorrencia."
    />
  );
}
