"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
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

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="forgot-email">E-mail</FieldLabel>
          <Input
            autoComplete="email"
            className="bg-background"
            id="forgot-email"
            name="email"
            placeholder="voce@empresa.com"
            required
            type="email"
          />
          <FieldDescription>
            Vamos enviar um link seguro para você redefinir a senha da conta.
          </FieldDescription>
        </Field>

        {state?.message ? (
          <FieldError
            className={state.status === "success" ? "text-emerald-600" : undefined}
          >
            {state.message}
          </FieldError>
        ) : null}

        <Button disabled={pending} size="lg" type="submit">
          {pending ? "Enviando link..." : "Enviar link de recuperação"}
        </Button>
      </FieldGroup>

      <p className="text-sm text-muted-foreground">
        Lembrou da senha?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/auth/login"
        >
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
