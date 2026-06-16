import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { listAdminCases } from "@/lib/dal/admin-cases";
import { AdminCasesTable } from "./_components/admin-cases-table";

export default async function AdminCasesPage() {
  const cases = await listAdminCases();
  const openCases = cases.filter((item) => item.status === "unauthorized").length;
  const notifiedCases = cases.filter((item) => item.status === "takedown_sent").length;
  const resolvedCases = cases.filter((item) => item.status === "resolved").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administracao
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Casos juridicos
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Painel de consulta e gestao dos casos que ja foram confirmados como uso
            nao autorizado e agora seguem na esteira operacional da DNL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{cases.length} caso(s)</Badge>
          <Badge variant="destructive">{openCases} aguardando acao</Badge>
          <Badge variant="default">{notifiedCases} notificado(s)</Badge>
          <Badge variant="secondary">{resolvedCases} resolvido(s)</Badge>
          <RefreshDataButton size="sm" />
        </div>
      </header>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center shadow-sm">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Nenhum caso encaminhado ao admin
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Assim que um cliente confirmar uma ocorrencia como infração, o caso passa a
            aparecer aqui para a equipe da DNL.
          </p>
        </div>
      ) : (
        <AdminCasesTable rows={cases} />
      )}
    </section>
  );
}
