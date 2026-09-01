"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
  MailIcon,
  PaperclipIcon,
  SendIcon,
} from "lucide-react";
import {
  executeAdminCaseCommunication,
  initialAdminCaseCommunicationState,
} from "@/app/actions/admin-case-communications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminCaseCommunicationDraft,
  CommunicationAttachmentPreview,
} from "@/lib/admin-case-communications";
import { ADMIN_CASE_ACTION_LABELS } from "@/lib/admin-case-workflow";

type AdminCaseCommunicationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  casePublicId: number;
  casePublicIdLabel: string;
  draft: AdminCaseCommunicationDraft;
  attachments: CommunicationAttachmentPreview[];
};

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? (
    <p className="text-xs text-destructive">{messages.join(" ")}</p>
  ) : null;
}

function attachmentStatus(attachment: CommunicationAttachmentPreview) {
  if (!attachment.available) {
    return "Não disponível";
  }

  return attachment.source === "case_document" ? "Arquivo privado" : "Snapshot assinado";
}

export function AdminCaseCommunicationDialog({
  open,
  onOpenChange,
  organizationId,
  casePublicId,
  casePublicIdLabel,
  draft,
  attachments,
}: AdminCaseCommunicationDialogProps) {
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction, pending] = useActionState(
    executeAdminCaseCommunication,
    initialAdminCaseCommunicationState,
  );
  const isDocumentation = draft.actionKind === "documentation_notice";
  const availableAttachments = attachments.filter((attachment) => attachment.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
        <form action={formAction} className="grid gap-5">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5">
                <MailIcon className="size-3.5" />
                Comunicação
              </Badge>
              <Badge variant="outline">Caso {casePublicIdLabel}</Badge>
              {step === "confirm" ? <Badge variant="secondary">Confirmação</Badge> : null}
            </div>
            <DialogTitle>{ADMIN_CASE_ACTION_LABELS[draft.actionKind]}</DialogTitle>
            <DialogDescription>
              {step === "edit"
                ? "Revise e edite a mensagem antes de avançar. Nenhum e-mail será enviado nesta etapa."
                : "Confira o resumo final. O envio e o registro no histórico ocorrerão após sua confirmação."}
            </DialogDescription>
          </DialogHeader>

          <input name="organizationId" type="hidden" value={organizationId} />
          <input name="casePublicId" type="hidden" value={casePublicId} />
          <input name="actionKind" type="hidden" value={draft.actionKind} />
          <input name="confirmed" type="hidden" value={confirmed ? "true" : "false"} />
          {step === "confirm" ? (
            <>
              <input name="to" type="hidden" value={to} />
              <input name="subject" type="hidden" value={subject} />
              <input name="body" type="hidden" value={body} />
              <input name="notes" type="hidden" value={notes} />
            </>
          ) : null}

          {step === "edit" ? (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Destinatário
                <Input
                  autoComplete="email"
                  name="to"
                  required
                  type="email"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
                <FieldError messages={state.fieldErrors?.to} />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Assunto
                <Input
                  maxLength={180}
                  name="subject"
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
                <FieldError messages={state.fieldErrors?.subject} />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Mensagem
                <Textarea
                  className="min-h-72 resize-y font-mono text-sm leading-6"
                  maxLength={12_000}
                  name="body"
                  required
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
                <FieldError messages={state.fieldErrors?.body} />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Nota interna <span className="font-normal text-muted-foreground">(opcional)</span>
                <Textarea
                  className="min-h-20 resize-y"
                  maxLength={2_000}
                  name="notes"
                  placeholder="Contexto que deve aparecer somente no histórico do caso."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <FieldError messages={state.fieldErrors?.notes} />
              </label>

              {isDocumentation ? (
                <section className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <PaperclipIcon className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Documentos da comunicação</h3>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Arquivos privados são anexados diretamente. Itens assinados sem binário local
                    são materializados em um snapshot documental.
                  </p>
                  <div className="mt-3 divide-y divide-border rounded-md border border-border bg-background">
                    {attachments.map((attachment) => (
                      <div
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                        key={`${attachment.kind}:${attachment.id}`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{attachment.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {attachment.fileName ?? attachment.kind.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={attachment.available ? "outline" : "secondary"}>
                          {attachmentStatus(attachment)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              <section className="rounded-lg border border-border">
                <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Para
                    </p>
                    <p className="mt-1 break-all text-sm font-medium">{to}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Assunto
                    </p>
                    <p className="mt-1 text-sm font-medium">{subject}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{body}</p>
                </div>
              </section>

              {isDocumentation ? (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                  <PaperclipIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {availableAttachments.length} anexo(s) disponível(is)
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {availableAttachments.length
                        ? availableAttachments.map((item) => item.title).join(" • ")
                        : "A mensagem será enviada sem anexos porque nenhum documento está disponível."}
                    </p>
                  </div>
                </div>
              ) : null}

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                />
                <span className="leading-5">
                  Confirmo que revisei destinatário, conteúdo e anexos e autorizo o envio desta
                  comunicação em nome da Direito na Lente.
                </span>
              </label>
              <FieldError messages={state.fieldErrors?.confirmed} />
            </div>
          )}

          {state.message ? (
            <div
              className={`flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${
                state.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-destructive/20 bg-destructive/8 text-destructive"
              }`}
            >
              {state.status === "success" ? (
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
              ) : null}
              <span>{state.message}</span>
            </div>
          ) : null}

          <DialogFooter>
            {state.status === "success" ? (
              <Button type="button" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            ) : step === "edit" ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!to.trim() || !subject.trim() || !body.trim()}
                  type="button"
                  onClick={() => {
                    setConfirmed(false);
                    setStep("confirm");
                  }}
                >
                  Revisar envio
                  <SendIcon className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  disabled={pending}
                  type="button"
                  variant="outline"
                  onClick={() => setStep("edit")}
                >
                  <ArrowLeftIcon className="size-4" />
                  Voltar e editar
                </Button>
                <Button disabled={!confirmed || pending} type="submit">
                  {pending ? "Enviando..." : "Confirmar e enviar"}
                  <SendIcon className="size-4" />
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
