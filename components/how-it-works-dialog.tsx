"use client";

import * as React from "react";
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  FileTextIcon,
  ScaleIcon,
  SearchCheckIcon,
  UploadCloudIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type HowItWorksDialogProps = {
  trigger: React.ReactNode;
};

const steps = [
  {
    icon: UploadCloudIcon,
    title: "Cliente envia as imagens",
    description:
      "Voce cadastra as obras que deseja proteger e ativa o monitoramento na galeria.",
  },
  {
    icon: SearchCheckIcon,
    title: "A DNL monitora possiveis usos",
    description:
      "A plataforma registra ocorrencias encontradas e organiza evidencias como apoio operacional.",
  },
  {
    icon: CheckCircle2Icon,
    title: "Cliente valida cada ocorrencia",
    description:
      "Voce confirma se o uso e autorizado, se deve ser ignorado ou se parece nao autorizado.",
  },
  {
    icon: BriefcaseIcon,
    title: "Uso nao autorizado vira caso",
    description:
      "Quando marcado como infracao, o registro passa para acompanhamento da equipe DNL.",
  },
  {
    icon: FileTextIcon,
    title: "DNL prepara a notificacao",
    description:
      "O time interno revisa as informacoes, monta o template adequado e define o proximo passo.",
  },
  {
    icon: ScaleIcon,
    title: "Acompanhamento juridico manual",
    description:
      "A jornada continua no painel admin, com apoio juridico e operacional da DNL.",
  },
];

export function HowItWorksDialog({ trigger }: HowItWorksDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="border-b border-border bg-muted/20">
          <DialogTitle>Como funciona a DNL</DialogTitle>
          <DialogDescription>
            Do envio da imagem ate o acompanhamento do caso pela equipe DNL.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(100svh-220px)] overflow-y-auto px-6 pb-6">
          <div className="relative ml-5 grid gap-0 pt-6">
            <div
              aria-hidden="true"
              className="absolute bottom-6 left-5 top-6 w-px bg-border"
            />
            {steps.map((step, index) => (
              <div key={step.title} className="relative grid grid-cols-[40px_1fr] gap-4 pb-5 last:pb-0">
                <div className="relative z-10 flex size-10 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border">
                  <step.icon className="size-4" />
                </div>
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-medium text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/25 p-4 text-sm text-muted-foreground">
            Uma ocorrencia nao e automaticamente uma infracao. A validacao humana
            do cliente e o que define se ela deve virar caso para a equipe DNL.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
