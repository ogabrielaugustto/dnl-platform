"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavigationLink = {
  href: string;
  label: string;
};

type MarketingMobileNavProps = {
  navigationLinks: NavigationLink[];
};

export function MarketingMobileNav({
  navigationLinks,
}: MarketingMobileNavProps) {
  const isClient = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  if (!isClient) {
    return (
      <Button
        aria-label="Abrir menu"
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <MenuIcon className="size-4" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button aria-label="Abrir menu" size="icon-sm" variant="outline">
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[88vw] max-w-sm" side="right">
        <SheetHeader className="space-y-2 border-b border-border/70 pb-4">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Acesse as páginas institucionais e entre na plataforma.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
          <div className="flex flex-col gap-2 pt-4">
            {navigationLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  className="rounded-2xl px-3 py-3 text-sm text-foreground transition hover:bg-primary/5"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <SheetClose asChild>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Entrar</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild size="lg">
                <Link href="/auth/register">Criar conta</Link>
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function subscribeToClient() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
