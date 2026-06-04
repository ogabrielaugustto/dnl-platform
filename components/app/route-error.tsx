'use client'

type RouteErrorProps = {
  area: string
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export function RouteError({ area, error, unstable_retry }: RouteErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {area}
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold">
          Algo saiu do esperado
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Recarregue este trecho da aplicacao para tentar novamente.
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
      </div>
    </div>
  )
}
