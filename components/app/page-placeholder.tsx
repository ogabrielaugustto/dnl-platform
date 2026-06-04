import type { ReactNode } from "react";

type PagePlaceholderProps = {
  description?: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
};

export function PagePlaceholder({
  description,
  eyebrow,
  title,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="flex w-full flex-1 flex-col gap-4 px-6 py-10 md:px-8">
      <div className="w-full rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
