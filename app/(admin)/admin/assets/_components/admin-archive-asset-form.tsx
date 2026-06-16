"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2Icon } from "lucide-react";
import {
  archiveAdminAssetAction,
  type AdminArchiveAssetActionState,
} from "@/app/actions/admin-assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: AdminArchiveAssetActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      disabled={pending}
      className="w-full sm:w-auto"
    >
      <Trash2Icon className="size-4" />
      Excluir
    </Button>
  );
}

export function AdminArchiveAssetForm({ assetId }: { assetId: string }) {
  const [state, action] = useActionState(archiveAdminAssetAction, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Excluir esta imagem da galeria administrativa?")) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input type="hidden" name="assetId" value={assetId} />
      <SubmitButton />
      {state.message ? (
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
