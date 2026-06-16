import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { getPendingSignupOnboarding } from "@/lib/signup-onboarding";

export default async function RegisterPage() {
  const pendingOnboarding = await getPendingSignupOnboarding();

  if (!pendingOnboarding) {
    await redirectAuthenticatedUser("client");
  }

  return (
    <AuthShell
      asideDescription="Crie sua conta para começar a organizar imagens e acompanhar ocorrências em um único lugar."
      asideTitle="Criar conta"
      description="Cadastre sua conta e o primeiro espaço da sua organização."
      eyebrow="Cadastro"
      title="Cadastro"
    >
      <SignupForm
        initialOnboarding={
          pendingOnboarding
            ? {
                email: pendingOnboarding.email,
                fullName: pendingOnboarding.fullName,
                organizationName: pendingOnboarding.organizationName,
                requiresEmailConfirmation:
                  pendingOnboarding.requiresEmailConfirmation,
              }
            : null
        }
      />
    </AuthShell>
  );
}
