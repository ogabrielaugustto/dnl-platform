import { SiteBreadcrumbs } from "@/components/site-breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type SiteHeaderProps = {
  subtitle?: string
  action?: React.ReactNode
}

export function SiteHeader({ subtitle, action }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-3 px-4 lg:gap-6 lg:px-6">
        <div className="flex min-w-0 items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="min-w-0">
            <SiteBreadcrumbs />
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}
