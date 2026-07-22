"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ValidateNotificationError({
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
          Validar notificação
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta validação.
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Tente novamente ou fale com a Direito na Lente pelos canais oficiais.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset} type="button">
          Tentar novamente
        </Button>
        <Button asChild variant="outline">
          <Link href="/contato">Falar com a DNL</Link>
        </Button>
      </div>
    </div>
  );
}
