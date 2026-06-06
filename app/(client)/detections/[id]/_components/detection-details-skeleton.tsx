import { Skeleton } from "@/components/ui/skeleton";

export function DetectionDetailsSkeleton() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <div className="border-b border-border pb-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-3 h-8 w-full max-w-sm rounded-full" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="min-h-80 rounded-lg" />
            <Skeleton className="min-h-80 rounded-lg" />
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <Skeleton className="h-9 w-full max-w-md" />
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-4 h-9 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
