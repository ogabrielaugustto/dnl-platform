"use client"

import * as React from "react"
import { ShieldCheckIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import { APP_NAME } from "@/lib/brand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarLink = {
  title: string
  url: string
  icon: React.ReactNode
}

type SidebarUser = {
  name: string
  email: string
  avatar?: string
  profileHref: string
  organizationHref?: string
  billingHref?: string
}

type SidebarPanel = {
  title: string
  subtitle: string
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  navMain?: SidebarLink[]
  navSecondary?: SidebarLink[]
  panel?: SidebarPanel
  organization?: {
    currentOrganizationId: string
    currentOrganizationName: string
    organizations: Array<{
      organizationId: string
      organizationName: string | null
      role: "owner" | "admin" | "member"
    }>
  }
  user?: SidebarUser
}

export function AppSidebar({
  navMain = [],
  navSecondary = [],
  panel,
  organization,
  user,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {organization ? (
          <OrganizationSwitcher
            key={organization.currentOrganizationId}
            currentOrganizationId={organization.currentOrganizationId}
            currentOrganizationName={organization.currentOrganizationName}
            organizations={organization.organizations}
          />
        ) : panel ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="pointer-events-none h-auto py-2 opacity-100 hover:bg-transparent active:bg-transparent"
                size="lg"
              >
                <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{panel.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {panel.subtitle}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="pointer-events-none h-auto py-2 opacity-100 hover:bg-transparent active:bg-transparent"
                size="lg"
              >
                <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{APP_NAME}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Painel
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      {user ? (
        <SidebarFooter>
          <NavUser
            user={{
              avatar: user.avatar ?? "",
              billingHref: user.billingHref,
              email: user.email,
              name: user.name,
              organizationHref: user.organizationHref,
              profileHref: user.profileHref,
            }}
          />
        </SidebarFooter>
      ) : null}
    </Sidebar>
  )
}
