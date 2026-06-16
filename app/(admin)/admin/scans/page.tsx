import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { listAdminScans } from "@/lib/dal/admin-scans";
import { AdminScansTable } from "./_components/admin-scans-table";

export default async function AdminScansPage() {
  const scans = await listAdminScans();
  const processingScans = scans.filter((scan) => scan.status === "processing").length;
  const pendingScans = scans.filter((scan) => scan.status === "pending").length;
  const failedScans = scans.filter((scan) => scan.status === "failed").length;
  const completedScans = scans.filter((scan) => scan.status === "completed").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administração
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Varreduras
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Acompanhe a fila completa de buscas realizadas pela plataforma, com
            cliente, imagem, origem da regra, tentativas, execucoes do worker e
            ocorrencias vinculadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{scans.length} varredura(s)</Badge>
          <Badge variant="outline">{pendingScans} na fila</Badge>
          <Badge variant="default">{processingScans} processando</Badge>
          <Badge variant="destructive">{failedScans} falha(s)</Badge>
          <Badge variant="secondary">{completedScans} concluidas</Badge>
          <RefreshDataButton size="sm" />
        </div>
      </header>

      {scans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center shadow-sm">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Nenhuma varredura registrada
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Assim que a plataforma ou o worker criarem novas buscas, elas passam
            a aparecer aqui para acompanhamento interno.
          </p>
        </div>
      ) : (
        <AdminScansTable rows={scans} />
      )}
    </section>
  );
}
