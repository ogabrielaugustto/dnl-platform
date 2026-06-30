"use client";

import { useActionState } from "react";
import { saveClientSignatureAction, type SettingsActionState } from "@/app/actions/settings";
import { ClientSignatureField } from "@/components/signature/client-signature-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const initialState: SettingsActionState = {};

type SignatureRequiredDialogProps = {
  fullName: string | null;
  open: boolean;
};

export function SignatureRequiredDialog({
  fullName,
  open,
}: SignatureRequiredDialogProps) {
  const [state, action, pending] = useActionState(
    saveClientSignatureAction,
    initialState,
  );

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-h-[calc(100svh-2rem)] overflow-x-hidden overflow-y-auto border-0 bg-background p-0 shadow-2xl sm:max-w-4xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <form
          action={action}
          className="grid min-w-0 gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
        >
          <div className="min-w-0 bg-[radial-gradient(circle_at_top_left,#d9c17f,transparent_28%),linear-gradient(145deg,#0f172a_0%,#162338_48%,#0b1220_100%)] px-6 py-7 text-white sm:px-8 sm:py-8">
            <DialogHeader className="space-y-4">
              <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/78">
                Assinatura pendente
              </div>
              <DialogTitle className="max-w-xl text-3xl leading-tight font-semibold">
                Antes de seguir no painel, configure sua assinatura.
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-base leading-7 text-white/72">
                Essa assinatura fica salva no seu perfil para reaproveitar depois em termos,
                contratos, PDFs e registros formais da plataforma.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 grid gap-3">
              {[
                "A assinatura fica vinculada ao titular que opera a conta.",
                "Você pode desenhar com dedo, mouse ou usar o modo digitado.",
                "Depois, essa assinatura continua editável em Configurações > Perfil.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm leading-6 text-white/74"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 px-6 py-7 sm:px-8 sm:py-8">
            <ClientSignatureField
              description="Salve sua assinatura agora para liberar o uso do painel do cliente."
              suggestedSignedName={fullName}
              title="Assinatura da conta"
            />

            {state.message ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  state.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-destructive/20 bg-destructive/8 text-destructive"
                }`}
              >
                {state.message}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-muted-foreground">
                Esse passo é obrigatório para continuar usando o painel do cliente.
              </p>
              <Button className="min-w-44" disabled={pending} type="submit">
                {pending ? "Salvando assinatura..." : "Salvar e continuar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
