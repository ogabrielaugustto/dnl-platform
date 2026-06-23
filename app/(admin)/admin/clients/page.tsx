import { Badge } from "@/components/ui/badge";
import { listAdminClients } from "@/lib/dal/admin-clients";
import { InviteUserDialog } from "../users/_components/invite-user-dialog";
import { AdminClientsTable } from "./_components/admin-clients-table";

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
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Gerencie os clientes, os acessos vinculados a cada organizacao e a
            frequencia operacional de monitoramento sem depender da galeria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{clients.length} cliente(s)</Badge>
          <InviteUserDialog
            mode="client"
            organizations={clients.map((client) => ({
              id: client.id,
              name: client.name,
            }))}
          />
        </div>
      </header>

      <AdminClientsTable rows={clients} />
    </section>
  );
}
