import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      asideDescription="Recupere o acesso com um link seguro enviado para o e-mail vinculado à conta."
      asideTitle="Recuperar acesso"
      description="Informe seu e-mail para receber o link de redefinição de senha."
      eyebrow="Acesso"
      title="Recuperar senha"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
