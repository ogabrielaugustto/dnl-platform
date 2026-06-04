import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  await redirectAuthenticatedUser("client");

  return (
    <AuthShell
      asideDescription="Acesse o painel do cliente para cadastrar assets, acompanhar deteccoes e revisar evidencias."
      asideTitle="Painel do cliente"
      description="Entre com a conta vinculada a uma organizacao cliente."
      eyebrow="Cliente"
      title="Entrar"
    >
      <LoginForm panel="client" registerHref="/auth/register" />
    </AuthShell>
  );
}
