import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BellRingIcon,
  CameraIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  FileSearchIcon,
  FolderKanbanIcon,
  Layers3Icon,
  LockKeyholeIcon,
  SearchCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPlanPrice } from "@/lib/billing/plans";
import { listBillingPlansFromDatabase } from "@/lib/dal/billing";
import {
  homeAudienceItems,
  homeBenefitCards,
  homeFaqItems,
  homeHero,
  homeHeroHighlights,
  homeProblemPoints,
  homeProductRows,
  homeProductStats,
  homeTrustItems,
  homeWorkflowSteps,
} from "@/lib/marketing/home-page-content";

export const metadata: Metadata = {
  title: "Monitoramento de imagens com revisão humana",
  description:
    "Monitore onde suas imagens aparecem, revise ocorrências com contexto e acione a DNL quando houver uso não autorizado.",
};

export const dynamic = "force-dynamic";

const benefitIcons = [
  SearchCheckIcon,
  ShieldCheckIcon,
  FolderKanbanIcon,
  BellRingIcon,
];

const trustIcons = [ShieldCheckIcon, LockKeyholeIcon, BadgeCheckIcon];

export default async function LandingPage() {
  const pricingPlans = await listBillingPlansFromDatabase();

  return (
    <div className="overflow-hidden">
      <section className="relative border-b bg-[linear-gradient(180deg,#f5f8ff_0%,#ffffff_72%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.10),transparent_26%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-center lg:px-8 lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-primary/15 bg-white/80 px-3 py-2 text-sm font-medium text-primary shadow-sm shadow-primary/5">
              <BadgeCheckIcon className="size-4 shrink-0" />
              <span className="truncate">{homeHero.eyebrow}</span>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {homeHero.headline}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {homeHero.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="h-11 w-full px-5 sm:w-auto" size="lg">
                <Link href={homeHero.primaryCta.href}>
                  {homeHero.primaryCta.label}
                  <ArrowRightIcon className="size-4 shrink-0" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 w-full bg-white/80 px-5 sm:w-auto"
                size="lg"
                variant="outline"
              >
                <Link href={homeHero.secondaryCta.href}>
                  {homeHero.secondaryCta.label}
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {homeHeroHighlights.map((item) => (
                <div
                  key={item}
                  className="flex min-h-20 items-start gap-3 rounded-md border bg-white/78 p-3 shadow-sm shadow-primary/5"
                >
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-sm leading-5 text-foreground/80">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <ProductMockup />
        </div>
      </section>

      <section
        id="problema"
        className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.74fr_1fr] lg:px-8 lg:py-20"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            O problema
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            O uso indevido quase nunca chega organizado.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Ele aparece em links soltos, prints fora de contexto e buscas manuais
            que consomem tempo. A plataforma organiza esse sinal antes de
            qualquer decisão.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {homeProblemPoints.map((item) => (
            <div
              key={item.title}
              className="rounded-md border bg-white p-5 shadow-sm shadow-primary/5"
            >
              <CircleAlertIcon className="size-5 text-primary" />
              <h3 className="mt-5 font-heading text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-white"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8 lg:py-20">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
              Como funciona
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight lg:text-5xl">
              Do upload ao encaminhamento, sem transformar ocorrência em certeza jurídica.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              O fluxo separa monitoramento, revisão e encaminhamento. O cliente
              entende o que foi encontrado, valida o uso e aciona a DNL quando
              existe uso não autorizado.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {homeWorkflowSteps.map((step) => (
              <div
                key={step.label}
                className="rounded-md border border-white/10 bg-white/[0.06] p-5"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {step.label}
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1">
          <ProductDetailPanel />
        </div>

        <div className="order-1 space-y-5 lg:order-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Produto
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            O painel mostra o que precisa de atenção, não só uma lista de links.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            A experiência foi desenhada para leitura operacional: status, fonte,
            evidência e próximo passo ficam próximos para reduzir ruído e acelerar
            a revisão.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ValuePill icon={UploadCloudIcon} text="Upload e organização de ativos" />
            <ValuePill icon={FileSearchIcon} text="Ocorrências com evidência" />
            <ValuePill icon={Layers3Icon} text="Histórico por organização" />
            <ValuePill icon={SparklesIcon} text="Apoio humano no encaminhamento" />
          </div>
        </div>
      </section>

      <section className="bg-[#f6f9ff]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Benefícios
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
              O ganho é sair da suspeita solta para uma rotina de revisão.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              A plataforma não promete mágica. Ela reduz atrito operacional para
              que você veja, compare e decida com mais contexto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {homeBenefitCards.map((item, index) => {
              const Icon = benefitIcons[index] ?? CheckCircle2Icon;

              return (
                <div
                  key={item.title}
                  className="rounded-md border bg-white p-5 shadow-sm shadow-primary/5"
                >
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:items-start lg:px-8 lg:py-20">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Para quem é
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Feito para quem trata imagem como ativo, não como arquivo esquecido.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            O melhor encaixe é para quem já tem acervo autoral, licenciado ou
            comercial e precisa entender onde esse material aparece depois da
            entrega.
          </p>
        </div>

        <div className="rounded-md border bg-white p-5 shadow-sm shadow-primary/5">
          <div className="flex items-center gap-3 border-b pb-4">
            <CameraIcon className="size-5 text-primary" />
            <p className="font-heading text-lg font-semibold">Perfis com fit</p>
          </div>
          <div className="mt-4 space-y-3">
            {homeAudienceItems.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-6 text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="border-y bg-[#0f172a] text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
              Planos
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight lg:text-5xl">
              Comece pelo teste grátis. Fale com a DNL se sua operação exigir mais contexto.
            </h2>
            <p className="text-sm leading-7 text-white/70 sm:text-base">
              Os planos abaixo vêm do cadastro real do sistema. Você pode começar
              pelo cadastro direto ou abrir uma conversa quando o volume e o
              risco pedirem uma avaliação mais próxima.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.code}
                className="flex h-full flex-col rounded-md border border-white/10 bg-white/[0.06] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-2xl font-semibold text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      {plan.description}
                    </p>
                  </div>
                  {plan.isComingSoon ? (
                    <span className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/65">
                      Em breve
                    </span>
                  ) : null}
                </div>

                <div className="mt-8">
                  <p className="font-heading text-4xl font-semibold tracking-tight">
                    {formatPlanPrice(plan.priceCents)}
                  </p>
                  {!plan.isComingSoon ? (
                    <p className="mt-1 text-sm text-white/55">por mês</p>
                  ) : null}
                </div>

                <p className="mt-6 flex-1 text-sm leading-7 text-white/65">
                  {plan.code === "custom"
                    ? "Para operações com volume, risco ou desenho comercial específico."
                    : "Inclui teste grátis, painel de monitoramento, ocorrências e histórico centralizado."}
                </p>

                {plan.isSelectable ? (
                  <Button asChild className="mt-6 h-11 w-full" size="lg">
                    <Link href={`/auth/register?plan=${plan.code}`}>
                      Começar teste grátis
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="mt-6 h-11 w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    size="lg"
                    variant="outline"
                  >
                    <Link href="/contato">Falar com a DNL</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="seguranca"
        className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-20"
      >
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Segurança e confiança
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Confiança aqui vem de processo claro, não de selo inventado.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            A DNL comunica apenas o que sustenta na operação: privacidade
            acessível, acesso autenticado, separação de papéis e revisão humana
            antes de tratar uma ocorrência como caso.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {homeTrustItems.map((item, index) => {
            const Icon = trustIcons[index] ?? ShieldCheckIcon;

            return (
              <div
                key={item.title}
                className="rounded-md border bg-white p-5 shadow-sm shadow-primary/5"
              >
                <Icon className="size-5 text-primary" />
                <h3 className="mt-5 font-heading text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="faq" className="bg-[#f6f9ff]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.74fr_1fr] lg:px-8 lg:py-20">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Perguntas frequentes
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
              Respostas diretas para decidir se faz sentido começar agora.
            </h2>
          </div>

          <div className="space-y-3">
            {homeFaqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-md border bg-white p-5 shadow-sm shadow-primary/5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg font-semibold">
                  {item.question}
                  <ArrowRightIcon className="size-4 shrink-0 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 rounded-md border bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_54%,#f8fbff_100%)] p-6 shadow-sm shadow-primary/10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              Comece a monitorar suas imagens com mais clareza.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Crie sua conta, cadastre seus ativos e veja como a DNL organiza o
              caminho entre ocorrência encontrada, revisão humana e encaminhamento.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 w-full px-5 sm:w-auto" size="lg">
              <Link href="/auth/register">
                Começar teste grátis
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 w-full bg-white/80 px-5 sm:w-auto"
              size="lg"
              variant="outline"
            >
              <Link href="/contato">Falar com a DNL</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[24px] bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-md border border-white/65 bg-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.26)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-300" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-300" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/40">
            Exemplo de painel
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {homeProductStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-md border border-white/10 bg-white/[0.06] p-4"
              >
                <p className="text-2xl font-semibold tracking-tight text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04]">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-white">Ocorrências recentes</p>
              <span className="rounded-md bg-sky-400/10 px-2 py-1 text-xs text-sky-200">
                Revisão ativa
              </span>
            </div>
            <div className="divide-y divide-white/10">
              {homeProductRows.map((row) => (
                <div
                  key={`${row.asset}-${row.source}`}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[1.1fr_0.9fr]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{row.asset}</p>
                    <p className="mt-1 text-xs text-white/45">{row.source}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/70">
                      {row.status}
                    </span>
                    <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/60">
                      {row.evidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailPanel() {
  return (
    <div className="overflow-hidden rounded-md border bg-white shadow-sm shadow-primary/10">
      <div className="border-b bg-[#f8fbff] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-heading text-lg font-semibold">Revisão de ocorrência</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Campanha editorial - Look 04
            </p>
          </div>
          <span className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            Aguardando revisão
          </span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b bg-slate-950 p-5 text-white md:border-b-0 md:border-r">
          <div className="aspect-[4/3] rounded-md border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.55),rgba(15,23,42,0.85)),radial-gradient(circle_at_70%_22%,rgba(255,255,255,0.22),transparent_24%)] p-4">
            <div className="flex h-full flex-col justify-between">
              <div className="flex justify-between gap-3">
                <span className="rounded-md bg-white/12 px-2.5 py-1 text-xs">
                  Ativo original
                </span>
                <CameraIcon className="size-5 text-white/70" />
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold">
                  Imagem #2048
                </p>
                <p className="mt-2 max-w-48 text-sm leading-6 text-white/65">
                  Referência visual protegida no acervo do cliente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Fonte" value="Blog comercial" />
            <MiniMetric label="Evidência" value="Screenshot capturado" />
            <MiniMetric label="Status" value="Aguardando decisão" />
            <MiniMetric label="Próximo passo" value="Validar autorização" />
          </div>

          <div className="rounded-md border bg-[#f8fbff] p-4">
            <div className="flex items-start gap-3">
              <SearchCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Leitura operacional</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  A ocorrência fica pronta para comparação, revisão do contexto e
                  decisão: autorizado, ignorado ou uso não autorizado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValuePill({
  icon: Icon,
  text,
}: Readonly<{
  icon: typeof UploadCloudIcon;
  text: string;
}>) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-white px-4 py-3 shadow-sm shadow-primary/5">
      <Icon className="size-4 shrink-0 text-primary" />
      <p className="text-sm font-medium text-foreground/85">{text}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
