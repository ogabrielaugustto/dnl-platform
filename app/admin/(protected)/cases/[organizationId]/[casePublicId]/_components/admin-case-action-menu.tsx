"use client";

import { useActionState, useState } from "react";
import {
  ChevronDownIcon,
  FileSignatureIcon,
  MailIcon,
  MessageSquareTextIcon,
  ScaleIcon,
} from "lucide-react";
import {
  initialAdminCaseSraActionState,
  requestAdminCaseSraAction,
} from "@/app/actions/admin-case-sra";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ADMIN_CASE_ACTION_LABELS,
  isAdminCaseActionEnabled,
  type AdminCaseActionKind,
} from "@/lib/admin-case-workflow";
import type { AdminCaseSraDefaults } from "@/lib/dal/admin-case-sra";

type AdminCaseActionContext = {
  organizationId: string;
  casePublicId: number;
  casePublicIdLabel: string;
  sraDefaults: AdminCaseSraDefaults;
};

type AdminCaseActionMenuProps = {
  context: AdminCaseActionContext;
};

const communicationActions: AdminCaseActionKind[] = [
  "first_communication",
  "documentation_notice",
  "c1",
  "c1p",
  "c2",
];
const internalActions: AdminCaseActionKind[] = ["follow_up", "call", "internal_note"];
const financialActions: AdminCaseActionKind[] = [
  "negotiation",
  "register_sra",
  "register_payment",
  "collections",
];
const closingActions: AdminCaseActionKind[] = ["legal", "close_resolved"];

function ActionMenuItem({
  action,
  onSelect,
}: {
  action: AdminCaseActionKind;
  onSelect: () => void;
}) {
  const enabled = isAdminCaseActionEnabled(action);

  return (
    <DropdownMenuItem
      disabled={!enabled}
      className="flex items-center justify-between gap-3"
      onSelect={(event) => {
        if (!enabled) {
          return;
        }
        event.preventDefault();
        onSelect();
      }}
    >
      <span>{ADMIN_CASE_ACTION_LABELS[action]}</span>
      {!enabled ? (
        <span className="text-xs font-normal text-muted-foreground">Em breve</span>
      ) : null}
    </DropdownMenuItem>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error?.length ? (
        <span className="text-xs text-destructive">{error.join(" ")}</span>
      ) : null}
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AdminCaseActionMenu({ context }: AdminCaseActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    requestAdminCaseSraAction,
    initialAdminCaseSraActionState,
  );
  const defaults = context.sraDefaults;
  const errors = state.fieldErrors;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            Executar ação
            <ChevronDownIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center gap-2">
            <MailIcon className="size-3.5" />
            Comunicação
          </DropdownMenuLabel>
          {communicationActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={() => setOpen(true)} />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <MessageSquareTextIcon className="size-3.5" />
            Tratativas
          </DropdownMenuLabel>
          {internalActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={() => setOpen(true)} />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <FileSignatureIcon className="size-3.5" />
            Negociação e documentos
          </DropdownMenuLabel>
          {financialActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={() => setOpen(true)} />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <ScaleIcon className="size-3.5" />
            Encaminhamento
          </DropdownMenuLabel>
          {closingActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={() => setOpen(true)} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
          <form action={formAction} className="grid gap-5">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Clicksign</Badge>
                <Badge variant="outline">2 a 4 signatários</Badge>
              </div>
              <DialogTitle>Gerar e enviar SRA</DialogTitle>
              <DialogDescription>
                Confira os dados do acordo do caso {context.casePublicIdLabel}. As
                testemunhas são opcionais.
              </DialogDescription>
            </DialogHeader>

            <input name="organizationId" type="hidden" value={context.organizationId} />
            <input name="casePublicId" type="hidden" value={context.casePublicId} />

            <FormSection title="Referências do acordo">
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Caso">
                  <Input readOnly value={defaults.caseId} />
                </FormField>
                <FormField label="Imagens">
                  <Input readOnly value={defaults.imageIds.join(", ")} />
                </FormField>
                <FormField label="Domínio" error={errors?.notifiedDomain}>
                  <Input
                    defaultValue={defaults.notifiedDomain}
                    name="notifiedDomain"
                    required
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Empresa notificada">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Razão social" error={errors?.notifiedLegalName}>
                  <Input
                    defaultValue={defaults.notifiedLegalName}
                    name="notifiedLegalName"
                    required
                  />
                </FormField>
                <FormField label="CNPJ" error={errors?.notifiedCnpj}>
                  <Input
                    defaultValue={defaults.notifiedCnpj}
                    name="notifiedCnpj"
                    required
                  />
                </FormField>
                <FormField label="Endereço completo" error={errors?.notifiedAddress}>
                  <Input
                    defaultValue={defaults.notifiedAddress}
                    name="notifiedAddress"
                    required
                  />
                </FormField>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Representante" error={errors?.notifiedSignerName}>
                  <Input
                    defaultValue={defaults.notifiedSignerName}
                    name="notifiedSignerName"
                    required
                  />
                </FormField>
                <FormField label="Cargo" error={errors?.notifiedSignerRole}>
                  <Input
                    defaultValue={defaults.notifiedSignerRole}
                    name="notifiedSignerRole"
                    required
                  />
                </FormField>
                <FormField label="CPF do representante" error={errors?.notifiedSignerCpf}>
                  <Input
                    defaultValue={defaults.notifiedSignerCpf}
                    name="notifiedSignerCpf"
                    required
                  />
                </FormField>
                <FormField label="E-mail para assinatura" error={errors?.notifiedSignerEmail}>
                  <Input
                    defaultValue={defaults.notifiedSignerEmail}
                    name="notifiedSignerEmail"
                    required
                    type="email"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Fotógrafo">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Nome completo" error={errors?.photographerName}>
                  <Input
                    defaultValue={defaults.photographerName}
                    name="photographerName"
                    required
                  />
                </FormField>
                <FormField label="Estado civil" error={errors?.photographerMaritalStatus}>
                  <Input
                    defaultValue={defaults.photographerMaritalStatus}
                    name="photographerMaritalStatus"
                    required
                  />
                </FormField>
                <FormField label="CPF" error={errors?.photographerCpf}>
                  <Input
                    defaultValue={defaults.photographerCpf}
                    name="photographerCpf"
                    required
                  />
                </FormField>
                <FormField label="Endereço completo" error={errors?.photographerAddress}>
                  <Input
                    defaultValue={defaults.photographerAddress}
                    name="photographerAddress"
                    required
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Direito na Lente">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="CNPJ" error={errors?.dnlCnpj}>
                  <Input readOnly value={defaults.dnlCnpj} />
                </FormField>
                <FormField label="Representante legal" error={errors?.dnlSignerName}>
                  <Input
                    defaultValue={defaults.dnlSignerName}
                    name="dnlSignerName"
                    required
                  />
                </FormField>
                <FormField label="CPF do representante" error={errors?.dnlSignerCpf}>
                  <Input
                    defaultValue={defaults.dnlSignerCpf}
                    name="dnlSignerCpf"
                    required
                  />
                </FormField>
                <FormField label="E-mail para assinatura" error={errors?.dnlSignerEmail}>
                  <Input
                    defaultValue={defaults.dnlSignerEmail}
                    name="dnlSignerEmail"
                    required
                    type="email"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Liquidação">
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Valor" error={errors?.amountCents}>
                  <Input
                    defaultValue={defaults.amount}
                    inputMode="decimal"
                    name="amount"
                    placeholder="1.500,00"
                    required
                  />
                </FormField>
                <FormField label="Valor por extenso" error={errors?.amountInWords}>
                  <Input
                    defaultValue={defaults.amountInWords}
                    name="amountInWords"
                    placeholder="mil e quinhentos reais"
                    required
                  />
                </FormField>
                <FormField label="Vencimento" error={errors?.paymentDueDate}>
                  <Input
                    defaultValue={defaults.paymentDueDate}
                    name="paymentDueDate"
                    required
                    type="date"
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection
              title="Testemunhas"
              description="Opcional. Ao incluir uma testemunha, preencha nome, CPF e e-mail."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Testemunha 1" error={errors?.witness1Name}>
                  <Input defaultValue={defaults.witness1Name} name="witness1Name" />
                </FormField>
                <FormField label="CPF" error={errors?.witness1Cpf}>
                  <Input defaultValue={defaults.witness1Cpf} name="witness1Cpf" />
                </FormField>
                <FormField label="E-mail" error={errors?.witness1Email}>
                  <Input
                    defaultValue={defaults.witness1Email}
                    name="witness1Email"
                    type="email"
                  />
                </FormField>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Testemunha 2" error={errors?.witness2Name}>
                  <Input defaultValue={defaults.witness2Name} name="witness2Name" />
                </FormField>
                <FormField label="CPF" error={errors?.witness2Cpf}>
                  <Input defaultValue={defaults.witness2Cpf} name="witness2Cpf" />
                </FormField>
                <FormField label="E-mail" error={errors?.witness2Email}>
                  <Input
                    defaultValue={defaults.witness2Email}
                    name="witness2Email"
                    type="email"
                  />
                </FormField>
              </div>
            </FormSection>

            {state.message ? (
              <div
                className={`rounded-md border px-4 py-3 text-sm ${
                  state.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-destructive/20 bg-destructive/8 text-destructive"
                }`}
              >
                {state.message}
              </div>
            ) : null}

            <DialogFooter>
              <Button
                disabled={pending}
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {state.status === "success" ? "Fechar" : "Cancelar"}
              </Button>
              {state.status !== "success" ? (
                <Button disabled={pending} type="submit">
                  {pending ? "Enviando..." : "Enviar para assinatura"}
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
