import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  await redirectAuthenticatedUser("client");

  return (
    <AuthShell
      asideDescription="Acesse sua conta para cadastrar imagens, acompanhar ocorrencias e revisar evidencias."
      asideTitle="Acesso da conta"
      description="Entre com a conta vinculada a sua organizacao."
      eyebrow="Acesso"
      title="Entrar"
    >
      <LoginForm panel="client" registerHref="/auth/register" />
    </AuthShell>
  );
}
