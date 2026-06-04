"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OrganizationSwitcher } from "@/components/organization-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
  billingHref?: string
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  cta?: {
    label: string
    url: string
    icon?: React.ReactNode
  }
  navMain: SidebarLink[]
  navSecondary: SidebarLink[]
  organization?: {
    currentOrganizationId: string
    currentOrganizationName: string
    organizations: Array<{
      organizationId: string
      organizationName: string | null
      role: "owner" | "admin" | "member"
    }>
  }
  user: SidebarUser
}

export function AppSidebar({
  cta,
  navMain,
  navSecondary,
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
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        <NavMain cta={cta} items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            avatar: user.avatar ?? "",
            billingHref: user.billingHref,
            email: user.email,
            name: user.name,
            profileHref: user.profileHref,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
