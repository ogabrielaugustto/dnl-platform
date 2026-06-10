import { updateClientScanFrequencyAction } from "@/app/actions/admin-clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminClients } from "@/lib/dal/admin-clients";
import {
  formatMonitoringFrequency,
  monitoringFrequencyOptions,
} from "@/lib/monitoring-frequency";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSubscriptionStatus(value: string | null) {
  switch (value) {
    case "trialing":
      return "Trial";
    case "active":
      return "Ativa";
    case "past_due":
      return "Pagamento pendente";
    case "paused":
      return "Pausada";
    case "cancelled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    default:
      return "Sem assinatura";
  }
}

export default async function AdminClientsPage() {
  const clients = await listAdminClients();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administracao
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste a frequencia de monitoramento por cliente. O cliente nao altera
            essa cadencia na galeria.
          </p>
        </div>
        <Badge variant="outline">{clients.length} cliente(s)</Badge>
      </header>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-8 text-center shadow-sm">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Nenhum cliente cadastrado
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            As organizacoes criadas na plataforma aparecem aqui para administracao.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(220px,1.3fr)_minmax(160px,1fr)_150px_180px_220px] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground xl:grid">
            <span>Cliente</span>
            <span>Plano</span>
            <span>Status</span>
            <span>Frequencia atual</span>
            <span className="text-right">Administrar</span>
          </div>

          <div className="divide-y divide-border">
            {clients.map((client) => (
              <article
                key={client.id}
                className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(220px,1.3fr)_minmax(160px,1fr)_150px_180px_220px] xl:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {client.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {client.billingEmail ?? "Sem e-mail de cobranca"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Criado em {formatDate(client.createdAt)}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {client.planName ?? "Starter manual"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={client.isActive ? "secondary" : "destructive"}>
                    {client.isActive ? "Workspace ativo" : "Workspace inativo"}
                  </Badge>
                  <Badge variant="outline">
                    {formatSubscriptionStatus(client.subscriptionStatus)}
                  </Badge>
                </div>

                <p className="text-sm font-medium text-foreground">
                  {formatMonitoringFrequency(client.scanFrequency)}
                </p>

                <form
                  action={updateClientScanFrequencyAction}
                  className="flex flex-wrap items-center gap-2 xl:justify-end"
                >
                  <input type="hidden" name="organizationId" value={client.id} />
                  <select
                    name="frequency"
                    defaultValue={client.scanFrequency}
                    className="h-9 min-w-36 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    aria-label={`Frequencia de ${client.name}`}
                  >
                    {monitoringFrequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm">
                    Salvar
                  </Button>
                </form>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
