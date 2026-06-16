import type { CSSProperties } from "react";
import {
  Building2Icon,
  BriefcaseIcon,
  BriefcaseBusinessIcon,
  FolderKanbanIcon,
  GaugeIcon,
  HistoryIcon,
  SearchCheckIcon,
  Settings2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { APP_NAME } from "@/lib/brand";
import { requirePanelAccess } from "@/lib/auth";

const adminNavigation = [
  { title: "Visao geral", url: "/admin", icon: <GaugeIcon /> },
  { title: "Clientes", url: "/admin/clients", icon: <BriefcaseBusinessIcon /> },
  { title: "Casos", url: "/admin/cases", icon: <BriefcaseIcon /> },
  { title: "Galeria", url: "/admin/assets", icon: <FolderKanbanIcon /> },
  { title: "Ocorrencias", url: "/admin/detections", icon: <SearchCheckIcon /> },
];

const adminSecondaryNavigation = [
  { title: "Atividades", url: "/admin/activities", icon: <HistoryIcon /> },
  { title: "Organizacoes", url: "/admin/organizations", icon: <Building2Icon /> },
  { title: "Usuarios", url: "/admin/users", icon: <UsersRoundIcon /> },
  { title: "Varreduras", url: "/admin/scans", icon: <Settings2Icon /> },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requirePanelAccess("admin");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar
        navMain={adminNavigation}
        navSecondary={adminSecondaryNavigation}
        navSecondaryLabel="Administração"
        panel={{
          title: "Painel admin",
          subtitle: APP_NAME,
        }}
        user={{
          avatar: context.avatarUrl ?? "",
          billingHref: "/admin/activities",
          email: context.email ?? "",
          name: context.fullName ?? context.email ?? "Administrador",
          profileHref: "/admin",
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader
          subtitle="Operacao, auditoria e suporte interno"
        />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
