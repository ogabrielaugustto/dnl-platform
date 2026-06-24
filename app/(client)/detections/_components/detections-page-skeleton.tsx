import { Skeleton } from "@/components/ui/skeleton";

export function DetectionsPageSkeleton() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <div className="border-b border-border pb-4">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-3 h-8 w-full max-w-sm rounded-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </div>

      <div className="rounded-lg border border-border bg-card px-3 py-3 ">
        <Skeleton className="h-8 w-full max-w-2xl rounded-full" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card ">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b border-border px-4 py-4 last:border-b-0">
            <div className="flex items-center gap-3">
              <Skeleton className="size-14 rounded-md" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-full max-w-xs" />
                <Skeleton className="mt-2 h-6 w-40 rounded-full" />
              </div>
              <Skeleton className="hidden h-8 w-24 rounded-full md:block" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
