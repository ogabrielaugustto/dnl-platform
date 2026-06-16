import Link from "next/link";
import { ScaleIcon } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { MarketingMobileNav } from "@/components/marketing/mobile-nav";

const navigationLinks = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/#como-funciona", label: "Como funciona" },
];

export function MarketingSiteShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f8ff_0%,#ffffff_28%,#f8fbff_62%,#ffffff_100%)] text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_40%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_32%)]" />

      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ScaleIcon className="size-5" />
            </span>
            <span className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
              {APP_NAME}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                className="transition hover:text-foreground"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button asChild size="sm" variant="ghost">
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Criar conta</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <MarketingMobileNav navigationLinks={navigationLinks} />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-white/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-xl space-y-3">
            <p className="font-heading text-xl font-semibold">{APP_NAME}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Monitoramento de imagens com foco em triagem, evidências operacionais
              e validação humana antes de qualquer ação.
            </p>
            <p className="text-sm leading-6 text-primary">
              Plataforma com diretrizes de privacidade, cookies e tratamento de dados alinhadas à LGPD.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" href="/">
              Início
            </Link>
            <Link className="hover:text-foreground" href="/sobre">
              Sobre
            </Link>
            <Link className="hover:text-foreground" href="/contato">
              Contato
            </Link>
            <Link className="hover:text-foreground" href="/termos-de-uso">
              Termos de Uso
            </Link>
            <Link className="hover:text-foreground" href="/politica-de-privacidade">
              Privacidade
            </Link>
            <Link className="hover:text-foreground" href="/auth/login">
              Entrar
            </Link>
            <Link className="hover:text-foreground" href="/auth/register">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
