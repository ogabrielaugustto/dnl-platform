import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 px-4 py-6 md:px-8">
      <div className="border-b border-border pb-4">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="mt-4 h-8 w-full max-w-sm rounded-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="min-h-80 rounded-xl" />
            <Skeleton className="min-h-80 rounded-xl" />
          </div>
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="min-h-[28rem] rounded-xl" />
        </div>

        <div className="space-y-4">
          <Skeleton className="min-h-[32rem] rounded-xl" />
          <Skeleton className="min-h-52 rounded-xl" />
        </div>
      </div>
    </section>
  );
}
