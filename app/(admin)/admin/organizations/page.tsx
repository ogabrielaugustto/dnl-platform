import { Badge } from "@/components/ui/badge";
import { listAdminOrganizations } from "@/lib/dal/admin-management";
import { AdminOrganizationsTable } from "./_components/admin-organizations-table";

export default async function AdminOrganizationsPage() {
  const organizations = await listAdminOrganizations();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administração
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Organizacoes
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Tenha uma visao consolidada dos workspaces cadastrados, status da conta e volume de usuarios vinculados em cada organizacao.
          </p>
        </div>
        <Badge variant="outline">{organizations.length} organizacao(oes)</Badge>
      </header>

      <AdminOrganizationsTable rows={organizations} />
    </section>
  );
}
