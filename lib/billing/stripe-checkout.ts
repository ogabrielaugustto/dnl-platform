import type Stripe from "stripe";
import type { BillingPlanDefinition } from "@/lib/billing/plans";

type CheckoutPlan = Pick<
  BillingPlanDefinition,
  "billingInterval" | "code" | "currency" | "description" | "name" | "priceCents"
>;

export function buildSubscriptionCheckoutLineItem(
  plan: CheckoutPlan,
): Stripe.Checkout.SessionCreateParams.LineItem {
  if (plan.priceCents === null || plan.priceCents <= 0) {
    throw new Error("Plano selecionavel precisa ter valor recorrente.");
  }

  if (plan.billingInterval !== "monthly") {
    throw new Error("Checkout de assinatura suporta apenas plano mensal nesta versao.");
  }

  return {
    price_data: {
      currency: plan.currency.toLowerCase(),
      product_data: {
        description: plan.description,
        metadata: {
          planCode: plan.code,
        },
        name: plan.name,
      },
      recurring: {
        interval: "month",
      },
      unit_amount: plan.priceCents,
    },
    quantity: 1,
  };
}
