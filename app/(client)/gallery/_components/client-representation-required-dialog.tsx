"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { FileSignatureIcon, MailCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  requestSoaSignatureAction,
  type SoaSignatureActionState,
} from "@/app/actions/client-representation-documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ClientRepresentationDefaults,
  ClientRepresentationUploadGate,
} from "@/lib/dal/client-representation-documents";

const initialState: SoaSignatureActionState = {};

type ClientRepresentationRequiredDialogProps = {
  defaults: ClientRepresentationDefaults;
  gate: ClientRepresentationUploadGate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClientRepresentationRequiredDialog({
  defaults,
  gate,
  open,
  onOpenChange,
}: ClientRepresentationRequiredDialogProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    requestSoaSignatureAction,
    initialState,
  );
  const hasPendingRequest =
    gate.blockReason === "pending" && gate.document?.status === "signature_requested";
  const success = state.status === "success";

  useEffect(() => {
    if (state.status !== "success" || !state.message) {
      return;
    }

    toast.success(state.message, { duration: 6_000 });
    router.refresh();
  }, [router, state.message, state.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b border-border bg-muted/35 px-6 py-5">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md border border-border bg-background shadow-sm">
              <FileSignatureIcon className="size-5 text-primary" aria-hidden="true" />
            </div>
            <DialogTitle>Assinatura do SOA obrigatoria</DialogTitle>
            <DialogDescription className="max-w-xl leading-6">
              Antes de iniciar o monitoramento da primeira imagem, precisamos que voce
              assine a representacao da Direito na Lente pela Clicksign.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form action={action} className="space-y-5 px-6 py-5">
          {hasPendingRequest ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              O SOA ja foi enviado para {gate.document?.signerEmail}. Assine pelo
              e-mail recebido e depois confirme o envio das imagens novamente.
            </div>
          ) : null}

          {success ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
              <div className="flex items-start gap-3">
                <MailCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  {state.message} Depois da assinatura, volte para a galeria e confirme
                  o envio das imagens novamente.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="soa-full-name">Nome completo</Label>
              <Input
                id="soa-full-name"
                name="fullName"
                defaultValue={defaults.fullName ?? ""}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soa-email">E-mail para assinatura</Label>
              <Input
                id="soa-email"
                name="email"
                type="email"
                defaultValue={defaults.email ?? ""}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soa-cpf">CPF</Label>
              <Input
                id="soa-cpf"
                name="cpf"
                defaultValue={defaults.cpf ?? ""}
                inputMode="numeric"
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soa-marital-status">Estado civil</Label>
              <Input
                id="soa-marital-status"
                name="maritalStatus"
                placeholder="solteiro, casada, divorciada..."
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="soa-address">Endereco completo</Label>
            <Textarea
              id="soa-address"
              name="address"
              defaultValue={defaults.address ?? ""}
              rows={4}
              required
            />
          </div>

          {state.status === "error" && state.message ? (
            <FieldError>{state.message}</FieldError>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Voltar para galeria
            </Button>
            <Button type="submit" disabled={pending || success}>
              <FileSignatureIcon className="size-4" aria-hidden="true" />
              {pending ? "Enviando..." : "Solicitar assinatura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
