import Link from "next/link";
import { PagePlaceholder } from "@/components/app/page-placeholder";

export default function LandingPage() {
  return (
    <main className="flex flex-1 items-center bg-background">
      <PagePlaceholder
        eyebrow="Landing Page"
        title="Direito Na Lente"
        description="Base inicial da landing page, autenticacao, painel do cliente e painel administrativo dentro do mesmo app Next.js."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            href="/auth/login"
          >
            Entrar como cliente
          </Link>
          <Link
            className="rounded-full border border-border px-5 py-2 text-sm font-medium"
            href="/auth/register"
          >
            Criar conta do cliente
          </Link>
          <Link
            className="rounded-full border border-border px-5 py-2 text-sm font-medium"
            href="/admin/login"
          >
            Entrar como admin
          </Link>
        </div>
      </PagePlaceholder>
    </main>
  );
}
