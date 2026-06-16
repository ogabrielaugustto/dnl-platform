import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  formatSimilarityScore,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { getAdminCaseDetails } from "@/lib/dal/admin-cases";
import { formatPublicId } from "@/lib/public-id";

type AdminCaseDetailsPageProps = {
  params: Promise<{
    organizationId: string;
    casePublicId: string;
  }>;
};

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

function formatList(values: string[], fallback: string) {
  if (values.length === 0) {
    return fallback;
  }

  return values.join(" • ");
}

function ImagePanel({
  title,
  imageUrl,
  alt,
  fallback,
}: {
  title: string;
  imageUrl: string | null;
  alt: string;
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <div className="mt-3 overflow-hidden rounded-md border border-border bg-muted/30">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={alt} className="h-full min-h-80 w-full object-contain" />
        ) : (
          <div className="flex min-h-80 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AdminCaseDetailsPage({
  params,
}: AdminCaseDetailsPageProps) {
  const resolvedParams = await params;
  const casePublicId = Number.parseInt(resolvedParams.casePublicId, 10);

  if (Number.isNaN(casePublicId)) {
    notFound();
  }

  const adminCase = await getAdminCaseDetails(resolvedParams.organizationId, casePublicId);

  if (!adminCase) {
    notFound();
  }

  const representativePlacement = adminCase.placements[0] ?? null;
  const evidencePreviewUrl =
    adminCase.matchedImageUrl ?? adminCase.screenshotUrl ?? representativePlacement?.matchedImageUrl ?? null;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <Button asChild size="sm" variant="ghost" className="-ml-2 mb-2">
            <Link href="/admin/cases">
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Detalhes do caso {formatPublicId(adminCase.publicId)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Consolidado operacional do caso ja validado pelo cliente, com paginas,
            ocorrencias, sinais do site e historico de andamento para a equipe DNL.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Cliente {adminCase.organization.name} • Imagem{" "}
            {formatPublicId(adminCase.asset.publicId)} • {adminCase.detectionPublicIds.length}{" "}
            ocorrencia(s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getDetectionStatusVariant(adminCase.status)}>
            {formatDetectionStatus(adminCase.status)}
          </Badge>
          <Badge variant={getEvidenceCoverageVariant(adminCase.evidenceCoverage)}>
            {formatEvidenceCoverage(adminCase.evidenceCoverage)}
          </Badge>
          <Badge variant="outline">{adminCase.pagesCount} pagina(s)</Badge>
          <Badge variant="outline">{adminCase.placementsCount} ocorrencia(s)</Badge>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ImagePanel
              title="Imagem original"
              imageUrl={adminCase.asset.primaryImageUrl}
              alt={adminCase.asset.title}
              fallback="A imagem original ainda nao possui preview disponivel."
            />
            <ImagePanel
              title="Imagem encontrada / evidencia"
              imageUrl={evidencePreviewUrl}
              alt={`Preview do caso ${adminCase.publicId}`}
              fallback="Nenhuma evidencia visual foi preservada ainda para este caso."
            />
          </div>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Dominio principal
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDomain(adminCase.domain)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Encaminhado pelo cliente
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDate(adminCase.clientReviewedAt)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Ultima deteccao
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDate(adminCase.latestSeenAt)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Capturas validas
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {adminCase.capturedEvidenceCount}/{adminCase.placementsCount}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Paginas e ocorrencias do caso
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Visao consolidada por pagina, com escopo, cobertura de evidencia e
                  ocorrencias associadas.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {adminCase.pages.map((page) => (
                <article
                  key={page.key}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {page.pageTitle ?? "Pagina sem titulo identificado"}
                      </p>
                      <p className="mt-2 break-all text-sm text-muted-foreground">
                        {page.sourceUrl}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{page.placementsCount} ocorrencia(s)</Badge>
                      <Badge variant={getEvidenceCoverageVariant(page.evidenceCoverage)}>
                        {formatEvidenceCoverage(page.evidenceCoverage)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {page.placements.map((placement) => (
                      <div
                        key={placement.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-card px-3 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              Ocorrencia {formatPublicId(placement.publicId)}
                            </Badge>
                            <Badge variant={getDetectionStatusVariant(placement.status)}>
                              {formatDetectionStatus(placement.status)}
                            </Badge>
                          </div>
                          <p className="mt-2 break-all text-sm text-muted-foreground">
                            {placement.sourceUrl}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Confianca {formatSimilarityScore(placement.confidenceScore)}</p>
                          <p className="mt-1">Ultimo achado {formatDate(placement.lastSeenAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Historico do caso
            </h2>
            <div className="mt-4 space-y-3">
              {adminCase.actionHistory.length > 0 ? (
                adminCase.actionHistory.map((action) => (
                  <article
                    key={action.id}
                    className="rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatActionLabel(action.action)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {action.actorName ?? action.actorEmail ?? "Equipe DNL"} em{" "}
                          {formatDate(action.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Ocorrencia {formatPublicId(
                          adminCase.placements.find((item) => item.id === action.detectionId)?.publicId ?? 0,
                        )}
                      </Badge>
                    </div>
                    {action.reason ? (
                      <p className="mt-3 text-sm text-foreground">
                        <span className="font-medium">Motivo:</span> {action.reason}
                      </p>
                    ) : null}
                    {action.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{action.notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Nenhum andamento foi registrado para este caso ate agora.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Sinais do site
            </h2>
            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  CNPJ
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {formatList(adminCase.siteSignals.cnpjCandidates, "Nenhum CNPJ encontrado")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  E-mails
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {formatList(adminCase.siteSignals.emails, "Nenhum e-mail encontrado")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Telefones
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {formatList(adminCase.siteSignals.phones, "Nenhum telefone encontrado")}
                </p>
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Cliente</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Organizacao
                </p>
                <p className="mt-1 text-foreground">{adminCase.organization.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  E-mail
                </p>
                <p className="mt-1 text-foreground">
                  {adminCase.organization.billingEmail ?? "Sem e-mail de cobranca"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Ativo monitorado</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Imagem
                </p>
                <p className="mt-1 text-foreground">{formatPublicId(adminCase.asset.publicId)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Titulo
                </p>
                <p className="mt-1 text-foreground">{adminCase.asset.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Arquivo original
                </p>
                <p className="mt-1 text-foreground">
                  {adminCase.asset.originalFileName ?? "Nao informado"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Referencias</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  URL base
                </p>
                <p className="mt-1 break-all text-foreground">{adminCase.sourceUrl}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Destino final
                </p>
                <p className="mt-1 break-all text-foreground">
                  {adminCase.finalUrl ?? "Nao identificado"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild className="w-full" size="sm" variant="outline">
                  <a href={adminCase.sourceUrl} target="_blank" rel="noreferrer">
                    Abrir origem
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
                {adminCase.finalUrl && adminCase.finalUrl !== adminCase.sourceUrl ? (
                  <Button asChild className="w-full" size="sm" variant="outline">
                    <a href={adminCase.finalUrl} target="_blank" rel="noreferrer">
                      Abrir destino final
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
