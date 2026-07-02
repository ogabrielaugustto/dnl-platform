import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export default async function RegisterPage() {
  await redirectAuthenticatedUser("client");

  return (
    <AuthShell
      asideDescription="Crie sua conta para começar a organizar imagens e acompanhar ocorrências em um único lugar."
      asideTitle="Criar conta"
      description="Cadastre sua conta para começar o onboarding inicial do seu workspace."
      eyebrow="Cadastro"
      title="Cadastro"
    >
      <SignupForm />
    </AuthShell>
  );
}
