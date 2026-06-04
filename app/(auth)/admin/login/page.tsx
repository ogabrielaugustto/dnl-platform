import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function AdminLoginPage() {
  await redirectAuthenticatedUser("admin");

  return (
    <AuthShell
      asideDescription="Use esta entrada para operacao interna, suporte, auditoria e gerenciamento global do produto."
      asideTitle="Painel administrativo"
      description="Entre com uma conta marcada como admin ou super_admin."
      eyebrow="Admin"
      title="Entrar no admin"
    >
      <LoginForm panel="admin" />
    </AuthShell>
  );
}
