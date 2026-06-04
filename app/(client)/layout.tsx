import type { CSSProperties } from "react";
import {
  BellIcon,
  FolderKanbanIcon,
  GaugeIcon,
  SearchCheckIcon,
  Settings2Icon,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requirePanelAccess } from "@/lib/auth";

const clientNavigation = [
  { title: "Dashboard", url: "/dashboard", icon: <GaugeIcon /> },
  { title: "Assets", url: "/assets", icon: <FolderKanbanIcon /> },
  { title: "Detections", url: "/detections", icon: <SearchCheckIcon /> },
];

const clientSecondaryNavigation = [
  { title: "Reports", url: "/reports", icon: <BellIcon /> },
  { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
];

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requirePanelAccess("client");

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
        cta={{
          label: "Novo asset",
          url: "/assets/new",
        }}
        navMain={clientNavigation}
        navSecondary={clientSecondaryNavigation}
        organization={{
          currentOrganizationId: context.membership?.organizationId ?? "",
          currentOrganizationName:
            context.membership?.organizationName ?? "Client Panel",
          organizations: context.organizations,
        }}
        user={{
          email: context.email ?? "",
          name: context.fullName ?? context.email ?? "Cliente",
          profileHref: "/settings",
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
