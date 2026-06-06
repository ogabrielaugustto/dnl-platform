"use client";

import { useActionState } from "react";
import { renameAssetAction, type RenameActionState } from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: RenameActionState = {};

export function RenameAssetTitleForm({
  assetId,
  currentTitle,
}: {
  assetId: string;
  currentTitle: string;
}) {
  const [state, action] = useActionState(renameAssetAction, initialState);

  return (
    <form action={action} className="mt-5 flex flex-col gap-3 lg:max-w-xl">
      <input type="hidden" name="assetId" value={assetId} />
      <label className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Nome na galeria
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="title"
          defaultValue={currentTitle}
          maxLength={120}
          aria-label="Nome da imagem na galeria"
        />
        <Button type="submit" variant="outline">
          Renomear imagem
        </Button>
      </div>
      {state.message ? (
        state.status === "success" ? (
          <p className="text-sm text-emerald-600">{state.message}</p>
        ) : (
          <FieldError>{state.message}</FieldError>
        )
      ) : null}
    </form>
  );
}
