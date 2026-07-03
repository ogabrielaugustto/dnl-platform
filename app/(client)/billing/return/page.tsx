import { redirect } from "next/navigation";
import { requirePanelAccess } from "@/lib/auth";
import { getCurrentOrganizationSubscription } from "@/lib/dal/billing";
import { syncCheckoutSessionById } from "@/lib/billing/stripe-sync";
import { hasOperationalBillingAccess } from "@/lib/billing/subscriptions";

type BillingReturnPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function BillingReturnPage({
  searchParams,
}: BillingReturnPageProps) {
  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    redirect("/onboarding");
  }

  const params = await searchParams;

  if (!params.session_id) {
    redirect("/billing?error=missing-session");
  }

  try {
    await syncCheckoutSessionById(params.session_id);
  } catch {
    redirect("/billing?error=sync");
  }

  const subscription = await getCurrentOrganizationSubscription(
    membership.organizationId,
  );

  if (hasOperationalBillingAccess(subscription?.status)) {
    redirect("/dashboard");
  }

  redirect("/billing?checkout=processing");
}
