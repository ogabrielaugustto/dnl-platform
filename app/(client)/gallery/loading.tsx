import { Skeleton } from "@/components/ui/skeleton";

function GalleryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-4 h-11 w-full max-w-md" />
            <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
            <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
          </div>

          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-30 rounded-full" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <GalleryCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
