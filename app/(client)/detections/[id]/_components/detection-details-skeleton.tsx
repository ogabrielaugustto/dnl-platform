import { Skeleton } from "@/components/ui/skeleton";

export function DetectionDetailsSkeleton() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="mt-4 h-10 w-full max-w-md rounded-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
        <div className="mt-6 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <Skeleton className="min-h-80 rounded-2xl" />
            <Skeleton className="min-h-80 rounded-2xl" />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-muted/25 p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-4 w-20" />
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="mt-3 h-4 w-full" />
            <div className="mt-5 flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-36 rounded-full" />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-3 h-4 w-full max-w-xs" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border p-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-32 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
