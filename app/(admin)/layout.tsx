import type { CSSProperties } from "react";
import {
  BriefcaseBusinessIcon,
  FolderKanbanIcon,
  GaugeIcon,
  ReceiptTextIcon,
  SearchCheckIcon,
  Settings2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requirePanelAccess } from "@/lib/auth";

const adminNavigation = [
  { title: "Overview", url: "/admin", icon: <GaugeIcon /> },
  { title: "Clients", url: "/admin/clients", icon: <BriefcaseBusinessIcon /> },
  { title: "Assets", url: "/admin/assets", icon: <FolderKanbanIcon /> },
  { title: "Detections", url: "/admin/detections", icon: <SearchCheckIcon /> },
  { title: "Jobs", url: "/admin/jobs", icon: <Settings2Icon /> },
];

const adminSecondaryNavigation = [
  { title: "Reports", url: "/admin/reports", icon: <ReceiptTextIcon /> },
  { title: "Audit", url: "/admin/audit", icon: <ShieldCheckIcon /> },
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
        user={{
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
