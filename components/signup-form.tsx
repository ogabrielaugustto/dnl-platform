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
import { registerCustomerAction } from "@/app/actions/auth";

const initialState: {
  message?: string;
  status?: "error" | "success";
} = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    registerCustomerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
          <Input
            autoComplete="name"
            className="bg-background"
            id="fullName"
            name="fullName"
            placeholder="Seu nome"
            required
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="organizationName">Nome da organizacao</FieldLabel>
          <Input
            className="bg-background"
            id="organizationName"
            name="organizationName"
            placeholder="Ex.: Studio Silva"
            required
            type="text"
          />
          <FieldDescription>
            Este sera o primeiro workspace do cliente dentro da plataforma.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            autoComplete="email"
            className="bg-background"
            id="email"
            name="email"
            placeholder="voce@empresa.com"
            required
            type="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            autoComplete="new-password"
            className="bg-background"
            id="password"
            name="password"
            required
            type="password"
          />
          <FieldDescription>
            Use pelo menos 8 caracteres para a senha da conta.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
          <Input
            autoComplete="new-password"
            className="bg-background"
            id="confirmPassword"
            name="confirmPassword"
            required
            type="password"
          />
        </Field>

        {state?.message ? (
          <FieldError className={state.status === "success" ? "text-emerald-600" : undefined}>
            {state.message}
          </FieldError>
        ) : null}

        <Button disabled={pending} size="lg" type="submit">
          {pending ? "Criando conta..." : "Criar conta do cliente"}
        </Button>
      </FieldGroup>

      <p className="text-sm text-muted-foreground">
        Ja tem conta?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/auth/login"
        >
          Entrar no painel do cliente
        </Link>
      </p>
    </form>
  );
}
