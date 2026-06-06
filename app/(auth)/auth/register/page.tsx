import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export default async function RegisterPage() {
  await redirectAuthenticatedUser("client");

  return (
    <AuthShell
      asideDescription="Crie sua conta para começar a organizar imagens e acompanhar ocorrencias em um unico lugar."
      asideTitle="Criar conta"
      description="Cadastre sua conta e o primeiro espaco da sua organizacao."
      eyebrow="Cadastro"
      title="Cadastro"
    >
      <SignupForm />
    </AuthShell>
  );
}
