"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus2Icon } from "lucide-react";
import {
  inviteAdminUserAction,
  type AdminManagementActionState,
} from "@/app/actions/admin-management";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: AdminManagementActionState = {};

type AccessType = "internal" | "client";
type InviteMode = "all" | "internal" | "client";

type InviteUserDialogProps = {
  mode?: InviteMode;
  organizations: Array<{
    id: string;
    name: string;
  }>;
};

function getDialogCopy(mode: InviteMode) {
  if (mode === "internal") {
    return {
      actionLabel: "Adicionar",
      buttonLabel: "Adicionar usuario",
      description:
        "Cadastre um usuario interno da DNL. Voce pode enviar convite por e-mail ou criar a conta e receber a senha temporaria para repasse manual.",
      title: "Adicionar usuario interno",
    };
  }

  if (mode === "client") {
    return {
      actionLabel: "Adicionar",
      buttonLabel: "Adicionar cliente",
      description:
        "Adicione um novo acesso de cliente com vinculacao direta a uma organizacao.",
      title: "Adicionar acesso de cliente",
    };
  }

  return {
    actionLabel: "Salvar convite",
    buttonLabel: "Convidar usuario",
    description:
      "Convide um colaborador interno da DNL ou adicione um usuario de cliente com vinculacao direta a uma organizacao.",
    title: "Novo acesso administrativo",
  };
}

export function InviteUserDialog({
  mode = "all",
  organizations,
}: InviteUserDialogProps) {
  const router = useRouter();
  const copy = getDialogCopy(mode);
  const [open, setOpen] = useState(false);
  const [accessType, setAccessType] = useState<AccessType>(
    mode === "client" ? "client" : "internal",
  );
  const [organizationId, setOrganizationId] = useState("");
  const [pending, startTransition] = useTransition();
  const [sendInvite, setSendInvite] = useState(true);
  const [state, setState] = useState<AdminManagementActionState>(initialState);

  const isInternalFlow = accessType === "internal";
  const showAccessTypeSelect = mode === "all";
  const showOrganizationSelect = accessType === "client";
  const showInviteToggle = mode === "internal" && isInternalFlow;

  function resetDialogState(nextMode: InviteMode = mode) {
    setState(initialState);
    setSendInvite(true);
    setAccessType(nextMode === "client" ? "client" : "internal");
    setOrganizationId("");
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviteAdminUserAction(initialState, formData);
      setState(result);

      if (result.status !== "success") {
        return;
      }

      router.refresh();

      if (result.credentials) {
        return;
      }

      resetDialogState();
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetDialogState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus2Icon className="size-4" />
          {copy.buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-5">
          <input name="accessType" type="hidden" value={accessType} />
          <input name="organizationId" type="hidden" value={organizationId} />
          <input name="sendInvite" type="hidden" value={String(sendInvite)} />

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-full-name">Nome completo</FieldLabel>
              <Input
                id="invite-full-name"
                name="fullName"
                placeholder="Ex.: Maria Fernandes"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="invite-email">E-mail</FieldLabel>
              <Input
                id="invite-email"
                name="email"
                placeholder="maria@dnl.com.br"
                required
                type="email"
              />
            </Field>

            {showAccessTypeSelect ? (
              <Field>
                <FieldLabel>Tipo de acesso</FieldLabel>
                <Select
                  value={accessType}
                  onValueChange={(value: AccessType) => {
                    setAccessType(value);
                    setSendInvite(true);
                    if (value === "internal") {
                      setOrganizationId("");
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Colaborador interno DNL</SelectItem>
                    <SelectItem value="client">Usuario de cliente</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Colaboradores internos recebem acesso ao painel admin. Usuarios de cliente entram com papel de membro na organizacao.
                </FieldDescription>
              </Field>
            ) : null}

            {showOrganizationSelect ? (
              <Field>
                <FieldLabel>Organizacao</FieldLabel>
                <Select
                  required
                  value={organizationId}
                  onValueChange={setOrganizationId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a organizacao" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Esse usuario sera vinculado como membro ativo da organizacao selecionada.
                </FieldDescription>
              </Field>
            ) : null}

            {showInviteToggle ? (
              <Field orientation="horizontal">
                <Checkbox
                  checked={sendInvite}
                  id="send-invite"
                  onCheckedChange={(checked) => setSendInvite(checked === true)}
                />
                <div className="space-y-1">
                  <FieldTitle>Enviar convite</FieldTitle>
                  <FieldDescription>
                    Marcado por padrao. Se desmarcar, a conta e criada sem disparar e-mail e o modal retorna o e-mail e a senha temporaria para repasse manual.
                  </FieldDescription>
                </div>
              </Field>
            ) : null}
          </FieldGroup>

          {state.credentials ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
              <p className="font-medium">Credenciais geradas</p>
              <p className="mt-2">E-mail: {state.credentials.email}</p>
              <p className="mt-1">Senha temporaria: {state.credentials.password}</p>
              <p className="mt-2 text-emerald-800/90">
                Compartilhe esses dados com o usuario e oriente a troca de senha no primeiro acesso.
              </p>
            </div>
          ) : null}

          {state.message ? (
            <FieldError className={state.status === "success" ? "text-emerald-600" : undefined}>
              {state.message}
            </FieldError>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Salvando..." : copy.actionLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
