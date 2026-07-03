import { Badge } from "@/components/ui/badge";
import { listAdminPlans } from "@/lib/dal/admin-plans";
import { AdminPlansTable } from "./_components/admin-plans-table";

export default async function AdminPlansPage() {
  const plans = await listAdminPlans();
  const activePlans = plans.filter((plan) => plan.isActive).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administração
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Planos
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Gerencie nome, descricao, preco e limites dos planos usados nas assinaturas dos clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{plans.length} plano(s)</Badge>
          <Badge variant="secondary">{activePlans} ativo(s)</Badge>
        </div>
      </header>

      <AdminPlansTable rows={plans} />
    </section>
  );
}
