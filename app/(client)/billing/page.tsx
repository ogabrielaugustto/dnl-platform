import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  SparklesIcon,
} from "lucide-react";
import { createBillingCheckoutAction } from "@/app/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatPlanPrice,
  getSelectableBillingPlanFromPlans,
  type ListedBillingPlanCode,
} from "@/lib/billing/plans";
import { getClientBillingPageData } from "@/lib/dal/billing";

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string;
    error?: string;
    plan?: string;
    reason?: string;
  }>;
};

const planHighlights: Record<ListedBillingPlanCode, string[]> = {
  basic: [
    "7 dias grátis antes da primeira cobrança",
    "Monitoramento assistido para começar com clareza",
    "Painel para ativos, ocorrências e histórico",
  ],
  professional: [
    "7 dias grátis antes da primeira cobrança",
    "Acompanhamento ampliado para operação contínua",
    "Mais contexto para revisão e priorização",
  ],
  custom: [
    "Operação desenhada com a equipe DNL",
    "Condições comerciais personalizadas",
    "Disponível em breve",
  ],
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const data = await getClientBillingPageData();
  const preferredPlan = getSelectableBillingPlanFromPlans(data.plans, params.plan);
  const hasAccess = data.access.hasAccess;

  return (
    <section className="flex flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
              Assinatura
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
              Escolha um plano para ativar seu workspace.
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              A assinatura fica vinculada à organização{" "}
              <strong className="font-medium text-foreground">
                {data.organization.name}
              </strong>
              . O teste grátis dura 7 dias e o cartão só será cobrado ao fim
              desse período.
            </p>
          </div>
          {hasAccess ? (
            <Badge className="gap-2" variant="secondary">
              <CheckCircle2Icon className="size-4" />
              Assinatura liberada
            </Badge>
          ) : null}
        </div>

        {params.checkout === "cancelled" ? (
          <BillingNotice tone="neutral">
            Checkout cancelado. Seu cadastro continua salvo; escolha um plano
            quando quiser ativar o teste grátis.
          </BillingNotice>
        ) : null}

        {params.reason === "missing_subscription" ? (
          <BillingNotice tone="warning">
            Para usar o painel de monitoramento, ative uma assinatura da
            organização.
          </BillingNotice>
        ) : null}

        {params.reason === "payment_required" ? (
          <BillingNotice tone="warning">
            A assinatura precisa de atenção antes de liberar novas operações.
          </BillingNotice>
        ) : null}

        {params.error ? (
          <BillingNotice tone="warning">
            Não foi possível iniciar o checkout agora. Tente novamente em
            instantes.
          </BillingNotice>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {data.plans.map((plan) => {
          const isPreferred = preferredPlan?.code === plan.code;
          const isSelectable = plan.isSelectable && !hasAccess;

          return (
            <Card
              key={plan.code}
              className={[
                "flex h-full flex-col",
                isPreferred ? "border-primary shadow-[0_18px_60px_rgba(37,99,235,0.12)]" : "",
              ].join(" ")}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {plan.code === "professional" ? (
                      <SparklesIcon className="size-5" />
                    ) : (
                      <CreditCardIcon className="size-5" />
                    )}
                  </span>
                  {plan.isComingSoon ? (
                    <Badge variant="outline">Em breve</Badge>
                  ) : isPreferred ? (
                    <Badge>Selecionado</Badge>
                  ) : null}
                </div>
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="mt-2 min-h-12">
                    {plan.description}
                  </CardDescription>
                </div>
                <div>
                  <p className="font-heading text-4xl font-semibold tracking-tight">
                    {formatPlanPrice(plan.priceCents)}
                  </p>
                  {!plan.isComingSoon ? (
                    <p className="text-sm text-muted-foreground">por mês</p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {planHighlights[plan.code].map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.isComingSoon ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/contato">Falar com a DNL</Link>
                  </Button>
                ) : (
                  <form action={createBillingCheckoutAction} className="w-full">
                    <input name="planCode" type="hidden" value={plan.code} />
                    <Button className="w-full" disabled={!isSelectable} type="submit">
                      {hasAccess ? "Assinatura ativa" : "Ativar teste grátis"}
                      {!hasAccess ? <ArrowRightIcon /> : null}
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function BillingNotice({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "neutral" | "warning";
}) {
  return (
    <div
      className={[
        "mt-6 rounded-xl border px-4 py-3 text-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-blue-200 bg-blue-50 text-blue-950",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
