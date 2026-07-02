import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { updateAdminDetectionStatusAction } from "@/app/actions/admin-detections";
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
    case "marcada_como_possivel_infracao":
      return "Marcado como possivel infracao";
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

function DecisionButton({
  detectionId,
  organizationId,
  casePublicId,
  nextStatus,
  label,
  reason,
  variant = "outline",
}: {
  detectionId: string;
  organizationId: string;
  casePublicId: number;
  nextStatus: string;
  label: string;
  reason?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  return (
    <form action={updateAdminDetectionStatusAction}>
      <input type="hidden" name="detectionId" value={detectionId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />
      <input type="hidden" name="scope" value="incident" />
      <input
        type="hidden"
        name="redirectTo"
        value={`/admin/cases/${organizationId}/${casePublicId}`}
      />
      {reason ? <input type="hidden" name="reason" value={reason} /> : null}
      <Button type="submit" size="sm" variant={variant} className="w-full justify-start">
        {label}
      </Button>
    </form>
  );
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

function SignedDeclarationPanel(props: {
  declaration: NonNullable<Awaited<ReturnType<typeof getAdminCaseDetails>>>["latestSignedDeclaration"];
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
          Declaracao recebida do cliente
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoBlock label="Imagem" value={formatPublicId(props.declaration.assetPublicId)} />
          <InfoBlock label="Recebida em" value={formatDate(props.declaration.createdAt)} />
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
          Assinatura aplicada
        </h2>
        <div
          className="mt-4 overflow-hidden rounded-2xl border border-border bg-white p-4 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: props.declaration.signatureSvg }}
        />
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Documento salvo em {formatDate(props.declaration.createdAt)} com template {props.declaration.templateVersion}.
        </div>
      </div>
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
    <article className="relative pl-6">
      <span className="absolute left-0 top-1.5 size-2.5 rounded-full bg-foreground/80" />
      {hideConnector ? null : (
        <span className="absolute left-[4px] top-5 h-[calc(100%-12px)] w-px bg-border" />
      )}
      <div className="rounded-lg border border-border bg-muted/20 p-3">
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
            Consolidado operacional do caso validado pelo cliente, com foco em leitura
            rapida, andamento do time DNL e contexto do uso encontrado.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Cliente {adminCase.organization.name} • Imagem {formatPublicId(adminCase.asset.publicId)} •{" "}
            {adminCase.detectionPublicIds.length} ocorrencia(s)
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
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
              <InfoBlock label="Dominio principal" value={formatDomain(adminCase.domain)} />
              <InfoBlock
                label="Encaminhado pelo cliente"
                value={formatDate(adminCase.clientReviewedAt)}
              />
              <InfoBlock label="Ultima deteccao" value={formatDate(adminCase.latestSeenAt)} />
              <InfoBlock
                label="Capturas validas"
                value={`${adminCase.capturedEvidenceCount}/${adminCase.placementsCount}`}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        Resumo operacional
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Caso consolidado por dominio e imagem, pronto para decisao do time
                        juridico-operacional.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <InfoBlock
                          label="Cliente"
                          value={adminCase.organization.name}
                        />
                        <InfoBlock
                          label="Ativo monitorado"
                          value={formatPublicId(adminCase.asset.publicId)}
                        />
                        <InfoBlock
                          label="Ultima acao"
                          value={
                            adminCase.latestAction
                              ? `${formatActionLabel(adminCase.latestAction.action)} em ${formatDate(adminCase.latestAction.createdAt)}`
                              : "Sem andamento registrado"
                          }
                        />
                        <InfoBlock
                          label="Ocorrencias do caso"
                          value={adminCase.detectionPublicIds.map((id) => formatPublicId(id)).join(" • ")}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        Referencias principais
                      </h2>
                      <div className="mt-4 grid gap-3">
                        <InfoBlock label="Titulo da imagem" value={adminCase.asset.title} />
                        <InfoBlock
                          label="Arquivo original"
                          value={adminCase.asset.originalFileName ?? "Nao informado"}
                        />
                        <InfoBlock label="URL base" value={adminCase.sourceUrl} breakAll />
                        <InfoBlock
                          label="Destino final"
                          value={adminCase.finalUrl ?? "Nao identificado"}
                          breakAll
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">
                      Paginas do caso
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Lista rapida das paginas agrupadas neste caso, com cobertura de
                      evidencia e volume por pagina.
                    </p>
                    <div className="mt-4 space-y-3">
                      {adminCase.pages.map((page) => (
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
                  {adminCase.pages.map((page) => (
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
                  <InfoBlock label="Dominio" value={formatDomain(adminCase.domain)} />
                  <InfoBlock
                    label="Nome do site"
                    value={adminCase.siteSignals.siteName ?? "Nao informado"}
                  />
                  <InfoBlock
                    label="URL final"
                    value={adminCase.finalUrl ?? "Nao identificado"}
                    breakAll
                  />
                  <InfoBlock
                    label="Cobertura"
                    value={formatEvidenceCoverage(adminCase.evidenceCoverage)}
                  />
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  <SiteInfoBlock
                    label="CNPJ"
                    values={adminCase.siteSignals.cnpjCandidates}
                    fallback="Nenhum CNPJ encontrado"
                  />
                  <SiteInfoBlock
                    label="E-mails"
                    values={adminCase.siteSignals.emails}
                    fallback="Nenhum e-mail encontrado"
                  />
                  <SiteInfoBlock
                    label="Telefones"
                    values={adminCase.siteSignals.phones}
                    fallback="Nenhum telefone encontrado"
                  />
                </div>
              </TabsContent>

              <TabsContent value="declaration" className="pt-5">
                <SignedDeclarationPanel declaration={adminCase.latestSignedDeclaration} />
              </TabsContent>
            </Tabs>
          </section>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="font-heading text-xl font-semibold tracking-tight">Acoes do caso</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              As acoes abaixo atualizam o andamento operacional deste caso no painel
              administrativo.
            </p>
            <div className="mt-4 grid gap-2">
              <DecisionButton
                detectionId={adminCase.representativeDetectionId}
                organizationId={resolvedParams.organizationId}
                casePublicId={adminCase.publicId}
                nextStatus="unauthorized"
                label="Uso nao autorizado"
                variant="default"
              />
              <DecisionButton
                detectionId={adminCase.representativeDetectionId}
                organizationId={resolvedParams.organizationId}
                casePublicId={adminCase.publicId}
                nextStatus="takedown_sent"
                label="Notificacao enviada"
              />
              <DecisionButton
                detectionId={adminCase.representativeDetectionId}
                organizationId={resolvedParams.organizationId}
                casePublicId={adminCase.publicId}
                nextStatus="resolved"
                label="Resolvido"
                variant="secondary"
              />
              <DecisionButton
                detectionId={adminCase.representativeDetectionId}
                organizationId={resolvedParams.organizationId}
                casePublicId={adminCase.publicId}
                nextStatus="authorized"
                label="Uso autorizado"
              />
              <DecisionButton
                detectionId={adminCase.representativeDetectionId}
                organizationId={resolvedParams.organizationId}
                casePublicId={adminCase.publicId}
                nextStatus="ignored"
                label="Ignorar"
                reason="admin_ignored"
              />
            </div>

            <div className="mt-4 grid gap-2">
              <Button asChild className="w-full justify-start" size="sm" variant="outline">
                <a href={adminCase.sourceUrl} target="_blank" rel="noreferrer">
                  Abrir origem
                  <ExternalLinkIcon className="size-4" />
                </a>
              </Button>
              {adminCase.finalUrl && adminCase.finalUrl !== adminCase.sourceUrl ? (
                <Button asChild className="w-full justify-start" size="sm" variant="outline">
                  <a href={adminCase.finalUrl} target="_blank" rel="noreferrer">
                    Abrir destino final
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList
                variant="line"
                className="w-full justify-start overflow-x-auto overflow-y-hidden border-b border-border p-0"
              >
                <TabsTrigger value="timeline" className="flex-none px-3 py-2">
                  Historico
                </TabsTrigger>
                <TabsTrigger value="context" className="flex-none px-3 py-2">
                  Contexto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="pt-5">
                {adminCase.actionHistory.length > 0 ? (
                  <div className="space-y-4">
                    {adminCase.actionHistory.map((action, index) => (
                      <TimelineItem
                        key={action.id}
                        title={formatActionLabel(action.action)}
                        subtitle={`${action.actorName ?? action.actorEmail ?? "Equipe DNL"} em ${formatDate(action.createdAt)}`}
                        reason={action.reason}
                        notes={action.notes}
                        occurrenceLabel={`Ocorrencia ${formatPublicId(
                          adminCase.placements.find((item) => item.id === action.detectionId)?.publicId ?? 0,
                        )}`}
                        hideConnector={index === adminCase.actionHistory.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Nenhum andamento foi registrado para este caso ate agora.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="context" className="pt-5">
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="font-heading text-base font-semibold tracking-tight">Cliente</h3>
                    <div className="mt-3 grid gap-3">
                      <InfoBlock label="Organizacao" value={adminCase.organization.name} />
                      <InfoBlock
                        label="E-mail"
                        value={adminCase.organization.billingEmail ?? "Sem e-mail de cobranca"}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="font-heading text-base font-semibold tracking-tight">
                      Ativo monitorado
                    </h3>
                    <div className="mt-3 grid gap-3">
                      <InfoBlock
                        label="Imagem"
                        value={formatPublicId(adminCase.asset.publicId)}
                      />
                      <InfoBlock label="Titulo" value={adminCase.asset.title} />
                      <InfoBlock
                        label="Arquivo original"
                        value={adminCase.asset.originalFileName ?? "Nao informado"}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="font-heading text-base font-semibold tracking-tight">
                      Referencias
                    </h3>
                    <div className="mt-3 grid gap-3">
                      <InfoBlock label="URL base" value={adminCase.sourceUrl} breakAll />
                      <InfoBlock
                        label="Destino final"
                        value={adminCase.finalUrl ?? "Nao identificado"}
                        breakAll
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </aside>
      </div>
    </section>
  );
}
