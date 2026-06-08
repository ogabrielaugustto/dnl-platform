"use client";

import { Button } from "@/components/ui/button";

export default function AdminSourcesError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section className="flex w-full flex-1 flex-col gap-4 px-6 py-8 md:px-8">
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Nao foi possivel carregar as fontes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente para buscar a lista atual de dominios monitorados.
        </p>
        <Button type="button" className="mt-4" onClick={() => unstable_retry()}>
          Tentar novamente
        </Button>
      </div>
    </section>
  );
}
