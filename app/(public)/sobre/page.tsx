import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  EyeIcon,
  FolderKanbanIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça a proposta da Direito na Lente para monitoramento de imagens com validação humana e evidências operacionais.",
};

const principles = [
  {
    icon: EyeIcon,
    title: "Monitoramento com contexto",
    description:
      "A plataforma organiza ativos, acompanha ocorrências e mostra o que precisa de revisão sem transformar sinais em conclusões automáticas.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Validação humana obrigatória",
    description:
      "Uma detecção não vira infração sozinha. A equipe ou o cliente revisa o contexto antes de classificar um uso como autorizado, ignorado ou não autorizado.",
  },
  {
    icon: FolderKanbanIcon,
    title: "Operação contínua",
    description:
      "Depois da triagem do cliente, o caso segue com histórico, evidências e acompanhamento operacional.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:gap-16 lg:px-8 lg:py-24">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-end">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
            Sobre a plataforma
          </p>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">
            A plataforma organiza o fluxo entre detecção, evidência e decisão humana.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground lg:text-lg">
            O foco não é apenas encontrar usos na internet. O foco é transformar
            esse monitoramento em um processo claro para o cliente revisar,
            encaminhar e acompanhar junto da equipe da Direito na Lente.
          </p>
        </div>

        <Card className="border-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.95),transparent_30%),linear-gradient(135deg,oklch(0.2_0.04_260),oklch(0.3_0.05_240))] text-white ring-0">
          <CardHeader>
            <CardTitle className="text-white">Fluxo central do produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-white/75">
            <p>Upload do ativo</p>
            <p>Monitoramento e novas varreduras</p>
            <p>Ocorrências encontradas</p>
            <p>Captura de evidências</p>
            <p>Revisão humana e classificação</p>
            <p>Acompanhamento com apoio especializado</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {principles.map((item) => {
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

      <section className="grid gap-6 rounded-[2rem] bg-white/85 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.08)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-10">
        <div className="space-y-3">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Estruture seu monitoramento em um único lugar.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            A conta do cliente já nasce pronta para cadastrar imagens, revisar
            ocorrências e acompanhar melhor o uso dos seus ativos visuais.
          </p>
          <p className="max-w-2xl text-sm leading-7 text-primary">
            A experiência institucional também destaca privacidade, cookies e tratamento de dados em conformidade com a LGPD.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" size="lg">
          <Link href="/auth/register">
            Criar conta
            <ArrowRightIcon className="size-4 shrink-0" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
