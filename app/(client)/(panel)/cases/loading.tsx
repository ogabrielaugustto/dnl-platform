import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <div className="border-b border-border pb-4">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="mt-3 h-8 w-full max-w-sm rounded-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-2 h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 rounded-lg" />
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <div className="hidden grid-cols-[220px_minmax(260px,1fr)_170px_130px_250px] gap-4 xl:grid">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-20" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-5 px-5 py-5 xl:grid-cols-[220px_minmax(260px,1fr)_170px_130px_250px]"
              >
                {Array.from({ length: 5 }).map((__, cellIndex) => (
                  <div key={cellIndex}>
                    <Skeleton className="h-4 w-full max-w-[12rem]" />
                    <Skeleton className="mt-2 h-3 w-full max-w-[10rem]" />
                    {cellIndex < 2 ? <Skeleton className="mt-2 h-3 w-full max-w-[14rem]" /> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-4">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
