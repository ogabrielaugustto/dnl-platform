import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          DNL Platform
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold">
          Pagina nao encontrada
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O caminho acessado nao existe ou ainda nao foi implementado.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          href="/"
        >
          Voltar para a landing page
        </Link>
      </div>
    </main>
  );
}
