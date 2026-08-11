import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function AdminLoginPage() {
  await redirectAuthenticatedUser("admin");

  return (
    <AuthShell
      asideDescription="Use esta entrada para operação interna, suporte, auditoria e gerenciamento global do produto."
      asideTitle="Painel administrativo"
      description="Entre com uma conta interna com permissão administrativa."
      eyebrow="Administração"
      title="Entrar na administração"
    >
      <LoginForm panel="admin" />
    </AuthShell>
  );
}
