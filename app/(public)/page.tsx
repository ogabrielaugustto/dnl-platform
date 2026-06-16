import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BellRingIcon,
  CheckCircle2Icon,
  EyeIcon,
  FolderKanbanIcon,
  Layers3Icon,
  LockKeyholeIcon,
  SearchCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Landing Page",
  description:
    "Direito na Lente ajuda fotógrafos, agências e marcas a monitorar imagens, revisar ocorrências e proteger o uso licenciado de seus ativos visuais.",
};

const featureCards = [
  {
    icon: EyeIcon,
    title: "Monitoramento com leitura operacional",
    description:
      "Acompanhe ocorrências encontradas e entenda o que já tem evidência, o que ainda está processando e o que exige revisão.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Análise com apoio humano especializado",
    description:
      "Você não recebe só um alerta solto. A plataforma organiza contexto, evidência e revisão para apoiar decisões com mais segurança.",
  },
  {
    icon: FolderKanbanIcon,
    title: "Tudo em um único painel",
    description:
      "Cadastre imagens, acompanhe varreduras, revise ocorrências e mantenha o histórico da proteção dos seus ativos no mesmo lugar.",
  },
];

const workflowSteps = [
  "Você sobe suas imagens e organiza seus ativos visuais",
  "A plataforma monitora a web e identifica usos relacionados",
  "As ocorrências aparecem com status, contexto e evidências",
  "Você revisa o que faz sentido e ganha apoio especializado por trás do processo",
  "Seu histórico fica centralizado para acompanhamento contínuo",
];

const proofItems = [
  "Cadastro simples para começar a monitorar suas imagens",
  "Ocorrências com leitura clara do que está em processamento e do que exige revisão",
  "Evidências e histórico organizados no mesmo painel",
  "Apoio humano por trás da operação para aumentar sua segurança",
];

const valueCards = [
  {
    icon: Layers3Icon,
    title: "Seus ativos em um só lugar",
    description:
      "Centralize imagens, monitoramento, ocorrências e histórico de acompanhamento.",
  },
  {
    icon: BellRingIcon,
    title: "Você entende rápido o que importa",
    description:
      "A interface destaca o que está em espera, em processamento e o que merece sua atenção agora.",
  },
  {
    icon: SparklesIcon,
    title: "Mais tranquilidade no acompanhamento",
    description:
      "Por trás da plataforma existe revisão e acompanhamento especializado para fortalecer a segurança das suas imagens.",
  },
];

const complianceCards = [
  {
    icon: ShieldCheckIcon,
    title: "LGPD como diretriz operacional",
    description:
      "Tratamento de dados com foco em necessidade, segregação por organização, autenticação e segurança da operação.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Controles de acesso",
    description:
      "A plataforma trabalha com acesso autenticado, contexto por organização e papéis distintos entre cliente e administração.",
  },
  {
    icon: BellRingIcon,
    title: "Transparência para o usuário",
    description:
      "Termos de uso, política de privacidade e banner de cookies ficam acessíveis desde a primeira navegação.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-8 sm:px-6 sm:py-10 lg:gap-20 lg:px-8 lg:py-20">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex w-full items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm text-primary sm:w-auto">
            <BadgeCheckIcon className="size-4 shrink-0" />
            Plataforma para monitoramento de imagens com revisão humana
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-7xl">
              Descubra onde suas imagens estão sendo usadas e acompanhe tudo em um só lugar.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:leading-8 lg:text-lg">
              {APP_NAME} foi feita para fotógrafos, agências, estúdios e marcas
              que querem subir suas imagens, acompanhar ocorrências e proteger
              melhor o uso licenciado dos seus ativos visuais com apoio humano e
              mais clareza no processo.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="w-full sm:w-auto" size="lg">
              <Link href="/auth/register">
                Criar conta
                <ArrowRightIcon className="size-4 shrink-0" />
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto" size="lg" variant="outline">
              <Link href="/auth/login">Entrar</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {proofItems.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border bg-white/80 px-4 py-4 shadow-xs"
              >
                <span className="mt-0.5 flex size-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2Icon className="size-4" />
                </span>
                <p className="text-sm leading-6 text-foreground/85">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.95),transparent_28%),linear-gradient(135deg,oklch(0.2_0.04_260),oklch(0.3_0.05_240))] text-white shadow-[0_28px_90px_rgba(37,99,235,0.25)] ring-0">
          <CardHeader className="space-y-4">
            <CardTitle className="text-white">O que você acompanha na prática</CardTitle>
            <CardDescription className="text-white/75">
              Desde o envio da imagem até a revisão das ocorrências, você enxerga
              o andamento do monitoramento com muito mais contexto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-white/6 p-4">
              <p className="text-sm uppercase tracking-[0.28em] text-white/55">
                Estados importantes
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Aguardando varredura",
                  "Processando",
                  "Ocorrências encontradas",
                  "Aguardando revisão",
                  "Possível infração",
                ].map((status) => (
                  <span
                    key={status}
                    className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white"
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-10 min-h-10 min-w-10 shrink-0 self-start items-center justify-center rounded-2xl bg-white/14 text-white">
                  <SearchCheckIcon className="size-4" />
                </span>
                <div className="space-y-2">
                  <p className="font-medium text-white">Mais segurança para decidir</p>
                  <p className="text-sm leading-7 text-white/75">
                    Cada detecção vem como apoio ao seu acompanhamento. Por trás da
                    plataforma existe revisão humana para dar mais confiança ao processo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                  Seus ativos
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Você sobe imagens, acompanha usos encontrados e mantém tudo organizado.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                  Sua segurança
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  O processo conta com acompanhamento especializado para apoiar a revisão.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {featureCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="bg-white/85 shadow-[0_18px_60px_rgba(37,99,235,0.08)]"
            >
              <CardHeader className="space-y-4">
                <span className="flex size-12 min-h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {valueCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] shadow-[0_16px_48px_rgba(37,99,235,0.08)]">
              <CardHeader className="space-y-4">
                <span className="flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-6 rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.88))] p-8 shadow-[0_24px_80px_rgba(37,99,235,0.08)] lg:p-10">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
            Privacidade e conformidade
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Sua conta com mais transparência e proteção de dados.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground lg:text-base">
            Desde o primeiro acesso, você encontra informações claras sobre
            cookies, autenticação, privacidade e tratamento de dados, com base em
            LGPD e foco em segurança da sua conta.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {complianceCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="bg-white/90 shadow-[0_14px_40px_rgba(37,99,235,0.06)]">
                <CardHeader className="space-y-4">
                  <span className="flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {item.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        id="como-funciona"
        className="grid gap-8 rounded-[2rem] bg-white/85 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.08)] lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:p-10"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
            Como funciona
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Entenda em minutos como começar a monitorar suas imagens.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground lg:text-base">
            O processo foi desenhado para ser simples: você cadastra, acompanha,
            revisa e ganha mais visibilidade sobre onde suas imagens aparecem.
          </p>
        </div>

        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-4 rounded-2xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.76))] px-4 py-4"
            >
              <span className="flex size-10 min-h-10 min-w-10 shrink-0 self-start items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-7 text-foreground/85">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Crie sua conta e comece a acompanhar suas imagens hoje.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Se você quer mais controle sobre onde seus ativos visuais aparecem,
            esse é o ponto de partida para organizar o monitoramento e revisar
            ocorrências com muito mais clareza.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto" size="lg">
            <Link href="/auth/register">Criar conta</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto" size="lg" variant="outline">
            <Link href="/sobre">Conhecer a proposta</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
