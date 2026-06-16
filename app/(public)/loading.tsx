export default function PublicLoading() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto size-12 animate-pulse rounded-full bg-slate-950/10" />
        <p className="text-sm text-slate-500">Carregando página...</p>
      </div>
    </div>
  );
}
