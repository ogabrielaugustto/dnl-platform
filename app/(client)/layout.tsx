import type { CSSProperties } from "react";
import {
  BriefcaseIcon,
  FolderKanbanIcon,
  GaugeIcon,
  InfoIcon,
  SearchCheckIcon,
  Settings2Icon,
} from "lucide-react";
import { SignatureRequiredDialog } from "@/app/(client)/_components/signature-required-dialog";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requirePanelAccess } from "@/lib/auth";
import { getProfileSettingsData } from "@/lib/dal/settings";

const clientNavigation = [
  { title: "Inicio", url: "/dashboard", icon: <GaugeIcon /> },
  { title: "Galeria", url: "/gallery", icon: <FolderKanbanIcon /> },
  { title: "Ocorrencias", url: "/detections", icon: <SearchCheckIcon /> },
  { title: "Casos", url: "/cases", icon: <BriefcaseIcon /> },
];

const clientSecondaryNavigation = [
  { title: "Como funciona", url: "#how-it-works", icon: <InfoIcon /> },
  { title: "Configuracoes", url: "/settings", icon: <Settings2Icon /> },
];

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requirePanelAccess("client");
  const profile = await getProfileSettingsData();

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
        navMain={clientNavigation}
        navSecondary={clientSecondaryNavigation}
        organization={{
          currentOrganizationId: context.membership?.organizationId ?? "",
          currentOrganizationName:
            context.membership?.organizationName ?? "Minha conta",
          organizations: context.organizations,
        }}
        user={{
          avatar: context.avatarUrl ?? "",
          email: context.email ?? "",
          name: context.fullName ?? context.email ?? "Cliente",
          organizationHref: "/settings/organization",
          profileHref: "/settings/profile",
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <SignatureRequiredDialog
            fullName={profile.fullName}
            open={!profile.signature}
          />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
