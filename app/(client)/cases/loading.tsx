import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <div className="border-b border-border pb-4">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="mt-3 h-8 w-full max-w-sm rounded-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex gap-3">
              <Skeleton className="size-16 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
                <Skeleton className="mt-4 h-6 w-48 rounded-full" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <Skeleton key={cardIndex} className="h-16 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
