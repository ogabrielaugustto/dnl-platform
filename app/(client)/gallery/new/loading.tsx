import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="w-full rounded-3xl border border-border bg-card p-8 ">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-6 w-full max-w-3xl" />

        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-end">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 ">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-20 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-10">
            <Skeleton className="h-5 w-56" />
          </div>
        </div>
      </div>
    </section>
  );
}
