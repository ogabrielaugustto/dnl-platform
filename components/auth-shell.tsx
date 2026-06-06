import Link from "next/link";
import { ScaleIcon } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

type AuthShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  children: React.ReactNode;
  asideTitle: string;
  asideDescription: string;
};

export function AuthShell({
  title,
  description,
  eyebrow,
  children,
  asideTitle,
  asideDescription,
}: AuthShellProps) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_var(--color-primary)_0%,_transparent_35%),linear-gradient(135deg,oklch(0.2_0.04_260),oklch(0.3_0.05_240))] lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.25))]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <Link className="flex items-center gap-3 font-medium" href="/">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <ScaleIcon className="size-5" />
            </span>
            <span className="font-heading text-lg">{APP_NAME}</span>
          </Link>
          <div className="max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              {eyebrow}
            </p>
            <h2 className="font-heading text-4xl font-semibold tracking-tight">
              {asideTitle}
            </h2>
            <p className="text-base leading-7 text-white/80">
              {asideDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <Link className="flex items-center gap-3 font-medium" href="/">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ScaleIcon className="size-5" />
            </span>
            <span className="font-heading text-lg">{APP_NAME}</span>
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-10">
          <div className="w-full space-y-8">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
