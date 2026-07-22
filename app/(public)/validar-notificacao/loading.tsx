import { Skeleton } from "@/components/ui/skeleton";

export default function ValidateNotificationLoading() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
      <div className="space-y-5">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-24 w-full max-w-2xl" />
        <Skeleton className="h-44 w-full rounded-md" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-md" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
