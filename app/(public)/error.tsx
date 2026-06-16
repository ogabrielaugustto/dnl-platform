"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.32em] text-primary">
          Página institucional
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
          Tivemos um problema ao carregar esta página.
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Você pode tentar novamente agora ou voltar para a página inicial.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={reset}
          type="button"
        >
          Tentar novamente
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Voltar para a home</Link>
        </Button>
      </div>
    </div>
  );
}
