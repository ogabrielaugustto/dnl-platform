import { Globe2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listMonitoredSources } from "@/lib/dal/sources";
import { CreateSourceForm, SourceInlineForm } from "./_components/source-forms";

function formatDate(value: string | null) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRunStatus(status: string) {
  const labels: Record<string, string> = {
    processing: "Processando",
    completed: "Concluida",
    failed: "Falhou",
  };

  return labels[status] ?? status;
}

export default async function AdminSourcesPage() {
  const { sources, latestRuns, schemaMissing } = await listMonitoredSources();

  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-8 md:px-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Globe2Icon className="size-4" />
          Administracao
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Fontes monitoradas
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Gerencie dominios globais usados pelo worker para varredura dirigida por sitemap, RSS e paginas recentes.
        </p>
      </div>

      {schemaMissing ? (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Migration pendente
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Aplique a migration de fontes monitoradas no banco compartilhado antes de usar esta tela.
          </p>
        </div>
      ) : (
        <>
          <CreateSourceForm />

          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Fontes cadastradas
              </h2>
              <Badge variant="secondary">{sources.length} fontes</Badge>
            </div>

            {sources.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6">
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  Nenhuma fonte cadastrada
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comece por portais prioritarios e subdominios especificos. O worker respeita frequencia e limites de crawl.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {sources.map((source) => {
                  const latestRun = latestRuns.get(source.id);

                  return (
                    <div key={source.id} className="grid gap-3">
                      <SourceInlineForm source={source} />
                      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                        <div className="grid gap-2 sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Ultima varredura</p>
                            <p className="font-medium">{formatDate(source.lastCrawledAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="font-medium">
                              {latestRun ? formatRunStatus(latestRun.status) : "Sem execucao"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Imagens</p>
                            <p className="font-medium">{latestRun?.imagesDiscovered ?? 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Matches</p>
                            <p className="font-medium">{latestRun?.matchesCreated ?? 0}</p>
                          </div>
                        </div>
                        {latestRun?.errorMessage ? (
                          <p className="mt-3 text-sm text-destructive">
                            {latestRun.errorMessage}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Button asChild variant="ghost" className="w-fit">
        <a href="/admin/jobs">Ver processamentos</a>
      </Button>
    </section>
  );
}
