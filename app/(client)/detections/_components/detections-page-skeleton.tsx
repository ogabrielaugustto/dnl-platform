import { Skeleton } from "@/components/ui/skeleton";

export function DetectionsPageSkeleton() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="mt-4 h-10 w-full max-w-md rounded-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-muted/30 p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm md:px-5">
        <Skeleton className="h-9 w-full max-w-xl rounded-full" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
              <Skeleton className="min-h-48 rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-full max-w-md" />
                <Skeleton className="h-4 w-full max-w-lg" />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((__, cardIndex) => (
                    <div
                      key={cardIndex}
                      className="rounded-2xl border border-border bg-muted/25 p-3"
                    >
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="mt-3 h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
