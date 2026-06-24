"use client";

import {
  CheckCircle2Icon,
  CircleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateDetectionStatusAction } from "@/app/actions/detections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type IncidentActionsPanelProps = {
  detectionId: string;
  currentStatus: string;
};

type DecisionOption = {
  nextStatus: "ignored" | "authorized" | "unauthorized";
  label: string;
  description: string;
  reason?: string;
  tone: "neutral" | "positive" | "destructive";
  icon: LucideIcon;
};

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
    ? "border-foreground bg-muted text-foreground hover:bg-muted"
    : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/40";
}

function PendingSubmitButton(props: {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant="outline"
      disabled={pending}
      className={cn(
        "h-auto w-full items-start justify-start rounded-xl px-4 py-4 text-left whitespace-normal",
        props.selected ? "" : "shadow-none",
        props.className,
      )}
    >
      {pending ? "Salvando decisão..." : props.children}
    </Button>
  );
}

function DecisionCard(props: {
  detectionId: string;
  redirectTo: string;
  option: DecisionOption;
  selected: boolean;
}) {
  if (props.option.nextStatus === "unauthorized") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className={cn(
              "h-auto w-full items-start justify-start rounded-xl px-4 py-4 text-left whitespace-normal shadow-none",
              getOptionClasses(props.option.tone, props.selected),
            )}
          >
            <div className="flex w-full items-start gap-3">
              <props.option.icon className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{props.option.label}</span>
                  {props.selected ? <Badge variant="destructive">Selecionado</Badge> : null}
                </div>
                <p className="mt-1 text-sm opacity-80">{props.option.description}</p>
              </div>
              {props.selected ? (
                <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
              ) : (
                <CircleIcon className="mt-0.5 size-5 shrink-0 opacity-50" />
              )}
            </div>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar uso não autorizado?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está definindo que este grupo usa a sua imagem sem autorização.
              Ao continuar, a ocorrência seguirá para a equipe DNL analisar o caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <form action={updateDetectionStatusAction}>
              <input type="hidden" name="detectionId" value={props.detectionId} />
              <input type="hidden" name="nextStatus" value={props.option.nextStatus} />
              <input type="hidden" name="scope" value="incident" />
              <input type="hidden" name="redirectTo" value={props.redirectTo} />
              <AlertDialogAction type="submit">Confirmar decisão</AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

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

export function IncidentActionsPanel({
  detectionId,
  currentStatus,
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
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">Nenhuma decisão registrada ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma das ações abaixo para dizer se este uso deve ser ignorado,
            aceito ou encaminhado para a DNL.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {decisionOptions.map((option) => (
          <DecisionCard
            key={option.nextStatus}
            detectionId={detectionId}
            redirectTo={redirectTo}
            option={option}
            selected={selectedDecision === option.nextStatus}
          />
        ))}
      </div>
    </div>
  );
}
