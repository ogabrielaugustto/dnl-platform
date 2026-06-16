"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  FileBadge2Icon,
  HeartHandshakeIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarsIcon,
} from "lucide-react";
import { completeCustomerOnboardingAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SignupOnboardingDialogProps = {
  onboarding: {
    email: string;
    fullName: string;
    organizationName: string;
    requiresEmailConfirmation: boolean;
  } | null;
};

const dialogInitialState: {
  message?: string;
  status?: "error" | "success";
} = {};

const assurances = [
  {
    icon: SparklesIcon,
    title: "Bem-vindo a uma experiência mais cuidadosa",
    description:
      "Sua conta já nasceu preparada para organizar imagens, monitorar sinais de uso e acompanhar cada ocorrência com contexto.",
  },
  {
    icon: ScanSearchIcon,
    title: "Buscas com tecnologia e revisão humana",
    description:
      "A DNL realiza buscas e consolida indícios, mas a validação continua sendo feita com critério antes de qualquer conclusão.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Rastreabilidade e segurança desde o início",
    description:
      "Mantemos registros de aceite, contexto operacional e evidências para sustentar a jornada de proteção das suas imagens.",
  },
];

const authorizationParagraphs = [
  "Este Termo de Autorização para Monitoramento e Declaração de Titularidade regula a ativação da sua conta na DNL. Ao concluir o aceite, você autoriza a DNL a realizar buscas automatizadas e manuais relacionadas às imagens, artes, fotografias e demais ativos visuais cadastrados por você na plataforma, com a finalidade de identificar usos potencialmente não autorizados, reunir sinais técnicos, organizar evidências operacionais e disponibilizar essas informações para sua análise.",
  "Você declara, sob sua responsabilidade, que possui autoria, titularidade, licença válida ou poderes suficientes para cadastrar os materiais enviados à DNL e para solicitar o monitoramento desses conteúdos. Também declara que os arquivos e informações fornecidos não violam direitos de terceiros e que foram incluídos na plataforma de boa-fé, para fins legítimos de proteção, acompanhamento e eventual encaminhamento operacional.",
  "A DNL poderá tratar dados relacionados ao uso da plataforma, aos ativos cadastrados e às buscas realizadas, incluindo registros técnicos de acesso, data e horário, endereço IP, identificadores de sessão, contexto de aceite, agente do navegador e histórico de interações relevantes. Esses registros são mantidos para segurança, prevenção a fraude, auditoria, rastreabilidade, atendimento a obrigações legais e reforço probatório da origem das solicitações realizadas dentro da plataforma.",
  "Ao aceitar este termo, você reconhece que uma ocorrência encontrada não configura, por si só, infração confirmada. Os resultados retornados pela plataforma representam sinais para revisão humana e podem demandar análise complementar, validação de contexto, conferência de autoria, checagem de licenças, interpretação jurídica e definição operacional posterior pela DNL e por você.",
  "Você também autoriza que a DNL utilize os materiais cadastrados e os sinais coletados durante o monitoramento para apresentar, dentro da própria plataforma, painéis, ocorrências, comparativos visuais, histórico de revisões e outros elementos necessários para que você identifique usos suspeitos e decida se determinado caso deve ser autorizado, ignorado ou encaminhado como uso não autorizado para acompanhamento da equipe DNL.",
  "Se houver informações incorretas, ativos cadastrados sem poderes suficientes ou qualquer uso indevido da plataforma, a DNL poderá suspender análises, solicitar documentos complementares, restringir funcionalidades e adotar as medidas internas cabíveis. O aceite deste termo é condição obrigatória para liberação do primeiro acesso e para continuidade do uso da conta criada.",
];

function getFirstName(fullName: string) {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return "cliente";
  }

  return trimmed.split(/\s+/)[0] ?? "cliente";
}

export function SignupOnboardingDialog({
  onboarding,
}: SignupOnboardingDialogProps) {
  const [step, setStep] = useState<"welcome" | "terms">("welcome");
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [state, formAction, pending] = useActionState(
    completeCustomerOnboardingAction,
    dialogInitialState,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isOpen = Boolean(onboarding);

  useEffect(() => {
    if (!isOpen || step !== "terms") {
      return;
    }

    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const updateReachedEnd = () => {
      const remaining =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setHasReachedEnd(remaining <= 8);
    };

    updateReachedEnd();
    container.addEventListener("scroll", updateReachedEnd, { passive: true });

    return () => {
      container.removeEventListener("scroll", updateReachedEnd);
    };
  }, [isOpen, step]);

  if (!onboarding) {
    return null;
  }

  const canSubmit = hasReachedEnd && hasAcceptedTerms && !pending;

  return (
    <Dialog
      key={`${onboarding.email}:${String(onboarding.requiresEmailConfirmation)}`}
      open={isOpen}
      onOpenChange={() => undefined}
    >
      <DialogContent
        className="gap-0 overflow-hidden border-0 bg-background p-0 shadow-2xl sm:max-w-4xl"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        {step === "welcome" ? (
          <div className="grid max-h-[calc(100svh-2rem)] overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#f7d27e,transparent_32%),linear-gradient(135deg,#101828_0%,#1f2937_52%,#0f172a_100%)] px-6 py-7 text-white sm:px-8 sm:py-8">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.10),transparent_28%,transparent_72%,rgba(255,255,255,0.05))]" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.18em] text-white/80 uppercase">
                    <StarsIcon className="size-3.5" />
                    Conta criada com sucesso
                  </div>
                  <DialogHeader className="space-y-3">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#f7d27e] shadow-lg shadow-black/20">
                      <HeartHandshakeIcon className="size-7" />
                    </div>
                    <DialogTitle className="max-w-xl text-3xl leading-tight font-semibold sm:text-4xl">
                      Seja bem-vindo ao DNL, {getFirstName(onboarding.fullName)}.
                    </DialogTitle>
                    <DialogDescription className="max-w-2xl text-base leading-7 text-white/72">
                      Parabéns por criar sua conta. Agora falta só um último
                      passo para liberar o seu primeiro acesso e começar a
                      proteger as imagens da {onboarding.organizationName}.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="grid gap-3">
                  {assurances.map((item) => (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-[#f7d27e]">
                          <item.icon className="size-4.5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-white/68">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 px-6 py-7 sm:px-8 sm:py-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary uppercase">
                  <CheckCircle2Icon className="size-3.5" />
                  Etapa 1 de 2
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-semibold tracking-tight">
                    Antes de entrar, vamos alinhar a jornada da sua conta
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    No próximo passo, você verá um termo obrigatório com a
                    autorização de monitoramento, declaração sobre os arquivos
                    enviados e o registro de aceite necessário para a ativação
                    da conta.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">
                    O que acontece depois do aceite final
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>Você libera o primeiro acesso da conta criada.</li>
                    <li>A DNL registra o aceite com contexto técnico de auditoria.</li>
                    <li>As próximas buscas passam a seguir o fluxo oficial da plataforma.</li>
                  </ul>
                </div>

                {onboarding.requiresEmailConfirmation ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
                    Depois do aceite, sua conta poderá pedir a confirmação do
                    e-mail antes do primeiro login. Se isso acontecer, basta
                    usar o link enviado para o endereço{" "}
                    <strong>{onboarding.email}</strong>.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Este modal é obrigatório para concluir a ativação da conta.
                </p>
                <Button
                  className="min-w-40"
                  onClick={() => setStep("terms")}
                  type="button"
                >
                  Avançar
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form action={formAction} className="grid max-h-[calc(100svh-2rem)] overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border bg-muted/20 px-6 py-7 sm:px-8 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary uppercase">
                <FileBadge2Icon className="size-3.5" />
                Etapa 2 de 2
              </div>
              <DialogHeader className="mt-5 space-y-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <ShieldCheckIcon className="size-6" />
                </div>
                <DialogTitle className="text-2xl leading-tight">
                  Termo obrigatório para ativação da conta
                </DialogTitle>
                <DialogDescription className="text-sm leading-6">
                  Leia até o final para liberar o botão de aceite. Esse registro
                  será salvo com contexto técnico de auditoria para reforçar a
                  rastreabilidade do onboarding.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">
                  O que este aceite cobre
                </p>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  <li>Autorização para a DNL realizar buscas sobre os ativos enviados.</li>
                  <li>Declaração de autoria, titularidade ou poderes de uso sobre as imagens.</li>
                  <li>Registro de IP, navegador, data, horário e contexto de aceite.</li>
                </ul>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                Para avançar, role o texto até o final. O botão só será
                liberado quando a leitura chegar ao fim.
              </div>

              {state.message ? (
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {state.message}
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-col bg-background">
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto px-6 py-7 sm:px-8"
              >
                <div className="mx-auto max-w-2xl space-y-5">
                  <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Termo de Autorização para Monitoramento e Declaração de
                    Titularidade
                  </h3>
                  {authorizationParagraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 32)}
                      className="text-sm leading-7 text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}

                  <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm leading-7 text-muted-foreground">
                    Este aceite complementa os{" "}
                    <Link
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                      href="/termos-de-uso"
                      target="_blank"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                      href="/politica-de-privacidade"
                      target="_blank"
                    >
                      Política de Privacidade
                    </Link>{" "}
                    da plataforma.
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-6 py-5 sm:px-8">
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                  <Checkbox
                    checked={hasAcceptedTerms}
                    className="mt-1"
                    onCheckedChange={(checked) => setHasAcceptedTerms(checked === true)}
                  />
                  <span className="text-sm leading-6 text-muted-foreground">
                    Confirmo que li o termo acima até o final e aceito a
                    autorização de monitoramento, a declaração sobre a
                    titularidade dos ativos enviados e o registro técnico deste
                    aceite.
                  </span>
                </label>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {hasReachedEnd
                      ? "Leitura concluída. Você já pode confirmar o aceite."
                      : "Role até o final do texto para liberar a confirmação."}
                  </p>
                  <Button className="min-w-48" disabled={!canSubmit} type="submit">
                    {pending ? "Salvando aceite..." : "Aceitar e continuar"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
