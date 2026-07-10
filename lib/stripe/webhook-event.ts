import type Stripe from "stripe";

export function constructStripeWebhookEvent({
  payload,
  secrets,
  signature,
  stripe,
}: {
  payload: string;
  secrets: string[];
  signature: string;
  stripe: Stripe;
}) {
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch {
      // Try the next configured signing secret. The route returns 400 if none match.
    }
  }

  return null;
}
