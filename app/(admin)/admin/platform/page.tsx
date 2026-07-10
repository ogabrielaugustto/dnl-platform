import { Badge } from "@/components/ui/badge";
import { getPlatformContactSettings } from "@/lib/dal/admin-platform";
import { listAdminPlans } from "@/lib/dal/admin-plans";
import {
  listAdminOrganizations,
  listAdminUsers,
} from "@/lib/dal/admin-management";
import { AdminPlatformTabs } from "./_components/admin-platform-tabs";

type PlatformTab = "plans" | "users" | "contact";

function parseDefaultTab(value: string | string[] | undefined): PlatformTab {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "users" || candidate === "contact") {
    return candidate;
  }

  return "plans";
}

export default async function AdminPlatformPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const params = await searchParams;
  const [plans, contactSettings, users, organizations] = await Promise.all([
    listAdminPlans(),
    getPlatformContactSettings(),
    listAdminUsers("internal"),
    listAdminOrganizations(),
  ]);
  const activePlans = plans.filter((plan) => plan.isActive).length;
  const activeUsers = users.filter((user) => user.isActive).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Administracao
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            Plataforma
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Configure areas internas da plataforma, como planos comerciais e canais publicos de contato.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{plans.length} plano(s)</Badge>
          <Badge variant="secondary">{activePlans} ativo(s)</Badge>
          <Badge variant="outline">{users.length} usuario(s)</Badge>
          <Badge variant="secondary">{activeUsers} ativo(s)</Badge>
        </div>
      </header>

      <AdminPlatformTabs
        contactSettings={contactSettings}
        defaultTab={parseDefaultTab(params?.tab)}
        organizations={organizations}
        plans={plans}
        users={users}
      />
    </section>
  );
}
