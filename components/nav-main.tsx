"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, MailIcon } from "lucide-react"

export function NavMain({
  items,
  cta,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
  cta?: {
    label: string
    url: string
    icon?: React.ReactNode
  }
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {cta ? (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                asChild
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                tooltip={cta.label}
              >
                <Link href={cta.url}>
                  {cta.icon ?? <CirclePlusIcon />}
                  <span>{cta.label}</span>
                </Link>
              </SidebarMenuButton>
              <Button
                asChild
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                size="icon"
                variant="outline"
              >
                <Link href="/reports">
                  <MailIcon />
                  <span className="sr-only">Relatorios</span>
                </Link>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.url === "/"
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(`${item.url}/`)
                }
                tooltip={item.title}
              >
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
