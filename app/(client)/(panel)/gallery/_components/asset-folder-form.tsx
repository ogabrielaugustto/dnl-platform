"use client";

import { useActionState } from "react";
import { createAssetFolderAction, type FolderActionState } from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: FolderActionState = {};

export function AssetFolderForm() {
  const [state, action] = useActionState(createAssetFolderAction, initialState);

  return (
    <form action={action} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome da pasta</FieldLabel>
          <FieldContent>
            <Input
              id="name"
              name="name"
              placeholder="Ex.: Fotografias institucionais"
              required
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Descricao</FieldLabel>
          <FieldContent>
            <Input
              id="description"
              name="description"
              placeholder="Opcional. Ajuda a equipe a entender o contexto da pasta."
            />
            <FieldDescription>
              Use pastas para separar campanhas, colecoes, clientes internos ou frentes de monitoramento.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : (
        <FieldError>{state.message}</FieldError>
      )}

      <Button type="submit" variant="outline">
        Criar pasta
      </Button>
    </form>
  );
}
