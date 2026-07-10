"use client";

import { MailIcon, PanelsTopLeftIcon, UsersRoundIcon } from "lucide-react";
import { InviteUserDialog } from "../../users/_components/invite-user-dialog";
import { AdminUsersTable } from "../../users/_components/admin-users-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminPlatformContactSettings } from "@/lib/dal/admin-platform";
import type { AdminPlanListItem } from "@/lib/dal/admin-plans";
import type {
  AdminOrganizationListItem,
  AdminUserListItem,
} from "@/lib/dal/admin-management";
import { AdminPlansTable } from "../../plans/_components/admin-plans-table";
import { AdminPlatformContactForm } from "./admin-platform-contact-form";

type AdminPlatformTabsProps = {
  contactSettings: AdminPlatformContactSettings;
  defaultTab: "plans" | "users" | "contact";
  organizations: AdminOrganizationListItem[];
  plans: AdminPlanListItem[];
  users: AdminUserListItem[];
};

export function AdminPlatformTabs({
  contactSettings,
  defaultTab,
  organizations,
  plans,
  users,
}: AdminPlatformTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full gap-5">
      <TabsList className="h-10 w-fit overflow-visible">
        <TabsTrigger className="px-3" value="plans">
          <PanelsTopLeftIcon className="size-4" />
          Planos
        </TabsTrigger>
        <TabsTrigger className="px-3" value="users">
          <UsersRoundIcon className="size-4" />
          Usuarios
        </TabsTrigger>
        <TabsTrigger className="px-3" value="contact">
          <MailIcon className="size-4" />
          Contato
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plans">
        <AdminPlansTable rows={plans} />
      </TabsContent>

      <TabsContent className="space-y-4" value="users">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Usuarios internos</p>
            <p className="text-sm text-muted-foreground">
              Gerencie colaboradores internos da DNL, reset de senha e ativacao de contas administrativas.
            </p>
          </div>
          <InviteUserDialog
            mode="internal"
            organizations={organizations.map((organization) => ({
              id: organization.id,
              name: organization.name,
            }))}
          />
        </div>
        <AdminUsersTable organizations={organizations} rows={users} />
      </TabsContent>

      <TabsContent value="contact">
        <AdminPlatformContactForm settings={contactSettings} />
      </TabsContent>
    </Tabs>
  );
}
