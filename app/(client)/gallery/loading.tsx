import { Skeleton } from "@/components/ui/skeleton";

function GalleryCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 ">
      <Skeleton className="aspect-square w-full rounded-md" />
      <div className="mt-2.5 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4/5" />
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
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="mt-3 h-9 w-full max-w-md" />
          <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
        </div>

        <Skeleton className="h-8 w-36 rounded-md" />
      </header>

      <div className="rounded-lg border border-border bg-card px-3 py-3 ">
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
