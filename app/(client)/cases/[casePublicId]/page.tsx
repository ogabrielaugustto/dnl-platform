import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDetectionStatus,
  formatEvidenceCoverage,
  formatSimilarityScore,
  getDetectionStatusVariant,
  getEvidenceCoverageVariant,
} from "@/lib/detection-ui";
import { getClientCaseDetails } from "@/lib/dal/detections";
import { formatPublicId } from "@/lib/public-id";

type ClientCaseDetailsPageProps = {
  params: Promise<{
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
      return "Caso aberto para acompanhamento";
    case "notificacao_enviada":
      return "Notificacao enviada";
    case "marcada_como_resolvida":
      return "Caso resolvido";
    case "marcada_como_ignorada":
      return "Caso encerrado sem prosseguir";
    case "marcada_como_uso_autorizado":
      return "Uso autorizado";
    case "marcada_como_possivel_infracao":
      return "Caso em revisao";
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

function InfoBlock({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-sm font-medium text-foreground ${breakAll ? "break-all" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function SiteInfoBlock({
  label,
  values,
  fallback,
}: {
  label: string;
  values: string[];
  fallback: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground">{formatList(values, fallback)}</p>
    </div>
  );
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
    <div className="rounded-lg border border-border bg-card p-4 ">
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

function SignedDeclarationPanel(props: {
  declaration: NonNullable<Awaited<ReturnType<typeof getClientCaseDetails>>>["latestSignedDeclaration"];
}) {
  if (!props.declaration) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Nenhuma declaracao assinada foi encontrada para este caso ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Ultima declaracao assinada
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoBlock label="Imagem" value={formatPublicId(props.declaration.assetPublicId)} />
          <InfoBlock label="Data" value={formatDate(props.declaration.createdAt)} />
          <InfoBlock label="Signatario" value={props.declaration.signerFullName} />
          <InfoBlock label="CPF" value={props.declaration.signerCpf} />
          <InfoBlock label="Qualificacao" value={props.declaration.signerRole} />
          <InfoBlock label="Cidade" value={props.declaration.signingCity} />
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {props.declaration.body}
          </pre>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Assinatura utilizada
        </h2>
        <div
          className="mt-4 overflow-hidden rounded-2xl border border-border bg-white p-4 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: props.declaration.signatureSvg }}
        />
        {clientCaseDeclarationHistoryHint(props.declaration)}
      </div>
    </div>
  );
}

function clientCaseDeclarationHistoryHint(props: {
  createdAt: string;
  templateVersion: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
      Documento salvo em {formatDate(props.createdAt)} com template {props.templateVersion}.
    </div>
  );
}

function TimelineItem({
  title,
  subtitle,
  reason,
  notes,
  occurrenceLabel,
  hideConnector = false,
}: {
  title: string;
  subtitle: string;
  reason: string | null;
  notes: string | null;
  occurrenceLabel: string;
  hideConnector?: boolean;
}) {
  return (
    <article className="relative pl-7">
      <span className="absolute left-0 top-2 size-3 rounded-full bg-primary/80 ring-4 ring-primary/10" />
      {hideConnector ? null : (
        <span className="absolute left-[5px] top-6 h-[calc(100%-8px)] w-px bg-border" />
      )}
      <div className="rounded-xl border border-border bg-linear-to-br from-card to-muted/20 p-4 ">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Badge variant="outline">{occurrenceLabel}</Badge>
        </div>
        {reason ? (
          <p className="mt-3 text-sm text-foreground">
            <span className="font-medium">Motivo:</span> {reason}
          </p>
        ) : null}
        {notes ? <p className="mt-2 text-sm text-muted-foreground">{notes}</p> : null}
      </div>
    </article>
  );
}

export default async function ClientCaseDetailsPage({
  params,
}: ClientCaseDetailsPageProps) {
  const resolvedParams = await params;
  const casePublicId = Number.parseInt(resolvedParams.casePublicId, 10);

  if (Number.isNaN(casePublicId)) {
    notFound();
  }

  const clientCase = await getClientCaseDetails(casePublicId);

  if (!clientCase) {
    notFound();
  }

  const representativePlacement = clientCase.placements[0] ?? null;
  const evidencePreviewUrl =
    clientCase.matchedImageUrl ??
    clientCase.screenshotUrl ??
    representativePlacement?.latestEvidence?.matchedImageUrl ??
    representativePlacement?.latestEvidence?.screenshotUrl ??
    representativePlacement?.matchedImageUrl ??
    null;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <Button asChild size="sm" variant="ghost" className="-ml-2 mb-2">
            <Link href="/cases">
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Analise do caso {formatPublicId(clientCase.publicId)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Acompanhe o andamento deste caso com a equipe DNL, veja as paginas agrupadas
            e consulte o historico de atualizacoes em um unico lugar.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Imagem {formatPublicId(clientCase.asset.publicId)} • {clientCase.detectionPublicIds.length} ocorrencia(s)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getDetectionStatusVariant(clientCase.status)}>
            {formatDetectionStatus(clientCase.status)}
          </Badge>
          <Badge variant={getEvidenceCoverageVariant(clientCase.evidenceCoverage)}>
            {formatEvidenceCoverage(clientCase.evidenceCoverage)}
          </Badge>
          <Badge variant="outline">{clientCase.pagesCount} pagina(s)</Badge>
          <Badge variant="outline">{clientCase.placementsCount} ocorrencia(s)</Badge>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ImagePanel
              title="Imagem original"
              imageUrl={clientCase.asset.primaryImageUrl}
              alt={clientCase.asset.title}
              fallback="A imagem original ainda nao possui preview disponivel."
            />
            <ImagePanel
              title="Imagem encontrada / evidencia"
              imageUrl={evidencePreviewUrl}
              alt={`Preview do caso ${clientCase.publicId}`}
              fallback="Nenhuma evidencia visual foi preservada ainda para este caso."
            />
          </div>

          <section className="rounded-lg border border-border bg-card p-4 ">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoBlock label="Dominio principal" value={formatDomain(clientCase.domain)} />
              <InfoBlock
                label="Encaminhado para a DNL"
                value={formatDate(clientCase.clientReviewedAt)}
              />
              <InfoBlock label="Ultima deteccao" value={formatDate(clientCase.latestSeenAt)} />
              <InfoBlock
                label="Capturas validas"
                value={`${clientCase.capturedEvidenceCount}/${clientCase.placementsCount}`}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 ">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList
                variant="line"
                className="w-full justify-start overflow-x-auto overflow-y-hidden border-b border-border p-0"
              >
                <TabsTrigger value="overview" className="flex-none px-3 py-2">
                  Visao geral
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex-none px-3 py-2">
                  Paginas e ocorrencias
                </TabsTrigger>
                <TabsTrigger value="site" className="flex-none px-3 py-2">
                  Sinais do site
                </TabsTrigger>
                <TabsTrigger value="declaration" className="flex-none px-3 py-2">
                  Declaracao assinada
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="pt-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        Resumo do acompanhamento
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Este caso consolida as ocorrencias da mesma imagem neste dominio para
                        facilitar a visao do andamento.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <InfoBlock
                          label="Caso"
                          value={formatPublicId(clientCase.publicId)}
                        />
                        <InfoBlock
                          label="Imagem monitorada"
                          value={formatPublicId(clientCase.asset.publicId)}
                        />
                        <InfoBlock
                          label="Ultimo andamento"
                          value={
                            clientCase.latestAction
                              ? `${formatActionLabel(clientCase.latestAction.action)} em ${formatDate(clientCase.latestAction.createdAt)}`
                              : "Sem andamento registrado"
                          }
                        />
                        <InfoBlock
                          label="Ocorrencias do caso"
                          value={clientCase.detectionPublicIds.map((id) => formatPublicId(id)).join(" • ")}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        Referencias principais
                      </h2>
                      <div className="mt-4 grid gap-3">
                        <InfoBlock label="Titulo da imagem" value={clientCase.asset.title} />
                        <InfoBlock
                          label="Arquivo original"
                          value={clientCase.asset.originalFileName ?? "Nao informado"}
                        />
                        <InfoBlock label="URL base" value={clientCase.sourceUrl} breakAll />
                        <InfoBlock
                          label="Destino final"
                          value={clientCase.finalUrl ?? "Nao identificado"}
                          breakAll
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">
                      Paginas agrupadas
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cada card abaixo resume uma pagina monitorada dentro deste caso.
                    </p>
                    <div className="mt-4 space-y-3">
                      {clientCase.pages.map((page) => (
                        <article
                          key={page.key}
                          className="rounded-lg border border-border bg-card px-4 py-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {page.pageTitle ?? "Pagina sem titulo identificado"}
                              </p>
                              <p className="mt-1 break-all text-sm text-muted-foreground">
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
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pages" className="pt-5">
                <div className="space-y-4">
                  {clientCase.pages.map((page) => (
                    <article key={page.key} className="rounded-lg border border-border bg-muted/20 p-4">
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
              </TabsContent>

              <TabsContent value="site" className="pt-5">
                <div className="grid gap-3 xl:grid-cols-4">
                  <InfoBlock label="Dominio" value={formatDomain(clientCase.domain)} />
                  <InfoBlock
                    label="Nome do site"
                    value={clientCase.siteSignals.siteName ?? "Nao informado"}
                  />
                  <InfoBlock
                    label="URL final"
                    value={clientCase.finalUrl ?? "Nao identificado"}
                    breakAll
                  />
                  <InfoBlock
                    label="Cobertura"
                    value={formatEvidenceCoverage(clientCase.evidenceCoverage)}
                  />
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  <SiteInfoBlock
                    label="CNPJ"
                    values={clientCase.siteSignals.cnpjCandidates}
                    fallback="Nenhum CNPJ encontrado"
                  />
                  <SiteInfoBlock
                    label="E-mails"
                    values={clientCase.siteSignals.emails}
                    fallback="Nenhum e-mail encontrado"
                  />
                  <SiteInfoBlock
                    label="Telefones"
                    values={clientCase.siteSignals.phones}
                    fallback="Nenhum telefone encontrado"
                  />
                </div>
              </TabsContent>

              <TabsContent value="declaration" className="pt-5">
                <SignedDeclarationPanel declaration={clientCase.latestSignedDeclaration} />
              </TabsContent>
            </Tabs>
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-xl border border-border bg-card p-5 ">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Timeline do caso
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aqui voce acompanha as atualizacoes registradas pela sua equipe e pela DNL.
                </p>
              </div>
              <Badge variant="outline">{clientCase.actionHistory.length} evento(s)</Badge>
            </div>

            <div className="mt-5">
              {clientCase.actionHistory.length > 0 ? (
                <div className="space-y-5">
                  {clientCase.actionHistory.map((action, index) => (
                    <TimelineItem
                      key={action.id}
                      title={formatActionLabel(action.action)}
                      subtitle={`${action.actorName ?? action.actorEmail ?? "Equipe DNL"} em ${formatDate(action.createdAt)}`}
                      reason={action.reason}
                      notes={action.notes}
                      occurrenceLabel={`Ocorrencia ${formatPublicId(
                        clientCase.placements.find((item) => item.id === action.detectionId)?.publicId ?? 0,
                      )}`}
                      hideConnector={index === clientCase.actionHistory.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Nenhum andamento foi registrado para este caso ate agora.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 ">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Contexto rapido</h2>
            <div className="mt-4 grid gap-3">
              <InfoBlock label="Imagem" value={clientCase.asset.title} />
              <InfoBlock
                label="IDs relacionados"
                value={`Caso ${formatPublicId(clientCase.publicId)} • Imagem ${formatPublicId(clientCase.asset.publicId)}`}
              />
              <InfoBlock label="Dominio" value={formatDomain(clientCase.domain)} />
            </div>

            <div className="mt-4 grid gap-2">
              <Button asChild className="w-full justify-start" size="sm" variant="outline">
                <a href={clientCase.sourceUrl} target="_blank" rel="noreferrer">
                  Abrir origem
                  <ExternalLinkIcon className="size-4" />
                </a>
              </Button>
              {clientCase.finalUrl && clientCase.finalUrl !== clientCase.sourceUrl ? (
                <Button asChild className="w-full justify-start" size="sm" variant="outline">
                  <a href={clientCase.finalUrl} target="_blank" rel="noreferrer">
                    Abrir destino final
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
