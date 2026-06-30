"use client";

import { useActionState } from "react";
import { updateProfileSettingsAction, type SettingsActionState } from "@/app/actions/settings";
import { ClientSignatureField } from "@/components/signature/client-signature-field";
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

const initialState: SettingsActionState = {};

type ProfileSettingsFormProps = {
  defaultValues: {
    avatarUrl: string | null;
    email: string | null;
    fullName: string | null;
    signature:
      | {
          payloadJson: string;
          signedName: string;
          updatedAt: string;
        }
      | null;
  };
};

export function ProfileSettingsForm({ defaultValues }: ProfileSettingsFormProps) {
  const [state, action, pending] = useActionState(updateProfileSettingsAction, initialState);

  return (
    <form action={action} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Nome completo</FieldLabel>
          <FieldContent>
            <Input
              autoComplete="name"
              defaultValue={defaultValues.fullName ?? ""}
              id="fullName"
              name="fullName"
              placeholder="Seu nome"
              required
            />
            <FieldError errors={state.fieldErrors?.fullName?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.email ?? ""}
              disabled
              id="email"
              name="email"
              type="email"
            />
            <FieldDescription>
              O e-mail da conta e controlado pelo Supabase Auth e nao pode ser alterado aqui.
            </FieldDescription>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="avatarUrl">URL do avatar</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.avatarUrl ?? ""}
              id="avatarUrl"
              name="avatarUrl"
              placeholder="https://..."
              type="url"
            />
            <FieldDescription>
              Opcional. Use a imagem do seu time ou uma foto profissional para aparecer na navegacao.
            </FieldDescription>
            <FieldError errors={state.fieldErrors?.avatarUrl?.map((message) => ({ message }))} />
          </FieldContent>
        </Field>

        <ClientSignatureField
          defaultPayloadJson={defaultValues.signature?.payloadJson}
          defaultSignedName={defaultValues.signature?.signedName}
          description="Essa assinatura fica salva no seu perfil para reaproveitar depois em termos, contratos e PDFs gerados pela plataforma."
          suggestedSignedName={defaultValues.fullName}
          title="Assinatura salva"
        />
        <FieldError errors={state.fieldErrors?.signature?.map((message) => ({ message }))} />
      </FieldGroup>

      {state.message ? (
        <FieldError className={state.status === "success" ? "text-emerald-600" : undefined}>
          {state.message}
        </FieldError>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Salvando..." : "Salvar perfil"}
      </Button>
    </form>
  );
}
