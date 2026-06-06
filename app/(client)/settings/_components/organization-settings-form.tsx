"use client";

import { useActionState } from "react";
import { updateOrganizationSettingsAction, type SettingsActionState } from "@/app/actions/settings";
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

type OrganizationSettingsFormProps = {
  defaultValues: {
    billingEmail: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    document: string | null;
    instagramHandle: string | null;
    name: string;
    websiteUrl: string | null;
  };
};

function toErrors(messages?: string[]) {
  return messages?.map((message) => ({ message }));
}

export function OrganizationSettingsForm({
  defaultValues,
}: OrganizationSettingsFormProps) {
  const [state, action, pending] = useActionState(
    updateOrganizationSettingsAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome da organizacao</FieldLabel>
          <FieldContent>
            <Input defaultValue={defaultValues.name} id="name" name="name" required />
            <FieldDescription>
              Este nome identifica o workspace em acessos, upload de imagens e revisao de ocorrencias.
            </FieldDescription>
            <FieldError errors={toErrors(state.fieldErrors?.name)} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="document">Documento</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.document ?? ""}
              id="document"
              name="document"
              placeholder="CNPJ ou CPF responsavel"
            />
            <FieldError errors={toErrors(state.fieldErrors?.document)} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="billingEmail">E-mail financeiro</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.billingEmail ?? ""}
              id="billingEmail"
              name="billingEmail"
              placeholder="financeiro@empresa.com"
              type="email"
            />
            <FieldError errors={toErrors(state.fieldErrors?.billingEmail)} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="contactEmail">E-mail principal</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.contactEmail ?? ""}
              id="contactEmail"
              name="contactEmail"
              placeholder="contato@empresa.com"
              type="email"
            />
            <FieldDescription>
              Use um contato operacional para alinhamentos sobre equipe, onboarding e suporte.
            </FieldDescription>
            <FieldError errors={toErrors(state.fieldErrors?.contactEmail)} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="contactPhone">Telefone</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.contactPhone ?? ""}
              id="contactPhone"
              name="contactPhone"
              placeholder="(11) 99999-9999"
              type="tel"
            />
            <FieldError errors={toErrors(state.fieldErrors?.contactPhone)} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="websiteUrl">Site oficial</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.websiteUrl ?? ""}
              id="websiteUrl"
              name="websiteUrl"
              placeholder="https://www.suaempresa.com"
              type="url"
            />
            <FieldDescription>
              Ter o site oficial ajuda a contextualizar a marca e reduzir ambiguidades operacionais.
            </FieldDescription>
            <FieldError errors={toErrors(state.fieldErrors?.websiteUrl)} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="instagramHandle">Instagram</FieldLabel>
          <FieldContent>
            <Input
              defaultValue={defaultValues.instagramHandle ?? ""}
              id="instagramHandle"
              name="instagramHandle"
              placeholder="@suaempresa"
            />
            <FieldDescription>
              Opcional, mas util para identificar a presenca oficial da marca em revisoes futuras.
            </FieldDescription>
            <FieldError errors={toErrors(state.fieldErrors?.instagramHandle)} />
          </FieldContent>
        </Field>
      </FieldGroup>

      {state.message ? (
        <FieldError className={state.status === "success" ? "text-emerald-600" : undefined}>
          {state.message}
        </FieldError>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Salvando..." : "Salvar organizacao"}
      </Button>
    </form>
  );
}
