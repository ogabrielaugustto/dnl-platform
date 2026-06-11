function SkeletonLine({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />;
}

function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="mt-4 h-8 w-28" />
      <SkeletonLine className="mt-6 h-4 w-full" />
      <SkeletonLine className="mt-2 h-4 w-2/3" />
    </div>
  );
}

function HeaderBlock({
  eyebrowWidth = "w-28",
  titleWidth = "w-64",
  descriptionWidth = "w-full max-w-2xl",
}: {
  eyebrowWidth?: string;
  titleWidth?: string;
  descriptionWidth?: string;
}) {
  return (
    <header className="border-b border-border pb-4">
      <SkeletonLine className={`h-3 ${eyebrowWidth}`} />
      <SkeletonLine className={`mt-4 h-10 ${titleWidth}`} />
      <SkeletonLine className={`mt-4 h-4 ${descriptionWidth}`} />
      <SkeletonLine className="mt-2 h-4 w-full max-w-xl" />
    </header>
  );
}

export function AdminOverviewLoading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-8">
      <HeaderBlock eyebrowWidth="w-24" titleWidth="w-56" descriptionWidth="w-full max-w-lg" />
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SkeletonLine className="h-5 w-44" />
            <SkeletonLine className="mt-3 h-4 w-56" />
          </div>
          <SkeletonLine className="h-9 w-40 rounded-lg" />
        </div>
        <SkeletonLine className="mt-8 h-[250px] w-full rounded-2xl" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <SkeletonLine className="h-9 w-64 rounded-lg" />
          <SkeletonLine className="h-9 w-32 rounded-lg" />
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-5 gap-3 border-b border-border bg-muted/40 px-4 py-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonLine key={index} className="h-3 w-20" />
            ))}
          </div>
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-5 gap-3 border-b border-border px-4 py-4 last:border-b-0">
                {Array.from({ length: 5 }).map((__, columnIndex) => (
                  <SkeletonLine
                    key={columnIndex}
                    className={columnIndex === 0 ? "h-4 w-28" : "h-4 w-full max-w-[10rem]"}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminTableLoading({
  titleWidth = "w-48",
}: {
  titleWidth?: string;
}) {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <HeaderBlock eyebrowWidth="w-28" titleWidth={titleWidth} descriptionWidth="w-full max-w-3xl" />
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="hidden gap-3 border-b border-border bg-muted/30 px-4 py-3 xl:grid xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLine key={index} className="h-3 w-20" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-4 px-4 py-4 xl:grid-cols-5 xl:items-center"
            >
              {Array.from({ length: 5 }).map((__, columnIndex) => (
                <div key={columnIndex}>
                  <SkeletonLine className="h-4 w-full max-w-[11rem]" />
                  {columnIndex === 0 ? (
                    <SkeletonLine className="mt-2 h-3 w-full max-w-[8rem]" />
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminCasesRouteLoading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <HeaderBlock eyebrowWidth="w-28" titleWidth="w-56" descriptionWidth="w-full max-w-3xl" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="size-16 shrink-0 animate-pulse rounded-md border border-border bg-muted" />
                <div className="min-w-0">
                  <SkeletonLine className="h-3 w-40" />
                  <SkeletonLine className="mt-3 h-5 w-48" />
                  <SkeletonLine className="mt-2 h-4 w-64" />
                  <SkeletonLine className="mt-2 h-4 w-72" />
                  <div className="mt-3 flex gap-2">
                    <SkeletonLine className="h-5 w-28 rounded-full" />
                    <SkeletonLine className="h-5 w-32 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <SkeletonLine className="h-9 w-28 rounded-lg" />
                <SkeletonLine className="h-9 w-36 rounded-lg" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((__, cardIndex) => (
                <div key={cardIndex} className="rounded-md bg-muted/25 p-3">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="mt-3 h-4 w-full max-w-[9rem]" />
                  <SkeletonLine className="mt-2 h-3 w-full max-w-[8rem]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminSourcesLoading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-8 md:px-8">
      <div className="flex flex-col gap-2">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-10 w-64" />
        <SkeletonLine className="h-4 w-full max-w-3xl" />
        <SkeletonLine className="h-4 w-full max-w-2xl" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="mt-4 h-10 w-full rounded-lg" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SkeletonLine className="h-10 w-full rounded-lg" />
          <SkeletonLine className="h-10 w-full rounded-lg" />
          <SkeletonLine className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="grid gap-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <SkeletonLine className="h-5 w-44" />
              <SkeletonLine className="mt-4 h-4 w-40" />
              <SkeletonLine className="mt-6 h-10 w-full rounded-lg" />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((__, statIndex) => (
                  <div key={statIndex}>
                    <SkeletonLine className="h-3 w-20" />
                    <SkeletonLine className="mt-2 h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminPlaceholderLoading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <HeaderBlock eyebrowWidth="w-28" titleWidth="w-52" descriptionWidth="w-full max-w-2xl" />
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <SkeletonLine className="h-5 w-48" />
        <SkeletonLine className="mt-4 h-4 w-full max-w-2xl" />
        <SkeletonLine className="mt-2 h-4 w-full max-w-xl" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="p-4" />
          ))}
        </div>
      </div>
    </section>
  );
}
