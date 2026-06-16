import Link from "next/link";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listDetectionIncidents } from "@/lib/dal/detections";
import { ClientCasesTable } from "./_components/client-cases-table";

export default async function CasesPage() {
  const cases = await listDetectionIncidents({ status: "unauthorized" });

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Casos
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Usos nao autorizados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cases.length} grupo(s) marcados para acompanhamento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive">{cases.length} caso(s)</Badge>
          <RefreshDataButton size="sm" />
          <Button asChild size="sm" variant="outline">
            <Link href="/detections">Revisar ocorrencias</Link>
          </Button>
        </div>
      </header>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center shadow-sm">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Nenhum caso em acompanhamento
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando uma ocorrencia for marcada como uso nao autorizado, ela aparece aqui.
          </p>
        </div>
      ) : (
        <ClientCasesTable rows={cases} />
      )}
    </section>
  );
}
