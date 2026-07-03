"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerCustomerAction } from "@/app/actions/auth";
import {
  formatRegistrationDocument,
  formatRegistrationPhone,
} from "@/lib/customer-onboarding";
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

export function SignupForm({
  preferredPlanCode,
}: {
  preferredPlanCode?: "basic" | "professional" | null;
}) {
  const [state, formAction, pending] = useActionState(
    registerCustomerAction,
    initialState,
  );
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");

  function handleInvalidMessage(
    event: React.FormEvent<HTMLInputElement>,
    message: string,
  ) {
    event.currentTarget.setCustomValidity(message);
  }

  function clearInvalidMessage(event: React.FormEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
  }

  return (
    <form action={formAction} className="flex flex-col">
      <input
        name="preferredPlanCode"
        type="hidden"
        value={preferredPlanCode ?? ""}
      />
      <FieldGroup className="gap-2">
        <Field>
          <FieldLabel htmlFor="fullName">Nome</FieldLabel>
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
          <FieldLabel htmlFor="phone">Celular</FieldLabel>
          <Input
            autoComplete="tel"
            className="bg-background"
            id="phone"
            name="phone"
            inputMode="tel"
            maxLength={19}
            onChange={(event) =>
              setPhone(formatRegistrationPhone(event.target.value))
            }
            onInput={clearInvalidMessage}
            onInvalid={(event) =>
              handleInvalidMessage(
                event,
                "Informe um celular valido no formato (11) 99999-9999.",
              )
            }
            pattern="^(\+55\s)?\(\d{2}\)\s\d{4,5}-\d{4}$"
            placeholder="(11) 99999-9999"
            required
            type="tel"
            value={phone}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="document">CPF/CNPJ</FieldLabel>
          <Input
            className="bg-background"
            id="document"
            inputMode="numeric"
            maxLength={18}
            name="document"
            onChange={(event) =>
              setDocument(formatRegistrationDocument(event.target.value))
            }
            onInput={clearInvalidMessage}
            onInvalid={(event) =>
              handleInvalidMessage(
                event,
                "Informe um CPF ou CNPJ valido.",
              )
            }
            pattern="(^\d{3}\.\d{3}\.\d{3}-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$)"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            required
            type="text"
            value={document}
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
          <FieldError
            className={
              state.status === "success" ? "text-emerald-600" : undefined
            }
          >
            {state.message}
          </FieldError>
        ) : null}

        <Button disabled={pending} size="lg" type="submit">
          {pending ? "Criando conta..." : "Criar conta"}
        </Button>
      </FieldGroup>

      <p className="py-4 text-sm text-muted-foreground flex justify-center">
        Já tem conta?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/auth/login"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
