"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/actions/auth";

type LoginFormProps = {
  panel: "client" | "admin";
  registerHref?: string;
};

const initialState: {
  message?: string;
  status?: "error" | "success";
} = {};

export function LoginForm({ panel, registerHref }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input name="panel" type="hidden" value={panel} />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${panel}-email`}>E-mail</FieldLabel>
          <Input
            autoComplete="email"
            className="bg-background"
            id={`${panel}-email`}
            name="email"
            placeholder="voce@empresa.com"
            required
            type="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${panel}-password`}>Senha</FieldLabel>
          <Input
            autoComplete={
              panel === "admin" ? "current-password" : "current-password"
            }
            className="bg-background"
            id={`${panel}-password`}
            name="password"
            required
            type="password"
          />
          <FieldDescription>
            Use o mesmo e-mail cadastrado para acessar sua conta.
          </FieldDescription>
        </Field>

        {state?.message ? <FieldError>{state.message}</FieldError> : null}

        <Button disabled={pending} size="lg" type="submit">
          {pending ? "Entrando..." : panel === "admin" ? "Entrar na administracao" : "Entrar"}
        </Button>
      </FieldGroup>

      {registerHref ? (
        <p className="text-sm text-muted-foreground">
          Ainda nao tem conta?{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={registerHref}>
            Criar cadastro
          </Link>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          O acesso administrativo e liberado apenas pela equipe interna.
        </p>
      )}
    </form>
  );
}
