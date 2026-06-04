type RouteLoadingProps = {
  area: string;
};

export function RouteLoading({ area }: RouteLoadingProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-10 md:px-8">
      <div className="w-full animate-pulse rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="h-3 w-28 rounded-full bg-muted" />
        <div className="mt-4 h-10 w-64 rounded-full bg-muted" />
        <div className="mt-4 h-4 w-full max-w-xl rounded-full bg-muted" />
        <div className="mt-2 h-4 w-full max-w-lg rounded-full bg-muted" />
        <p className="mt-6 text-sm text-muted-foreground">{area}</p>
      </div>
    </div>
  );
}
