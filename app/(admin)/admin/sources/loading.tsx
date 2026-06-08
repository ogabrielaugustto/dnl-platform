import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSourcesLoading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-8 md:px-8">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-lg" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </section>
  );
}
