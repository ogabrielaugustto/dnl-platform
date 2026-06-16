import { Badge } from "@/components/ui/badge";
import { listInternalActivities } from "@/lib/dal/admin-management";
import { AdminActivitiesTable } from "./_components/admin-activities-table";

export default async function AdminActivitiesPage() {
  const activityData = await listInternalActivities();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administração
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Atividades
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Consulte o historico interno das acoes executadas pela equipe DNL, com foco em gestao administrativa e andamentos operacionais.
          </p>
        </div>
        <Badge variant="outline">{activityData.rows.length} atividade(s)</Badge>
      </header>

      <AdminActivitiesTable {...activityData} />
    </section>
  );
}
