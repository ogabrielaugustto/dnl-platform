import Link from "next/link";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatEvidenceCoverage,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { listDetectionIncidents } from "@/lib/dal/detections";
import { formatPublicId } from "@/lib/public-id";

function formatDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDomain(value: string) {
  if (!value || value === "site-nao-identificado") {
    return "Site nao identificado";
  }

  return value;
}

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
        <div className="grid gap-3">
          {cases.map((item) => (
            <article
              key={item.key}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted/30">
                    {item.asset.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.asset.primaryImageUrl}
                        alt={item.asset.title}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Caso {formatPublicId(item.casePublicId)} / Imagem{" "}
                      {formatPublicId(item.asset.publicId)}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDomain(item.domain)}
                    </p>
                    <Link
                      href="/gallery"
                      className="mt-1 block truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {item.asset.title}
                    </Link>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="destructive">Uso nao autorizado</Badge>
                      <Badge variant={getEvidenceCoverageVariant(item.evidenceCoverage)}>
                        {formatEvidenceCoverage(item.evidenceCoverage)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button asChild size="sm">
                  <Link href={`/detections/${item.primaryDetectionId}`}>Abrir analise</Link>
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Paginas
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {item.pagesCount} pagina(s)
                  </p>
                </div>
                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Evidencias
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {item.capturedEvidenceCount}/{item.placementsCount} capturada(s)
                  </p>
                </div>
                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Ultima deteccao
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {formatDate(item.latestSeenAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
