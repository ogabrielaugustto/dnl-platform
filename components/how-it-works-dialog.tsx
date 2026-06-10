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
    title: "Você escolhe o que proteger",
    description:
      "Cadastre suas imagens na galeria e indique quais obras merecem acompanhamento contínuo.",
  },
  {
    icon: SearchCheckIcon,
    title: "A DNL acompanha possíveis usos",
    description:
      "Nossa plataforma busca ocorrências, organiza os registros encontrados e reúne sinais importantes para análise.",
  },
  {
    icon: CheckCircle2Icon,
    title: "Você confirma o contexto",
    description:
      "Antes de qualquer encaminhamento, você avalia se aquele uso é autorizado, irrelevante ou merece atenção.",
  },
  {
    icon: BriefcaseIcon,
    title: "Casos relevantes seguem para a equipe",
    description:
      "Quando algo parece indevido, a ocorrência deixa de ser apenas um alerta e entra no fluxo de acompanhamento da DNL.",
  },
  {
    icon: FileTextIcon,
    title: "A documentação é preparada com cuidado",
    description:
      "O time revisa as informações, estrutura os materiais de apoio e define o melhor próximo passo para o caso.",
  },
  {
    icon: ScaleIcon,
    title: "Você conta com condução especializada",
    description:
      "A partir daí, a DNL conduz o acompanhamento com atenção jurídica e operacional, mantendo você amparado durante a jornada.",
  },
];

export function HowItWorksDialog({ trigger }: HowItWorksDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <ScaleIcon className="size-5" />
          </div>
          <DialogTitle className="text-xl leading-tight">
            Como funciona a DNL
          </DialogTitle>
          <DialogDescription className="max-w-xl text-pretty leading-6">
            Da proteção das suas imagens ao acompanhamento dos casos, a DNL
            combina tecnologia, curadoria humana e orientação especializada.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(100svh-220px)] overflow-y-auto px-6 pb-6 sm:px-8">
          <div className="relative grid gap-0 border-t border-border/70 pt-6">
            <div
              aria-hidden="true"
              className="absolute bottom-8 left-5 top-8 hidden w-px bg-border sm:block"
            />
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative grid gap-3 pb-6 sm:grid-cols-[40px_1fr] sm:gap-5"
              >
                <div className="relative z-10 flex size-10 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border">
                  <step.icon className="size-4" />
                </div>
                <div className="min-w-0 rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm shadow-black/5 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-medium leading-6 text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:pl-9">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground sm:p-5">
            <strong className="font-medium text-foreground">
              Você decide o que avança.
            </strong>{" "}
            Uma ocorrência encontrada não é tratada automaticamente como
            infração. A validação humana é parte essencial do processo e garante
            que cada caso siga com contexto, critério e responsabilidade.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
