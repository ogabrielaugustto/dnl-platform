"use client";

import { useActionState } from "react";
import { submitContactFormAction } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState: {
  message?: string;
  status?: "error" | "success";
} = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contact-name">Nome</FieldLabel>
          <Input
            id="contact-name"
            name="name"
            placeholder="Seu nome"
            required
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-email">E-mail</FieldLabel>
          <Input
            autoComplete="email"
            id="contact-email"
            name="email"
            placeholder="voce@empresa.com"
            required
            type="email"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-organization">Organização</FieldLabel>
          <Input
            id="contact-organization"
            name="organization"
            placeholder="Nome da sua empresa, escritório ou estúdio"
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="contact-message">Mensagem</FieldLabel>
          <Textarea
            className="min-h-36"
            id="contact-message"
            name="message"
            placeholder="Conte rapidamente o que você quer monitorar ou estruturar com a plataforma."
            required
          />
          <FieldDescription>
            A equipe recebe a mensagem por e-mail e responde usando o endereço informado acima.
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
          {pending ? "Enviando..." : "Enviar mensagem"}
        </Button>
      </FieldGroup>
    </form>
  );
}
