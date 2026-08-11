"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { updateAdminPlatformGeneralAction } from "@/app/actions/admin-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminPlatformGeneralSettings } from "@/lib/dal/admin-platform";

type AdminPlatformGeneralFormProps = {
  settings: AdminPlatformGeneralSettings;
};

type GeneralFormValues = {
  about: string;
  addressComplement: string;
  addressLine: string;
  addressNumber: string;
  city: string;
  cnpj: string;
  district: string;
  institutionalEmail: string;
  institutionalPhone: string;
  legalName: string;
  legalRepresentativeDocument: string;
  legalRepresentativeEmail: string;
  legalRepresentativeName: string;
  legalRepresentativePhone: string;
  legalRepresentativeRole: string;
  postalCode: string;
  state: string;
  tradeName: string;
};

type FieldName = Exclude<keyof GeneralFormValues, "about">;

type InputField = {
  autoComplete?: string;
  id: string;
  inputMode?: "email" | "numeric" | "tel" | "text";
  label: string;
  name: FieldName;
  placeholder?: string;
  type?: "email" | "tel" | "text";
};

const institutionalFields: InputField[] = [
  {
    id: "platform-trade-name",
    label: "Nome fantasia",
    name: "tradeName",
    placeholder: "Direito Na Lente",
  },
  {
    id: "platform-legal-name",
    label: "Razao social",
    name: "legalName",
    placeholder: "DNL Tecnologia Juridica LTDA",
  },
  {
    id: "platform-cnpj",
    inputMode: "numeric",
    label: "CNPJ",
    name: "cnpj",
    placeholder: "00.000.000/0000-00",
  },
  {
    autoComplete: "email",
    id: "platform-institutional-email",
    inputMode: "email",
    label: "E-mail institucional",
    name: "institutionalEmail",
    placeholder: "juridico@direitonalente.com.br",
    type: "email",
  },
  {
    autoComplete: "tel",
    id: "platform-institutional-phone",
    inputMode: "tel",
    label: "Telefone/celular institucional",
    name: "institutionalPhone",
    placeholder: "(11) 99999-9999",
    type: "tel",
  },
];

const addressFields: InputField[] = [
  {
    autoComplete: "postal-code",
    id: "platform-postal-code",
    inputMode: "numeric",
    label: "CEP",
    name: "postalCode",
    placeholder: "00000-000",
  },
  {
    autoComplete: "address-line1",
    id: "platform-address-line",
    label: "Endereco",
    name: "addressLine",
    placeholder: "Rua, avenida ou travessa",
  },
  {
    autoComplete: "address-line2",
    id: "platform-address-number",
    label: "Numero",
    name: "addressNumber",
    placeholder: "1000",
  },
  {
    id: "platform-address-complement",
    label: "Complemento",
    name: "addressComplement",
    placeholder: "Sala, andar ou conjunto",
  },
  {
    id: "platform-district",
    label: "Bairro",
    name: "district",
    placeholder: "Bela Vista",
  },
  {
    autoComplete: "address-level2",
    id: "platform-city",
    label: "Cidade",
    name: "city",
    placeholder: "Sao Paulo",
  },
  {
    autoComplete: "address-level1",
    id: "platform-state",
    label: "UF",
    name: "state",
    placeholder: "SP",
  },
];

const representativeFields: InputField[] = [
  {
    id: "platform-legal-representative-name",
    label: "Nome",
    name: "legalRepresentativeName",
    placeholder: "Nome do representante",
  },
  {
    id: "platform-legal-representative-document",
    label: "Documento",
    name: "legalRepresentativeDocument",
    placeholder: "CPF ou documento",
  },
  {
    id: "platform-legal-representative-role",
    label: "Cargo/funcao",
    name: "legalRepresentativeRole",
    placeholder: "Administrador",
  },
  {
    autoComplete: "tel",
    id: "platform-legal-representative-phone",
    inputMode: "tel",
    label: "Celular",
    name: "legalRepresentativePhone",
    placeholder: "(11) 99999-9999",
    type: "tel",
  },
  {
    autoComplete: "email",
    id: "platform-legal-representative-email",
    inputMode: "email",
    label: "E-mail",
    name: "legalRepresentativeEmail",
    placeholder: "representante@direitonalente.com.br",
    type: "email",
  },
];

function buildInitialValues(
  settings: AdminPlatformGeneralSettings,
): GeneralFormValues {
  return {
    about: settings.about ?? "",
    addressComplement: settings.addressComplement ?? "",
    addressLine: settings.addressLine ?? "",
    addressNumber: settings.addressNumber ?? "",
    city: settings.city ?? "",
    cnpj: settings.cnpj ?? "",
    district: settings.district ?? "",
    institutionalEmail: settings.institutionalEmail ?? "",
    institutionalPhone: settings.institutionalPhone ?? "",
    legalName: settings.legalName ?? "",
    legalRepresentativeDocument: settings.legalRepresentativeDocument ?? "",
    legalRepresentativeEmail: settings.legalRepresentativeEmail ?? "",
    legalRepresentativeName: settings.legalRepresentativeName ?? "",
    legalRepresentativePhone: settings.legalRepresentativePhone ?? "",
    legalRepresentativeRole: settings.legalRepresentativeRole ?? "",
    postalCode: settings.postalCode ?? "",
    state: settings.state ?? "",
    tradeName: settings.tradeName ?? "",
  };
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Ainda nao atualizado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminPlatformGeneralForm({
  settings,
}: AdminPlatformGeneralFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(() => buildInitialValues(settings));

  function updateField(name: keyof GeneralFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function renderInput(field: InputField) {
    return (
      <div className="space-y-2" key={field.name}>
        <Label htmlFor={field.id}>{field.label}</Label>
        <Input
          autoComplete={field.autoComplete}
          disabled={isPending}
          id={field.id}
          inputMode={field.inputMode}
          name={field.name}
          onChange={(event) => updateField(field.name, event.target.value)}
          placeholder={field.placeholder}
          type={field.type ?? "text"}
          value={values[field.name]}
        />
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateAdminPlatformGeneralAction(formData);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(
        result.message ??
          "Nao foi possivel atualizar as informacoes gerais.",
      );
    });
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Informacoes da plataforma</CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Mantenha os dados institucionais da DNL para uso em documentos,
            modelos juridicos e comunicacoes operacionais.
          </p>
        </div>
        <Badge variant="outline">
          Atualizado: {formatUpdatedAt(settings.updatedAt)}
        </Badge>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="grid gap-8" onSubmit={handleSubmit}>
          <section className="grid gap-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Dados institucionais
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Identificacao publica e juridica da DNL.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {institutionalFields.map(renderInput)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-about">Sobre</Label>
              <Textarea
                disabled={isPending}
                id="platform-about"
                name="about"
                onChange={(event) => updateField("about", event.target.value)}
                placeholder="Resumo institucional da DNL"
                rows={4}
                value={values.about}
              />
            </div>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">Endereco</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Endereco institucional usado em documentos e contatos formais.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {addressFields.map(renderInput)}
            </div>
          </section>

          <section className="grid gap-4 border-t border-border pt-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Representante legal
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dados do responsavel legal usado em documentos da plataforma.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {representativeFields.map(renderInput)}
            </div>
          </section>

          <div className="flex justify-end border-t border-border pt-6">
            <Button disabled={isPending} type="submit">
              <SaveIcon className="size-4" />
              {isPending ? "Salvando..." : "Salvar informacoes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
