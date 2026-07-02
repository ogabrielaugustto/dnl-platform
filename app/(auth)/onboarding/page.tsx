import { redirect } from "next/navigation";
import { CustomerOnboardingWizard } from "@/app/(auth)/onboarding/_components/customer-onboarding-wizard";
import { getAuthContext } from "@/lib/auth";
import { buildWorkspaceSuggestion } from "@/lib/customer-onboarding";
import { buildPendingSignupOnboardingFromMetadata, getPendingSignupOnboarding } from "@/lib/signup-onboarding";
import { createClient } from "@/lib/server";

async function getPendingOnboardingState() {
  const pending = await getPendingSignupOnboarding();

  if (pending) {
    return pending;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return buildPendingSignupOnboardingFromMetadata({
    userId: user.id,
    email: user.email,
    userMetadata: (user.user_metadata ?? {}) as Record<string, unknown>,
  });
}

export default async function OnboardingPage() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/auth/login");
  }

  if (context.isAdmin) {
    redirect("/admin");
  }

  if (context.membership) {
    redirect("/dashboard");
  }

  const pendingOnboarding = await getPendingOnboardingState();

  if (!pendingOnboarding) {
    redirect("/auth/register");
  }

  const initialWorkspaceName = buildWorkspaceSuggestion({
    fullName: pendingOnboarding.fullName,
    documentType: pendingOnboarding.documentType,
    company: pendingOnboarding.company,
  });

  return (
    <CustomerOnboardingWizard
      initialWorkspaceName={initialWorkspaceName}
      pendingOnboarding={pendingOnboarding}
    />
  );
}
