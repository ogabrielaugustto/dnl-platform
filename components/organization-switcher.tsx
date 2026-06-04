"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react";
import {
  createOrganizationAction,
  switchOrganizationAction,
} from "@/app/actions/organizations";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type OrganizationItem = {
  organizationId: string;
  organizationName: string | null;
  role: "owner" | "admin" | "member";
};

type OrganizationSwitcherProps = {
  currentOrganizationId: string;
  currentOrganizationName: string;
  organizations: OrganizationItem[];
};

const initialState: {
  message?: string;
  status?: "error" | "success";
} = {};

export function OrganizationSwitcher({
  currentOrganizationId,
  currentOrganizationName,
  organizations,
}: OrganizationSwitcherProps) {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Drawer direction="right" open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[slot=sidebar-menu-button]:h-auto data-[slot=sidebar-menu-button]:py-2"
                size="lg"
              >
                <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2Icon className="size-4" />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {currentOrganizationName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Trocar organizacao
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
              side="bottom"
              sideOffset={8}
            >
              {organizations.map((organization) => (
                <form action={switchOrganizationAction} key={organization.organizationId}>
                  <input
                    name="organizationId"
                    type="hidden"
                    value={organization.organizationId}
                  />
                  <DropdownMenuItem asChild>
                    <button
                      className="w-full"
                      disabled={organization.organizationId === currentOrganizationId}
                      type="submit"
                    >
                      <Building2Icon />
                      <span className="flex-1 truncate text-left">
                        {organization.organizationName ?? "Organizacao sem nome"}
                      </span>
                      {organization.organizationId === currentOrganizationId ? (
                        <CheckIcon className="size-4" />
                      ) : null}
                    </button>
                  </DropdownMenuItem>
                </form>
              ))}
              <DropdownMenuSeparator />
              <DrawerTrigger asChild>
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <PlusIcon />
                  Nova organizacao
                </DropdownMenuItem>
              </DrawerTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Nova organizacao</DrawerTitle>
          <DrawerDescription>
            Crie uma nova organizacao e alterne automaticamente para ela.
          </DrawerDescription>
        </DrawerHeader>
        <form action={formAction} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <FieldGroup>
            <div className="flex flex-col gap-3">
              <FieldLabel htmlFor="organization-name">Nome da organizacao</FieldLabel>
              <Input
                autoFocus
                className="bg-background"
                id="organization-name"
                name="name"
                placeholder="Ex.: Studio LTDA"
                required
                type="text"
              />
            </div>
            {state.message ? <FieldError>{state.message}</FieldError> : null}
          </FieldGroup>
          <DrawerFooter className="px-0">
            <Button disabled={pending} type="submit">
              {pending ? "Criando..." : "Criar organizacao"}
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
