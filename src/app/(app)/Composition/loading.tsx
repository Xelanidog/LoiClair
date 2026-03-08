import { Skeleton } from '@/components/ui/skeleton';

export default function CompositionLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Titre */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-3" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Grille de KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Graphique */}
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
