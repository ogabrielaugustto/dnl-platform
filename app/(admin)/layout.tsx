import type { CSSProperties } from "react";
import {
  BriefcaseIcon,
  BriefcaseBusinessIcon,
  FolderKanbanIcon,
  GaugeIcon,
  Globe2Icon,
  ReceiptTextIcon,
  SearchCheckIcon,
  Settings2Icon,
  ShieldCheckIcon,
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
  { title: "Fontes", url: "/admin/sources", icon: <Globe2Icon /> },
  { title: "Processamentos", url: "/admin/jobs", icon: <Settings2Icon /> },
];

const adminSecondaryNavigation = [
  { title: "Relatorios", url: "/admin/reports", icon: <ReceiptTextIcon /> },
  { title: "Auditoria", url: "/admin/audit", icon: <ShieldCheckIcon /> },
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
        panel={{
          title: "Painel admin",
          subtitle: APP_NAME,
        }}
        user={{
          avatar: context.avatarUrl ?? "",
          billingHref: "/admin/reports",
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
