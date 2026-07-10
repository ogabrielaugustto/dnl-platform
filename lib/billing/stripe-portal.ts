import type Stripe from "stripe";

export function buildBillingPortalSessionParams({
  appUrl,
  customerId,
}: {
  appUrl: string;
  customerId: string;
}): Stripe.BillingPortal.SessionCreateParams {
  return {
    customer: customerId,
    return_url: `${appUrl.replace(/\/$/, "")}/billing`,
  };
}
