"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  archiveAssetAction,
  type ArchiveAssetActionState,
} from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: ArchiveAssetActionState = {};

function ArchiveButton({ floating }: { floating: boolean }) {
  const { pending } = useFormStatus();

  if (floating) {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label="Remover imagem da galeria"
        title="Remover imagem"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent p-0 text-white/90 outline-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] transition-colors hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <Button
      type="submit"
      variant="destructive"
      size="icon-sm"
      disabled={pending}
      aria-label="Remover imagem da galeria"
      title="Remover imagem"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </Button>
  );
}

export function ArchiveAssetForm({
  assetId,
  floating = false,
}: {
  assetId: string;
  floating?: boolean;
}) {
  const [state, action] = useActionState(archiveAssetAction, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Remover esta imagem da galeria?")) {
          event.preventDefault();
        }
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="assetId" value={assetId} />
      <ArchiveButton floating={floating} />
      {state.message && !floating ? (
        <p
          className={cn(
            "text-xs",
            state.status === "error" ? "text-destructive" : "text-emerald-600",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
