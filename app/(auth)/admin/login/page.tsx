import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function AdminLoginPage() {
  await redirectAuthenticatedUser("admin");

  return (
    <AuthShell
      asideDescription="Use esta entrada para operacao interna, suporte, auditoria e gerenciamento global do produto."
      asideTitle="Painel administrativo"
      description="Entre com uma conta interna com permissao administrativa."
      eyebrow="Administracao"
      title="Entrar na administracao"
    >
      <LoginForm panel="admin" />
    </AuthShell>
  );
}
