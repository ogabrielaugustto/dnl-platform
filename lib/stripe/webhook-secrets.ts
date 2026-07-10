type StripeWebhookSecretEnv = {
  STRIPE_CLI_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export function normalizeStripeWebhookSecrets(env: StripeWebhookSecretEnv) {
  return [
    env.STRIPE_WEBHOOK_SECRET,
    env.STRIPE_CLI_WEBHOOK_SECRET,
  ].reduce<string[]>((secrets, value) => {
    const secret = value?.trim();

    if (secret && !secrets.includes(secret)) {
      secrets.push(secret);
    }

    return secrets;
  }, []);
}
