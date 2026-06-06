"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Pencil, X } from "lucide-react";
import {
  renameAssetAction,
  type RenameActionState,
} from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: RenameActionState = {};

function RenameButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="icon-sm"
      disabled={pending}
      aria-label="Salvar nome da imagem"
      title="Salvar nome"
    >
      <Check className="size-4" aria-hidden="true" />
    </Button>
  );
}

export function RenameAssetTitleForm({
  assetId,
  currentTitle,
  compact = false,
}: {
  assetId: string;
  currentTitle: string;
  compact?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action] = useActionState(
    async (previousState: RenameActionState, formData: FormData) => {
      const result = await renameAssetAction(previousState, formData);

      if (result.status === "success") {
        setIsEditing(false);
      }

      return result;
    },
    initialState,
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!isEditing) {
    return (
      <div className={cn("min-w-0", compact ? "w-full" : "max-w-xl")}>
        <div className="flex min-w-0 items-center gap-1.5">
          <h2
            className={cn(
              "min-w-0 truncate font-semibold tracking-tight text-foreground",
              compact ? "text-sm" : "text-base",
            )}
            title={currentTitle}
          >
            {currentTitle}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsEditing(true)}
            aria-label="Editar nome da imagem"
            title="Editar nome"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        {state.message && state.status === "error" ? (
          <FieldError className="mt-1 text-xs">{state.message}</FieldError>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={action}
      className={cn(
        "flex min-w-0 flex-col gap-2",
        compact ? "w-full" : "mt-5 gap-3 lg:max-w-xl",
      )}
    >
      <input type="hidden" name="assetId" value={assetId} />
      <label
        className={cn(
          "font-medium uppercase text-muted-foreground",
          compact ? "sr-only" : "text-xs tracking-[0.2em]",
        )}
      >
        Nome na galeria
      </label>
      <div className={cn("flex gap-2", compact ? "flex-row" : "flex-col sm:flex-row")}>
        <Input
          ref={inputRef}
          name="title"
          defaultValue={currentTitle}
          maxLength={120}
          aria-label="Nome da imagem na galeria"
          className={compact ? "h-8 text-sm font-medium" : undefined}
        />
        <RenameButton />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsEditing(false)}
          aria-label="Cancelar edicao do nome"
          title="Cancelar"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {state.message ? (
        state.status === "success" ? (
          <p className={cn("text-emerald-600", compact ? "text-xs" : "text-sm")}>
            {state.message}
          </p>
        ) : (
          <FieldError className={compact ? "text-xs" : undefined}>
            {state.message}
          </FieldError>
        )
      ) : null}
    </form>
  );
}
