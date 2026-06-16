"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: {
  message?: string;
  status?: "error" | "success";
} = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
          <Input
            autoComplete="new-password"
            className="bg-background"
            id="new-password"
            name="password"
            required
            type="password"
          />
          <FieldDescription>
            Use pelo menos 8 caracteres para manter o acesso protegido.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-new-password">Confirmar nova senha</FieldLabel>
          <Input
            autoComplete="new-password"
            className="bg-background"
            id="confirm-new-password"
            name="confirmPassword"
            required
            type="password"
          />
        </Field>

        {state?.message ? <FieldError>{state.message}</FieldError> : null}

        <Button disabled={pending} size="lg" type="submit">
          {pending ? "Atualizando senha..." : "Salvar nova senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
