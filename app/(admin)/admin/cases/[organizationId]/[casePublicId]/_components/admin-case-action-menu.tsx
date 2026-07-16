"use client";

import { useActionState, useMemo, useState } from "react";
import {
  ChevronDownIcon,
  FileSignatureIcon,
  MailIcon,
  MessageSquareTextIcon,
  ScaleIcon,
} from "lucide-react";
import {
  executeAdminCaseAction,
  initialAdminCaseActionState,
} from "@/app/actions/admin-cases-workflow";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ADMIN_CASE_ACTION_LABELS,
  resolveAdminCaseActionEffect,
  type AdminCaseActionKind,
} from "@/lib/admin-case-workflow";

type AdminCaseActionContext = {
  organizationId: string;
  casePublicId: number;
  representativeDetectionId: string;
  casePublicIdLabel: string;
  clientName: string;
  domain: string;
  sourceUrl: string;
  finalUrl: string | null;
  assetTitle: string;
  defaultNotifiedName: string;
  defaultNotifiedEmail: string;
  defaultNotifiedPhone: string;
  defaultNotifiedDocument: string;
  defaultNotifiedWebsiteUrl: string;
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

function NativeSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <select
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      defaultValue={defaultValue}
      name={name}
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string[];
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error?.length ? (
        <span className="text-xs text-destructive">{error.join(" ")}</span>
      ) : null}
    </label>
  );
}

function ActionMenuItem({
  action,
  onSelect,
}: {
  action: AdminCaseActionKind;
  onSelect: (action: AdminCaseActionKind) => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        onSelect(action);
      }}
    >
      {ADMIN_CASE_ACTION_LABELS[action]}
    </DropdownMenuItem>
  );
}

export function AdminCaseActionMenu({ context }: AdminCaseActionMenuProps) {
  const [selectedAction, setSelectedAction] =
    useState<AdminCaseActionKind>("first_communication");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    executeAdminCaseAction,
    initialAdminCaseActionState,
  );
  const effect = useMemo(
    () => resolveAdminCaseActionEffect(selectedAction),
    [selectedAction],
  );
  const requiresEmail = effect.sendsEmail;
  const showContactFields = requiresEmail || selectedAction === "legal";
  const showProposalFields = selectedAction === "negotiation";
  const showPaymentFields =
    selectedAction === "register_payment" || selectedAction === "collections";
  const showSraFields = selectedAction === "register_sra";
  const showTitleField =
    selectedAction === "follow_up" ||
    selectedAction === "call" ||
    selectedAction === "internal_note" ||
    selectedAction === "legal" ||
    selectedAction === "close_resolved";

  function openAction(action: AdminCaseActionKind) {
    setSelectedAction(action);
    setOpen(true);
  }

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
            <ActionMenuItem action={action} key={action} onSelect={openAction} />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <MessageSquareTextIcon className="size-3.5" />
            Tratativas
          </DropdownMenuLabel>
          {internalActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={openAction} />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <FileSignatureIcon className="size-3.5" />
            Negociação e documentos
          </DropdownMenuLabel>
          {financialActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={openAction} />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2">
            <ScaleIcon className="size-3.5" />
            Encaminhamento
          </DropdownMenuLabel>
          {closingActions.map((action) => (
            <ActionMenuItem action={action} key={action} onSelect={openAction} />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
          <form action={formAction} className="grid gap-5" encType="multipart/form-data">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={requiresEmail ? "default" : "outline"}>
                  {requiresEmail ? "Envia e-mail" : "Registro interno"}
                </Badge>
                {effect.detectionStatus ? (
                  <Badge variant="secondary">Atualiza status</Badge>
                ) : null}
              </div>
              <DialogTitle>{ADMIN_CASE_ACTION_LABELS[selectedAction]}</DialogTitle>
              <DialogDescription>
                A ação será registrada no histórico do caso {context.casePublicIdLabel}.
              </DialogDescription>
            </DialogHeader>

            <input name="organizationId" type="hidden" value={context.organizationId} />
            <input name="casePublicId" type="hidden" value={context.casePublicId} />
            <input
              name="representativeDetectionId"
              type="hidden"
              value={context.representativeDetectionId}
            />
            <input name="actionKind" type="hidden" value={selectedAction} />
            <input name="casePublicIdLabel" type="hidden" value={context.casePublicIdLabel} />
            <input name="clientName" type="hidden" value={context.clientName} />
            <input name="domain" type="hidden" value={context.domain} />
            <input name="sourceUrl" type="hidden" value={context.sourceUrl} />
            <input name="finalUrl" type="hidden" value={context.finalUrl ?? ""} />
            <input name="assetTitle" type="hidden" value={context.assetTitle} />

            {showContactFields ? (
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Nome do notificado">
                  <Input
                    defaultValue={context.defaultNotifiedName}
                    name="notifiedName"
                    placeholder="Responsável pelo site"
                  />
                </FormField>
                <FormField
                  error={state.fieldErrors?.notifiedEmail}
                  label={requiresEmail ? "E-mail do notificado" : "E-mail"}
                >
                  <Input
                    defaultValue={context.defaultNotifiedEmail}
                    name="notifiedEmail"
                    placeholder="juridico@empresa.com"
                    required={requiresEmail}
                    type="email"
                  />
                </FormField>
                <FormField label="Telefone">
                  <Input defaultValue={context.defaultNotifiedPhone} name="notifiedPhone" />
                </FormField>
                <FormField label="Documento">
                  <Input defaultValue={context.defaultNotifiedDocument} name="notifiedDocument" />
                </FormField>
                <FormField label="Website">
                  <Input
                    defaultValue={context.defaultNotifiedWebsiteUrl}
                    name="notifiedWebsiteUrl"
                  />
                </FormField>
              </div>
            ) : null}

            {showTitleField ? (
              <FormField label="Título interno">
                <Input
                  name="title"
                  placeholder={`Resumo de ${ADMIN_CASE_ACTION_LABELS[selectedAction].toLowerCase()}`}
                />
              </FormField>
            ) : null}

            {showProposalFields ? (
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Valor proposto">
                  <Input inputMode="decimal" name="proposedAmount" placeholder="1.500,00" />
                </FormField>
                <FormField label="Vencimento">
                  <Input name="paymentDueDate" type="date" />
                </FormField>
                <FormField label="Meio previsto">
                  <NativeSelect
                    defaultValue=""
                    name="paymentMethod"
                    options={[
                      ["", "Não definido"],
                      ["boleto", "Boleto"],
                      ["pix", "PIX"],
                      ["transfer", "Transferência"],
                      ["other", "Outro"],
                    ]}
                  />
                </FormField>
              </div>
            ) : null}

            {showPaymentFields ? (
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Valor pago / em cobrança">
                  <Input inputMode="decimal" name="paidAmount" placeholder="1.500,00" />
                </FormField>
                <FormField label="Data de pagamento">
                  <Input name="paidAt" type="datetime-local" />
                </FormField>
                <FormField label="Vencimento">
                  <Input name="paymentDueDate" type="date" />
                </FormField>
                <FormField label="Referência">
                  <Input name="paymentReference" />
                </FormField>
                <FormField label="URL de pagamento">
                  <Input name="paymentUrl" />
                </FormField>
                <FormField label="Meio">
                  <NativeSelect
                    defaultValue={selectedAction === "register_payment" ? "pix" : ""}
                    name="paymentMethod"
                    options={[
                      ["", "Não definido"],
                      ["boleto", "Boleto"],
                      ["pix", "PIX"],
                      ["transfer", "Transferência"],
                      ["other", "Outro"],
                    ]}
                  />
                </FormField>
              </div>
            ) : null}

            {showSraFields ? (
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <FormField label="Status do SRA">
                    <NativeSelect
                      defaultValue="attached"
                      name="documentStatus"
                      options={[
                        ["attached", "Anexado"],
                        ["signature_requested", "Assinatura solicitada"],
                        ["signed", "Assinado"],
                      ]}
                    />
                  </FormField>
                  <FormField label="Título">
                    <Input defaultValue="SRA do caso" name="documentTitle" />
                  </FormField>
                  <FormField label="Arquivo">
                    <Input name="file" type="file" />
                  </FormField>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <FormField label="Provider">
                    <Input name="provider" placeholder="clicksign, docusign..." />
                  </FormField>
                  <FormField label="Envelope externo">
                    <Input name="externalEnvelopeId" />
                  </FormField>
                  <FormField label="URL externa">
                    <Input name="externalUrl" />
                  </FormField>
                  <FormField label="Status externo">
                    <Input name="externalStatus" />
                  </FormField>
                  <FormField label="Assinado em">
                    <Input name="signedAt" type="datetime-local" />
                  </FormField>
                  <FormField label="Expira em">
                    <Input name="expiresAt" type="datetime-local" />
                  </FormField>
                </div>
              </div>
            ) : null}

            <FormField label="Observações">
              <Textarea
                name="notes"
                placeholder={
                  requiresEmail
                    ? "Observação interna opcional sobre o envio."
                    : "Registre o contexto da ação para o histórico."
                }
              />
            </FormField>

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
              <Button disabled={pending} type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={pending} type="submit">
                {pending ? "Executando..." : "Executar ação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
