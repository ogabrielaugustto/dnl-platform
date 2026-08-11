import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { listAdminDetectionIncidents } from "@/lib/dal/admin-detections";
import { AdminDetectionsTable } from "./_components/admin-detections-table";

export default async function AdminDetectionsPage() {
  const incidents = await listAdminDetectionIncidents();
  const openIncidents = incidents.filter((item) =>
    ["pending", "possible_infringement", "unauthorized"].includes(item.incidentStatus),
  ).length;
  const sentIncidents = incidents.filter((item) => item.incidentStatus === "takedown_sent").length;
  const resolvedIncidents = incidents.filter((item) =>
    ["resolved", "authorized", "ignored"].includes(item.incidentStatus),
  ).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administracao
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Ocorrencias
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Lista global de ocorrencias agrupadas por cliente, com filtros por IDs,
            acesso ao detalhe e leitura operacional do status atual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{incidents.length} ocorrencia(s)</Badge>
          <Badge variant="destructive">{openIncidents} em revisao</Badge>
          <Badge variant="default">{sentIncidents} notificadas</Badge>
          <Badge variant="secondary">{resolvedIncidents} finalizadas</Badge>
          <RefreshDataButton size="sm" />
        </div>
      </header>

      <AdminDetectionsTable rows={incidents} />
    </section>
  );
}
