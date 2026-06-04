import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export default async function RegisterPage() {
  await redirectAuthenticatedUser("client");

  return (
    <AuthShell
      asideDescription="O cadastro externo cria apenas contas do cliente. O admin entra por uma rota separada e nao possui onboarding publico."
      asideTitle="Criar conta do cliente"
      description="Crie a conta inicial do cliente e a primeira organizacao monitorada."
      eyebrow="Cliente"
      title="Cadastro"
    >
      <SignupForm />
    </AuthShell>
  );
}
