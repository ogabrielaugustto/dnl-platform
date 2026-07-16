"use client";

import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
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
import {
  formatCpfInput,
  isValidCpf,
  normalizeCpf,
  validateClientLegalProfile,
} from "@/lib/client-legal-profile";
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

type UnauthorizedDecisionStep = "review" | "signer" | "confirm";

const initialActionState: DetectionDecisionActionState = {};

const decisionOptions: DecisionOption[] = [
  {
    nextStatus: "ignored",
    label: "Não é a mesma imagem",
    description: "Use quando a página encontrada não corresponde à imagem original.",
    reason: "not_same_image",
    tone: "neutral",
    icon: XCircleIcon,
  },
  {
    nextStatus: "authorized",
    label: "Uso autorizado",
    description: "Use quando este uso já tem permissão, contrato ou contexto esperado.",
    tone: "positive",
    icon: ShieldCheckIcon,
  },
  {
    nextStatus: "unauthorized",
    label: "Uso não autorizado",
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
        title: "Marcado como não é a mesma imagem",
        description: "Este grupo foi removido do acompanhamento como ocorrência válida.",
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
        title: "Marcado como uso não autorizado",
        description: "Este grupo segue para a equipe DNL analisar o caso e definir os próximos passos.",
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
    ? "border-amber-500 bg-amber-500/12 text-amber-950 hover:bg-amber-500/16 dark:text-amber-100"
    : "border-border bg-background text-foreground hover:border-amber-400/70 hover:bg-amber-500/5";
}

function getOptionIconClasses(tone: DecisionOption["tone"]) {
  if (tone === "positive") {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (tone === "destructive") {
    return "text-destructive";
  }

  return "text-amber-500 dark:text-amber-400";
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
      {props.option.reason ? (
        <input type="hidden" name="reason" value={props.option.reason} />
      ) : null}
      <PendingSubmitButton
        className={getOptionClasses(props.option.tone, props.selected)}
        selected={props.selected}
      >
        <div className="flex w-full items-start gap-3">
          <props.option.icon
            className={cn("mt-0.5 size-5 shrink-0", getOptionIconClasses(props.option.tone))}
          />
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
            <CheckCircle2Icon
              className={cn("mt-0.5 size-5 shrink-0", getOptionIconClasses(props.option.tone))}
            />
          ) : (
            <CircleIcon
              className={cn(
                "mt-0.5 size-5 shrink-0 opacity-70",
                getOptionIconClasses(props.option.tone),
              )}
            />
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

const unauthorizedDecisionSteps: Array<{
  id: UnauthorizedDecisionStep;
  label: string;
}> = [
  { id: "review", label: "Ocorrência" },
  { id: "signer", label: "Signatário" },
  { id: "confirm", label: "Confirmação" },
];

function getUnauthorizedDecisionStepIndex(step: UnauthorizedDecisionStep) {
  return unauthorizedDecisionSteps.findIndex((item) => item.id === step);
}

function UnauthorizedDecisionStepIndicator(props: {
  currentStep: UnauthorizedDecisionStep;
}) {
  const currentStepIndex = getUnauthorizedDecisionStepIndex(props.currentStep);

  return (
    <div className="grid grid-cols-3 gap-2">
      {unauthorizedDecisionSteps.map((step, index) => {
        const isActive = step.id === props.currentStep;
        const isCompleted = index < currentStepIndex;

        return (
          <div
            key={step.id}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "min-w-0 rounded-lg border px-3 py-2 text-xs transition-colors",
              isActive
                ? "border-primary bg-primary/8 text-primary"
                : isCompleted
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-border bg-muted/30 text-muted-foreground",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-background text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="truncate font-medium">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const [step, setStep] = useState<UnauthorizedDecisionStep>("review");
  const [fullName, setFullName] = useState(props.profile.fullName ?? "");
  const [cpf, setCpf] = useState(formatCpfInput(props.profile.cpf));
  const [signerRole, setSignerRole] = useState(props.profile.signerRole ?? "");
  const [signingCity, setSigningCity] = useState(props.profile.signingCity ?? "");
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [updateSignature, setUpdateSignature] = useState(!props.profile.signature);
  const [signatureValid, setSignatureValid] = useState(Boolean(props.profile.signature));
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

  const canContinueFromSigner =
    legalProfile.ok && (!updateSignature || signatureValid);
  const cpfDigits = normalizeCpf(cpf);
  const cpfErrors =
    cpfDigits.length > 0 && !isValidCpf(cpf)
      ? [{ message: "CPF deve ter 11 dígitos válidos." }]
      : [];
  const cpfFieldErrors = [
    ...cpfErrors,
    ...(state.fieldErrors?.cpf?.map((message) => ({ message })) ?? []),
  ];

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setStep("review");
      setConfirmOwnership(false);
    }
  }

  return (
    <AlertDialog
      open={open && state.status !== "success"}
      onOpenChange={handleOpenChange}
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
            <ShieldAlertIcon
              className={cn("mt-0.5 size-5 shrink-0", getOptionIconClasses("destructive"))}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Uso não autorizado</span>
                {props.selected ? <Badge variant="destructive">Selecionado</Badge> : null}
              </div>
              <p className="mt-1 text-sm opacity-80">
                Use quando este grupo deve virar um caso para acompanhamento da equipe DNL.
              </p>
            </div>
            {props.selected ? (
              <CheckCircle2Icon
                className={cn("mt-0.5 size-5 shrink-0", getOptionIconClasses("destructive"))}
              />
            ) : (
              <CircleIcon
                className={cn(
                  "mt-0.5 size-5 shrink-0 opacity-70",
                  getOptionIconClasses("destructive"),
                )}
              />
            )}
          </div>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] overflow-hidden border-0 p-0 shadow-2xl sm:!max-w-3xl">
        <form
          action={formAction}
          className="grid max-h-[calc(100svh-2rem)] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]"
        >
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <AlertDialogHeader className="space-y-3 text-left">
              <div className="inline-flex w-fit items-center rounded-full bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                Encaminhar para a DNL
              </div>
              <AlertDialogTitle className="text-left text-2xl leading-tight font-semibold">
                Confirmar uso não autorizado desta imagem?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left text-sm leading-6">
                Revise a ocorrência, complete os dados do signatário e confirme o termo
                para encaminhar à equipe DNL.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-5">
              <UnauthorizedDecisionStepIndicator currentStep={step} />
            </div>
          </div>

          <input type="hidden" name="detectionId" value={props.detectionId} />
          <input type="hidden" name="redirectTo" value={props.redirectTo} />
          <input type="hidden" name="scope" value="incident" />
          <input type="hidden" name="updateSignature" value={updateSignature ? "yes" : "no"} />

          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
            <section className={step === "review" ? "space-y-4" : "hidden"}>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  Revise a ocorrência
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Confirme que esta imagem e esta origem devem seguir para análise da DNL.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Imagem
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    Imagem {String(props.assetPublicId).padStart(6, "0")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{props.assetTitle}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Origem
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {props.domain ?? "Site não identificado"}
                  </p>
                  <p className="mt-1 break-all text-sm leading-6 text-muted-foreground">
                    {props.sourceUrl}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Ao confirmar, a ocorrência vira um caso para acompanhamento da equipe DNL.
                </div>
              </div>
            </section>

            <section className={step === "signer" ? "space-y-5" : "hidden"}>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  Dados do signatário
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Informe quem assina a declaração de titularidade.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                      aria-invalid={cpfErrors.length > 0 ? true : undefined}
                      autoComplete="off"
                      id="cpf"
                      inputMode="numeric"
                      maxLength={14}
                      name="cpf"
                      onChange={(event) => setCpf(formatCpfInput(event.target.value))}
                      placeholder="000.000.000-00"
                      required
                      value={cpf}
                    />
                    <FieldError errors={cpfFieldErrors} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="signerRole">Qualificação do signatário</FieldLabel>
                  <FieldContent>
                    <Input
                      id="signerRole"
                      name="signerRole"
                      onChange={(event) => setSignerRole(event.target.value)}
                      placeholder="Ex.: Fotógrafo profissional"
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
                      placeholder="Ex.: São Paulo"
                      required
                      value={signingCity}
                    />
                    <FieldDescription>
                      A data do documento será gerada com essa cidade.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </div>

              {props.profile.signature && !updateSignature ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Assinatura salva</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {props.profile.signature.signedName} · atualizada em{" "}
                        {formatDate(props.profile.signature.updatedAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUpdateSignature(true);
                        setSignatureValid(Boolean(props.profile.signature));
                      }}
                    >
                      Refazer assinatura
                    </Button>
                  </div>
                  <div
                    className="mt-4 rounded-lg border border-border bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: props.profile.signature.svg }}
                  />
                </div>
              ) : (
                <div>
                  <ClientSignatureField
                    defaultPayloadJson={props.profile.signature?.payloadJson}
                    defaultSignedName={props.profile.signature?.signedName}
                    description="Salvamos esta assinatura para reaproveitar em próximas confirmações."
                    onValidityChange={setSignatureValid}
                    suggestedSignedName={fullName}
                    title="Assinatura do signatário"
                  />
                  <FieldError errors={state.fieldErrors?.signature?.map((message) => ({ message }))} />
                </div>
              )}
            </section>

            <section className={step === "confirm" ? "space-y-5" : "hidden"}>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  Conferir e confirmar
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Revise o termo gerado antes de encaminhar a ocorrência.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                  <FileSignatureIcon className="size-3.5" />
                  Termo
                </div>
                {documentPreview ? (
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-7 text-foreground">
                    {documentPreview.body}
                  </pre>
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-background px-4 py-5 text-sm leading-6 text-muted-foreground">
                    {legalProfile.ok
                      ? "O preview será carregado em instantes."
                      : legalProfile.message}
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <input
                  checked={confirmOwnership}
                  className="mt-1 size-4 rounded border border-input"
                  name="confirmOwnership"
                  onChange={(event) => setConfirmOwnership(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm leading-6 text-muted-foreground">
                  Confirmo que revisei o documento, que sou o titular ou signatário autorizado
                  da imagem e desejo encaminhar esta ocorrência como uso não autorizado.
                </span>
              </label>

              {state.message ? (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    state.status === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-destructive/20 bg-destructive/8 text-destructive"
                  }`}
                >
                  {state.message}
                </div>
              ) : null}
            </section>
          </div>

          <AlertDialogFooter className="border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {step !== "review" ? (
                <Button
                  disabled={pending}
                  onClick={() => setStep(step === "confirm" ? "signer" : "review")}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeftIcon className="size-4" />
                  Voltar
                </Button>
              ) : null}

              {step === "review" ? (
                <Button onClick={() => setStep("signer")} type="button">
                  Continuar
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : null}

              {step === "signer" ? (
                <Button
                  disabled={!canContinueFromSigner}
                  onClick={() => setStep("confirm")}
                  type="button"
                >
                  Continuar
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : null}

              {step === "confirm" ? (
                <Button disabled={pending || !confirmOwnership || !documentPreview} type="submit">
                  {pending ? "Salvando..." : "Confirmar uso não autorizado"}
                </Button>
              ) : null}
            </div>
          </AlertDialogFooter>
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
        <h2 className="font-heading text-xl font-semibold tracking-tight">Ações</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha como este grupo deve ser tratado. A decisão vale para esta imagem
          neste domínio.
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
              Cancelar decisão
            </PendingSubmitButton>
          </form>
        </div>
      ) : null}

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
