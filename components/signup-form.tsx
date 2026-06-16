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
import { SignupOnboardingDialog } from "@/components/signup-onboarding-dialog";

const initialState: {
  message?: string;
  onboarding?: {
    email: string;
    fullName: string;
    organizationName: string;
    requiresEmailConfirmation: boolean;
  };
  status?: "error" | "success";
} = {};

type SignupFormProps = {
  initialOnboarding?: {
    email: string;
    fullName: string;
    organizationName: string;
    requiresEmailConfirmation: boolean;
  } | null;
};

export function SignupForm({ initialOnboarding = null }: SignupFormProps) {
  const [state, formAction, pending] = useActionState(
    registerCustomerAction,
    initialState,
  );
  const onboarding =
    state.status === "success" && state.onboarding
      ? state.onboarding
      : initialOnboarding;

  return (
    <>
      <form action={formAction} className="flex flex-col gap-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
            <Input
              autoComplete="name"
              className="bg-background"
              defaultValue={onboarding?.fullName}
              id="fullName"
              name="fullName"
              placeholder="Seu nome"
              required
              type="text"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="organizationName">Nome da organização</FieldLabel>
            <Input
              className="bg-background"
              defaultValue={onboarding?.organizationName}
              id="organizationName"
              name="organizationName"
              placeholder="Ex.: Studio Silva"
              required
              type="text"
            />
            <FieldDescription>
              Esse nome ajuda a organizar sua conta e as pessoas que vão acessar junto com você.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              autoComplete="email"
              className="bg-background"
              defaultValue={onboarding?.email}
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

          <Field className="rounded-2xl border border-border bg-muted/20 p-4">
            <label
              className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
              htmlFor="acceptRegistrationTerms"
            >
              <input
                className="mt-1 size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                id="acceptRegistrationTerms"
                name="acceptRegistrationTerms"
                required
                type="checkbox"
              />
              <span>
                Eu li e aceito os{" "}
                <Link
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  href="/termos-de-uso"
                  target="_blank"
                >
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  href="/politica-de-privacidade"
                  target="_blank"
                >
                  Política de Privacidade
                </Link>{" "}
                da DNL para concluir meu cadastro.
              </span>
            </label>
          </Field>

          {state?.message ? (
            <FieldError className={state.status === "success" ? "text-emerald-600" : undefined}>
              {state.message}
            </FieldError>
          ) : null}

          <Button disabled={pending} size="lg" type="submit">
            {pending ? "Criando conta..." : "Criar conta"}
          </Button>
        </FieldGroup>

        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="/auth/login"
          >
            Entrar
          </Link>
        </p>
      </form>

      <SignupOnboardingDialog onboarding={onboarding} />
    </>
  );
}
