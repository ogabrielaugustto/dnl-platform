export type LocalSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "paused"
  | "incomplete"
  | "unpaid";

export type BillingAccessState =
  | {
      hasAccess: true;
      reason: "ok";
    }
  | {
      hasAccess: false;
      reason: "missing_subscription" | "payment_required";
    };

export type SubscriptionAccessInput = {
  status: string | null;
};

export function mapStripeSubscriptionStatus(status: string): LocalSubscriptionStatus {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "paused":
    case "incomplete":
    case "unpaid":
      return status;
    case "canceled":
      return "cancelled";
    case "incomplete_expired":
      return "expired";
    default:
      return "past_due";
  }
}

export function hasOperationalBillingAccess(status: string | null | undefined) {
  return status === "trialing" || status === "active";
}

export function getBillingAccessState(
  subscription: SubscriptionAccessInput | null,
): BillingAccessState {
  if (!subscription?.status) {
    return {
      hasAccess: false,
      reason: "missing_subscription",
    };
  }

  if (hasOperationalBillingAccess(subscription.status)) {
    return {
      hasAccess: true,
      reason: "ok",
    };
  }

  return {
    hasAccess: false,
    reason: "payment_required",
  };
}
