import { Skeleton } from "@/components/ui/skeleton";

function GalleryCardSkeleton() {
  return (
    <Skeleton className="aspect-square w-full rounded-md" />
  );
}

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 pb-28 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="mt-3 h-9 w-full max-w-sm" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
        <Skeleton className="h-9 w-30 rounded-full" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, index) => (
          <GalleryCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
