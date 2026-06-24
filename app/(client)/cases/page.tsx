import Link from "next/link";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listClientCases } from "@/lib/dal/detections";
import { ClientCasesTable } from "./_components/client-cases-table";

export default async function CasesPage() {
  const cases = await listClientCases();
  const openCases = cases.filter((item) => item.status === "unauthorized").length;
  const notifiedCases = cases.filter((item) => item.status === "takedown_sent").length;
  const resolvedCases = cases.filter((item) => item.status === "resolved").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Casos
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Casos em acompanhamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os casos encaminhados para a equipe DNL e o andamento de cada analise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive">{openCases} em andamento</Badge>
          <Badge variant="outline">{notifiedCases} com notificacao</Badge>
          <Badge variant="outline">{resolvedCases} resolvido(s)</Badge>
          <RefreshDataButton size="sm" />
          <Button asChild size="sm" variant="outline">
            <Link href="/detections">Revisar ocorrencias</Link>
          </Button>
        </div>
      </header>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center ">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Nenhum caso em acompanhamento
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando uma ocorrencia for marcada como uso nao autorizado, ela passa a ser acompanhada aqui.
          </p>
        </div>
      ) : (
        <ClientCasesTable rows={cases} />
      )}
    </section>
  );
}
