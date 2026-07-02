"use client";

import { useActionState, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  CircleIcon,
  FileSignatureIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";
import {
  confirmUnauthorizedUseAction,
  updateDetectionStatusAction,
  type DetectionDecisionActionState,
} from "@/app/actions/detections";
import { ClientSignatureField } from "@/components/signature/client-signature-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { buildRightsOwnershipConfirmationDocument } from "@/lib/rights-ownership-confirmation";
import { validateClientLegalProfile } from "@/lib/client-legal-profile";
import { cn } from "@/lib/utils";

type IncidentActionsPanelProps = {
  detectionId: string;
  currentStatus: string;
  assetPublicId: number;
  assetTitle: string;
  sourceUrl: string;
  domain: string | null;
  profile: {
    fullName: string | null;
    cpf: string | null;
    signerRole: string | null;
    signingCity: string | null;
    signature:
      | {
          payloadJson: string;
          signedName: string;
          svg: string;
          updatedAt: string;
        }
      | null;
  };
};

type DecisionOption = {
  nextStatus: "ignored" | "authorized" | "unauthorized";
  label: string;
  description: string;
  reason?: string;
  tone: "neutral" | "positive" | "destructive";
  icon: LucideIcon;
};

const initialActionState: DetectionDecisionActionState = {};

const decisionOptions: DecisionOption[] = [
  {
    nextStatus: "ignored",
    label: "Nao e a mesma imagem",
    description: "Use quando a pagina encontrada nao corresponde a imagem original.",
    reason: "not_same_image",
    tone: "neutral",
    icon: XCircleIcon,
  },
  {
    nextStatus: "authorized",
    label: "Uso autorizado",
    description: "Use quando este uso ja tem permissao, contrato ou contexto esperado.",
    tone: "positive",
    icon: ShieldCheckIcon,
  },
  {
    nextStatus: "unauthorized",
    label: "Uso nao autorizado",
    description: "Use quando este grupo deve virar um caso para acompanhamento da equipe DNL.",
    tone: "destructive",
    icon: ShieldAlertIcon,
  },
];

function normalizeDecisionStatus(status: string) {
  if (status === "possible_infringement") {
    return "unauthorized";
  }

  if (
    status === "ignored" ||
    status === "authorized" ||
    status === "unauthorized"
  ) {
    return status;
  }

  return null;
}

function getDecisionSummary(currentStatus: string) {
  const normalizedStatus = normalizeDecisionStatus(currentStatus);

  switch (normalizedStatus) {
    case "ignored":
      return {
        badgeVariant: "outline" as const,
        title: "Marcado como nao e a mesma imagem",
        description: "Este grupo foi removido do acompanhamento como ocorrencia valida.",
      };
    case "authorized":
      return {
        badgeVariant: "secondary" as const,
        title: "Marcado como uso autorizado",
        description: "Este grupo foi reconhecido como um uso permitido ou esperado.",
      };
    case "unauthorized":
      return {
        badgeVariant: "destructive" as const,
        title: "Marcado como uso nao autorizado",
        description: "Este grupo segue para a equipe DNL analisar o caso e definir os proximos passos.",
      };
    default:
      return null;
  }
}

function getOptionClasses(tone: DecisionOption["tone"], selected: boolean) {
  if (tone === "positive") {
    return selected
      ? "border-emerald-500 bg-emerald-500/12 text-emerald-950 hover:bg-emerald-500/16 dark:text-emerald-100"
      : "border-border bg-background text-foreground hover:border-emerald-400/70 hover:bg-emerald-500/5";
  }

  if (tone === "destructive") {
    return selected
      ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/12"
      : "border-border bg-background text-foreground hover:border-destructive/60 hover:bg-destructive/5";
  }

  return selected
    ? "border-foreground bg-muted text-foreground hover:bg-muted"
    : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/40";
}

function PendingSubmitButton(props: {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      variant="outline"
      className={cn(
        "h-auto w-full items-start justify-start rounded-xl px-4 py-4 text-left whitespace-normal",
        props.selected ? "" : "shadow-none",
        props.className,
      )}
    >
      {props.children}
    </Button>
  );
}

function DecisionCard(props: {
  detectionId: string;
  redirectTo: string;
  option: DecisionOption;
  selected: boolean;
}) {
  return (
    <form action={updateDetectionStatusAction}>
      <input type="hidden" name="detectionId" value={props.detectionId} />
      <input type="hidden" name="nextStatus" value={props.option.nextStatus} />
      <input type="hidden" name="scope" value="incident" />
      <input type="hidden" name="redirectTo" value={props.redirectTo} />
      {props.option.reason ? <input type="hidden" name="reason" value={props.option.reason} /> : null}
      <PendingSubmitButton
        className={getOptionClasses(props.option.tone, props.selected)}
        selected={props.selected}
      >
        <div className="flex w-full items-start gap-3">
          <props.option.icon className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{props.option.label}</span>
              {props.selected ? (
                <Badge variant={props.option.tone === "positive" ? "secondary" : "outline"}>
                  Selecionado
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm opacity-80">{props.option.description}</p>
          </div>
          {props.selected ? (
            <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
          ) : (
            <CircleIcon className="mt-0.5 size-5 shrink-0 opacity-50" />
          )}
        </div>
      </PendingSubmitButton>
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function UnauthorizedDecisionDialog(props: {
  detectionId: string;
  redirectTo: string;
  assetPublicId: number;
  assetTitle: string;
  sourceUrl: string;
  domain: string | null;
  profile: IncidentActionsPanelProps["profile"];
  selected: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(props.profile.fullName ?? "");
  const [cpf, setCpf] = useState(props.profile.cpf ?? "");
  const [signerRole, setSignerRole] = useState(props.profile.signerRole ?? "");
  const [signingCity, setSigningCity] = useState(props.profile.signingCity ?? "");
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [updateSignature, setUpdateSignature] = useState(!props.profile.signature);
  const [state, formAction, pending] = useActionState(
    confirmUnauthorizedUseAction,
    initialActionState,
  );

  const legalProfile = useMemo(
    () =>
      validateClientLegalProfile({
        fullName,
        cpf,
        signerRole,
        signingCity,
      }),
    [cpf, fullName, signerRole, signingCity],
  );

  const documentPreview = useMemo(() => {
    if (!legalProfile.ok) {
      return null;
    }

    return buildRightsOwnershipConfirmationDocument({
      assetPublicIds: [props.assetPublicId],
      signerFullName: legalProfile.profile.fullName,
      signerCpf: legalProfile.profile.cpf,
      signerRole: legalProfile.profile.signerRole,
      signingCity: legalProfile.profile.signingCity,
      statementDate: new Date(),
    });
  }, [legalProfile, props.assetPublicId]);

  return (
    <AlertDialog
      open={open && state.status !== "success"}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className={cn(
            "h-auto w-full items-start justify-start rounded-xl px-4 py-4 text-left whitespace-normal shadow-none",
            getOptionClasses("destructive", props.selected),
          )}
        >
          <div className="flex w-full items-start gap-3">
            <ShieldAlertIcon className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Uso nao autorizado</span>
                {props.selected ? <Badge variant="destructive">Selecionado</Badge> : null}
              </div>
              <p className="mt-1 text-sm opacity-80">
                Use quando este grupo deve virar um caso para acompanhamento da equipe DNL.
              </p>
            </div>
            {props.selected ? (
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
            ) : (
              <CircleIcon className="mt-0.5 size-5 shrink-0 opacity-50" />
            )}
          </div>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-0 p-0 shadow-2xl sm:max-w-6xl">
        <form action={formAction} className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,#f1d58f,transparent_30%),linear-gradient(145deg,#111827_0%,#1f2937_58%,#0f172a_100%)] px-6 py-7 text-white sm:px-8 sm:py-8">
            <AlertDialogHeader className="space-y-4">
              <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                Encaminhar para a DNL
              </div>
              <AlertDialogTitle className="text-left text-3xl leading-tight font-semibold text-white">
                Confirmar uso nao autorizado desta imagem?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left text-base leading-7 text-white/72">
                Antes de abrir o caso, precisamos gerar a declaracao assinada que
                confirma a titularidade da imagem e autoriza o prosseguimento do fluxo.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/58">
                  Imagem monitorada
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Imagem {String(props.assetPublicId).padStart(6, "0")}</p>
                <p className="mt-1 text-sm leading-6 text-white/72">{props.assetTitle}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/58">
                  Origem da ocorrencia
                </p>
                <p className="mt-2 text-sm font-medium text-white">{props.domain ?? "Site nao identificado"}</p>
                <p className="mt-1 break-all text-sm leading-6 text-white/72">{props.sourceUrl}</p>
              </div>

              {props.profile.signature && !updateSignature ? (
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/58">
                        Assinatura salva
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {props.profile.signature.signedName}
                      </p>
                      <p className="mt-1 text-sm text-white/72">
                        Atualizada em {formatDate(props.profile.signature.updatedAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setUpdateSignature(true)}
                    >
                      Refazer assinatura
                    </Button>
                  </div>
                  <div
                    className="mt-4 rounded-2xl border border-white/10 bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: props.profile.signature.svg }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/6 p-4 text-sm leading-6 text-white/72">
                  {props.profile.signature
                    ? "Voce optou por refazer a assinatura para este novo documento."
                    : "Esta e a primeira vez que voce encaminha um caso como uso nao autorizado. Crie a assinatura agora para salvar no perfil e reutilizar depois."}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-8">
            <input type="hidden" name="detectionId" value={props.detectionId} />
            <input type="hidden" name="redirectTo" value={props.redirectTo} />
            <input type="hidden" name="scope" value="incident" />
            <input type="hidden" name="updateSignature" value={updateSignature ? "yes" : "no"} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-5">
                <div>
                  <h3 className="font-heading text-xl font-semibold tracking-tight">
                    Dados do signatario
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Revise ou complete os dados da pessoa fisica que assina esta declaracao.
                  </p>
                </div>

                <div className="grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
                    <FieldContent>
                      <Input
                        id="fullName"
                        name="fullName"
                        onChange={(event) => setFullName(event.target.value)}
                        required
                        value={fullName}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                    <FieldContent>
                      <Input
                        id="cpf"
                        name="cpf"
                        onChange={(event) => setCpf(event.target.value)}
                        placeholder="000.000.000-00"
                        required
                        value={cpf}
                      />
                      <FieldError errors={state.fieldErrors?.cpf?.map((message) => ({ message }))} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="signerRole">Qualificacao do signatario</FieldLabel>
                    <FieldContent>
                      <Input
                        id="signerRole"
                        name="signerRole"
                        onChange={(event) => setSignerRole(event.target.value)}
                        placeholder="Ex.: Fotografo profissional"
                        required
                        value={signerRole}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="signingCity">Cidade de assinatura</FieldLabel>
                    <FieldContent>
                      <Input
                        id="signingCity"
                        name="signingCity"
                        onChange={(event) => setSigningCity(event.target.value)}
                        placeholder="Ex.: Sao Paulo"
                        required
                        value={signingCity}
                      />
                      <FieldDescription>
                        A data do documento sera gerada com essa cidade.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </div>

                {updateSignature ? (
                  <div>
                    <ClientSignatureField
                      defaultPayloadJson={props.profile.signature?.payloadJson}
                      defaultSignedName={props.profile.signature?.signedName}
                      description="A assinatura salva aqui sera reutilizada nas proximas confirmacoes de titularidade."
                      suggestedSignedName={fullName}
                      title="Assinatura do signatario"
                    />
                    <FieldError errors={state.fieldErrors?.signature?.map((message) => ({ message }))} />
                  </div>
                ) : null}
              </div>

              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    <FileSignatureIcon className="size-3.5" />
                    Preview do termo
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Este documento sera salvo junto com o caso para consulta da equipe DNL.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-muted/20 p-5">
                  {documentPreview ? (
                    <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {documentPreview.body}
                    </pre>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm leading-6 text-muted-foreground">
                      {legalProfile.ok
                        ? "O preview sera carregado em instantes."
                        : legalProfile.message}
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                  <input
                    checked={confirmOwnership}
                    className="mt-1 size-4 rounded border border-input"
                    name="confirmOwnership"
                    onChange={(event) => setConfirmOwnership(event.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm leading-6 text-muted-foreground">
                    Confirmo que revisei este documento, que sou o titular ou signatario autorizado
                    da imagem informada e que desejo encaminhar esta ocorrencia como uso nao autorizado.
                  </span>
                </label>

                {state.message ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      state.status === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-destructive/20 bg-destructive/8 text-destructive"
                    }`}
                  >
                    {state.message}
                  </div>
                ) : null}
              </div>
            </div>

            <AlertDialogFooter className="mt-8 border-t border-border pt-5">
              <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
              <Button disabled={pending || !confirmOwnership || !documentPreview} type="submit">
                {pending ? "Salvando declaracao..." : "Confirmar uso nao autorizado"}
              </Button>
            </AlertDialogFooter>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function IncidentActionsPanel({
  detectionId,
  currentStatus,
  assetPublicId,
  assetTitle,
  sourceUrl,
  domain,
  profile,
}: IncidentActionsPanelProps) {
  const selectedDecision = normalizeDecisionStatus(currentStatus);
  const summary = getDecisionSummary(currentStatus);
  const redirectTo = `/detections/${detectionId}`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Acoes</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha como este grupo deve ser tratado. A decisao vale para esta imagem
          neste dominio.
        </p>
      </div>

      {summary ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={summary.badgeVariant}>{summary.title}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{summary.description}</p>

          <form action={updateDetectionStatusAction} className="mt-4">
            <input type="hidden" name="detectionId" value={detectionId} />
            <input type="hidden" name="nextStatus" value="pending" />
            <input type="hidden" name="scope" value="incident" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <PendingSubmitButton className="w-full border-border bg-background text-foreground hover:bg-muted">
              Cancelar decisao
            </PendingSubmitButton>
          </form>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">Nenhuma decisao registrada ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma das acoes abaixo para dizer se este uso deve ser ignorado,
            aceito ou encaminhado para a DNL.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {decisionOptions.map((option) =>
          option.nextStatus === "unauthorized" ? (
            <UnauthorizedDecisionDialog
              key={option.nextStatus}
              assetPublicId={assetPublicId}
              assetTitle={assetTitle}
              detectionId={detectionId}
              domain={domain}
              profile={profile}
              redirectTo={redirectTo}
              selected={selectedDecision === option.nextStatus}
              sourceUrl={sourceUrl}
            />
          ) : (
            <DecisionCard
              key={option.nextStatus}
              detectionId={detectionId}
              redirectTo={redirectTo}
              option={option}
              selected={selectedDecision === option.nextStatus}
            />
          ),
        )}
      </div>
    </div>
  );
}
