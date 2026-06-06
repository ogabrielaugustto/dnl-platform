"use client";

import { useActionState } from "react";
import { renameAssetFolderAction, type RenameActionState } from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: RenameActionState = {};

export function RenameFolderForm({
  folderId,
  currentName,
}: {
  folderId: string;
  currentName: string;
}) {
  const [state, action] = useActionState(renameAssetFolderAction, initialState);

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <input type="hidden" name="folderId" value={folderId} />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Pasta ativa
        </p>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight">
          Renomear pasta
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajuste o nome da pasta atual para reorganizar sua galeria sem mexer nas
          analises e evidencias.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="name"
          defaultValue={currentName}
          maxLength={120}
          aria-label="Novo nome da pasta"
        />
        <Button type="submit" variant="outline">
          Renomear pasta
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
