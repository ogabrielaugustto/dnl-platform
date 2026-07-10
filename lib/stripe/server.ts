import "server-only";

import Stripe from "stripe";
import { z } from "zod";
import { normalizeStripeWebhookSecrets } from "@/lib/stripe/webhook-secrets";

const stripeEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  NEXT_PUBLIC_URL: z.url().optional(),
  STRIPE_CLI_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PUBLIC_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
}).refine((env) => normalizeStripeWebhookSecrets(env).length > 0, {
  message: "Configure STRIPE_WEBHOOK_SECRET ou STRIPE_CLI_WEBHOOK_SECRET.",
});

let stripeClient: Stripe | null = null;

function getStripeEnv() {
  return stripeEnvSchema.parse(process.env);
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeEnv().STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  return getStripeWebhookSecrets()[0];
}

export function getStripeWebhookSecrets() {
  return normalizeStripeWebhookSecrets(getStripeEnv());
}

export function getStripeAppUrl() {
  const env = getStripeEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? env.NEXT_PUBLIC_URL;

  if (!appUrl) {
    throw new Error("Configure NEXT_PUBLIC_APP_URL ou NEXT_PUBLIC_URL para usar o checkout.");
  }

  return appUrl.replace(/\/$/, "");
}
