import { redirectAuthenticatedUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    reset?: string;
    message?: string;
  }>;
};

function getStatusMessage(params: { reset?: string; message?: string }) {
  if (params.reset === "success") {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      text: "Senha atualizada com sucesso. Entre com a nova credencial.",
    };
  }

  if (params.message === "invalid-link") {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-800",
      text: "O link informado expirou ou não é mais válido. Solicite um novo envio.",
    };
  }

  if (params.message === "signup-complete") {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      text: "Cadastro concluído com sucesso. Se sua conta exigir confirmação de e-mail, valide sua caixa de entrada antes de entrar.",
    };
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectAuthenticatedUser("client");
  const params = await searchParams;
  const statusMessage = getStatusMessage(params);

  return (
    <AuthShell
      asideDescription="Acesse sua conta para cadastrar imagens, acompanhar ocorrências e revisar evidências."
      asideTitle="Acesso da conta"
      description="Entre com a conta vinculada à sua organização."
      eyebrow="Acesso"
      title="Entrar"
    >
      {statusMessage ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${statusMessage.className}`}>
          {statusMessage.text}
        </div>
      ) : null}
      <LoginForm
        panel="client"
        registerHref="/auth/register"
        forgotPasswordHref="/auth/forgot-password"
      />
    </AuthShell>
  );
}
