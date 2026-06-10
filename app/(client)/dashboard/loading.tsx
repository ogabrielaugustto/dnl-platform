import { Skeleton } from "@/components/ui/skeleton";

function SummaryCardSkeleton() {
  return (
    <article className="relative isolate min-h-[154px] overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-none" />
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="size-11 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-10 w-16" />
          <Skeleton className="mt-3 h-4 w-full max-w-44" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      </div>
    </article>
  );
}

function QueueSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-6">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="p-6">
        <div className="grid gap-4 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
          <Skeleton className="size-[72px] rounded-lg" />
          <div className="min-w-0">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="mt-3 h-6 w-full max-w-xs" />
            <Skeleton className="mt-2 h-4 w-full max-w-lg" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-md lg:w-28" />
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-6">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-44" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="divide-y divide-border px-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-2 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
          >
            <Skeleton className="size-2 rounded-full" />
            <div className="min-w-0">
              <Skeleton className="h-4 w-full max-w-52" />
              <Skeleton className="mt-2 h-4 w-full max-w-64" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-36" />
      </div>
      <div className="grid gap-3 p-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3 rounded-lg bg-muted/25 p-3.5">
            <Skeleton className="size-10 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-9 w-full max-w-72" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.95fr)_minmax(300px,0.85fr)]">
        <QueueSkeleton />
        <ActivitySkeleton />
        <InsightsSkeleton />
      </div>
    </section>
  );
}
