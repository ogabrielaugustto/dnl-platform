import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, MailIcon, MessageSquareTextIcon } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com a equipe da Direito na Lente para conhecer a plataforma e estruturar seu monitoramento.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:gap-14 lg:px-8 lg:py-24">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] lg:items-start">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
            Contato
          </p>
          <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">
            Fale com a equipe e nos conte o seu contexto.
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground lg:text-lg">
            Se você quer entender melhor o fluxo, organizar o onboarding ou alinhar
            como a plataforma entra na operação do seu time, envie uma mensagem.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-white/85">
              <CardHeader className="space-y-4">
                <span className="flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <MailIcon className="size-5" />
                </span>
                <CardTitle>Resposta por e-mail</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                A equipe responde usando o e-mail informado no formulario.
              </CardContent>
            </Card>

            <Card className="bg-white/85">
              <CardHeader className="space-y-4">
                <span className="flex size-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquareTextIcon className="size-5" />
                </span>
                <CardTitle>Contexto operacional</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                Quanto mais contexto você mandar, mais objetiva fica a resposta.
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-white/90 shadow-[0_20px_70px_rgba(37,99,235,0.08)]">
          <CardHeader>
            <CardTitle>Enviar mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.95),transparent_30%),linear-gradient(135deg,oklch(0.2_0.04_260),oklch(0.3_0.05_240))] p-8 text-white lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="space-y-2">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Prefere começar pela conta?
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-white/75">
            Você pode criar o acesso agora e seguir com o onboarding a partir da
            própria plataforma.
          </p>
        </div>
        <Button asChild className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto" size="lg">
          <Link href="/auth/register">
            Criar conta
            <ArrowRightIcon className="size-4 shrink-0" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
