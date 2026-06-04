'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <main className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            DNL Platform
          </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold">
          Ocorreu um erro inesperado
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tente recarregar esta parte da aplicacao.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Referencia: {error.digest}
          </p>
        ) : null}
          <button
            className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => unstable_retry()}
            type="button"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
