import Link from "next/link";
import { createClient } from "@/lib/server";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthShell
      asideDescription="Conclua a redefinição com uma nova senha forte e volte a acessar sua conta normalmente."
      asideTitle="Nova senha"
      description="Defina a nova senha para continuar acessando a plataforma."
      eyebrow="Recuperação"
      title="Redefinir senha"
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4 rounded-3xl border border-border bg-background/70 p-6">
          <p className="text-sm leading-6 text-muted-foreground">
            O link de recuperação precisa ser aberto a partir do e-mail enviado para
            sua conta. Se ele expirou, solicite um novo envio.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/forgot-password">Solicitar novo link</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
