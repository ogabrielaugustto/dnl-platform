"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus2Icon } from "lucide-react";
import { inviteAdminUserAction, type AdminManagementActionState } from "@/app/actions/admin-management";
import { Button } from "@/components/ui/button";
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

type InviteUserDialogProps = {
  organizations: Array<{
    id: string;
    name: string;
  }>;
};

export function InviteUserDialog({ organizations }: InviteUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accessType, setAccessType] = useState<"internal" | "client">("internal");
  const [organizationId, setOrganizationId] = useState("");
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<AdminManagementActionState>(initialState);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviteAdminUserAction(initialState, formData);
      setState(result);

      if (result.status === "success") {
        setAccessType("internal");
        setOrganizationId("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setState(initialState);
          setAccessType("internal");
          setOrganizationId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus2Icon className="size-4" />
          Convidar usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo acesso administrativo</DialogTitle>
          <DialogDescription>
            Convide um colaborador interno da DNL ou adicione um usuario de cliente com vinculacao direta a uma organizacao.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-5">
          <input name="accessType" type="hidden" value={accessType} />
          <input name="organizationId" type="hidden" value={organizationId} />

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

            <Field>
              <FieldLabel>Tipo de acesso</FieldLabel>
              <Select
                value={accessType}
                onValueChange={(value: "internal" | "client") => {
                  setAccessType(value);
                  if (value === "internal") {
                    setOrganizationId("");
                  }
                }}
              >
                <SelectTrigger>
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

            {accessType === "client" ? (
              <Field>
                <FieldLabel>Organizacao</FieldLabel>
                <Select
                  value={organizationId}
                  onValueChange={setOrganizationId}
                  required
                >
                  <SelectTrigger>
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
          </FieldGroup>

          {state.message ? (
            <FieldError className={state.status === "success" ? "text-emerald-600" : undefined}>
              {state.message}
            </FieldError>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Enviando..." : "Salvar convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
