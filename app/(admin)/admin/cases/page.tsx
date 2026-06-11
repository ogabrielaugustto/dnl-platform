import Link from "next/link";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminCases } from "@/lib/dal/admin-cases";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
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

function formatActionLabel(value: string) {
  switch (value) {
    case "marcada_como_uso_nao_autorizado":
      return "Cliente confirmou a infracao";
    case "notificacao_enviada":
      return "Notificacao enviada";
    case "marcada_como_resolvida":
      return "Caso resolvido";
    case "marcada_como_ignorada":
      return "Caso ignorado";
    case "marcada_como_uso_autorizado":
      return "Marcado como uso autorizado";
    default:
      return value.replaceAll("_", " ");
  }
}

function formatList(values: string[]) {
  if (values.length === 0) {
    return "Nao identificado";
  }

  return values.slice(0, 3).join(" • ");
}

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
            Aqui ficam os casos que o cliente ja confirmou como uso nao autorizado e
            que agora entram na esteira operacional da DNL para revisao, notificacao e
            acompanhamento.
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
        <div className="grid gap-4">
          {cases.map((item) => (
            <article
              key={item.key}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
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
                      Caso {formatPublicId(item.publicId)} / Imagem{" "}
                      {formatPublicId(item.asset.publicId)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-foreground">
                      {formatDomain(item.domain)}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.organization.name} • {item.asset.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {item.primaryPageTitle ?? item.sourceUrl}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant={getDetectionStatusVariant(item.status)}>
                        {formatDetectionStatus(item.status)}
                      </Badge>
                      <Badge variant={getEvidenceCoverageVariant(item.evidenceCoverage)}>
                        {formatEvidenceCoverage(item.evidenceCoverage)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={item.sourceUrl} target="_blank" rel="noreferrer">
                      Abrir origem
                    </Link>
                  </Button>
                  {item.finalUrl && item.finalUrl !== item.sourceUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.finalUrl} target="_blank" rel="noreferrer">
                        Abrir destino final
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Cliente
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {item.organization.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.organization.billingEmail ?? "Sem e-mail de cobranca"}
                  </p>
                </div>

                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Escopo
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {item.pagesCount} pagina(s) / {item.placementsCount} ocorrencia(s)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.capturedEvidenceCount} evidencia(s) capturada(s)
                  </p>
                </div>

                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Encaminhado
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {formatDate(item.clientReviewedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ultimo avistamento em {formatDate(item.latestSeenAt)}
                  </p>
                </div>

                <div className="rounded-md bg-muted/25 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Ultimo andamento
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {item.latestAction ? formatActionLabel(item.latestAction.action) : "Sem historico"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.latestAction
                      ? `${item.latestAction.actorName ?? "Equipe DNL"} em ${formatDate(item.latestAction.createdAt)}`
                      : "Nenhuma anotacao registrada"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-md border border-border/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Sinais do site
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">CNPJ:</span> {formatList(item.siteSignals.cnpjCandidates)}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">E-mails:</span> {formatList(item.siteSignals.emails)}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">Telefones:</span> {formatList(item.siteSignals.phones)}
                  </p>
                </div>

                <div className="rounded-md border border-border/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Referencias da captura
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">URL base:</span>{" "}
                    <span className="break-all">{item.sourceUrl}</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">Destino final:</span>{" "}
                    <span className="break-all">{item.finalUrl ?? "Nao identificado"}</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">Imagem encontrada:</span>{" "}
                    <span className="break-all">{item.matchedImageUrl ?? "Nao identificado"}</span>
                  </p>
                </div>

                <div className="rounded-md border border-border/70 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Observacoes do fluxo
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">Motivo:</span>{" "}
                    {item.latestAction?.reason ?? "Nao informado"}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">Notas:</span>{" "}
                    {item.latestAction?.notes ?? "Nenhuma nota registrada"}
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
