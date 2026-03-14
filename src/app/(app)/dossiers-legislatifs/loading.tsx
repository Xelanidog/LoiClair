import { Skeleton } from '@/components/ui/skeleton';

export default function DossiersLoading() {
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Titre */}
      <div className="mb-8">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <Skeleton className="h-3 w-64 mb-8" />

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>

      <Skeleton className="h-4 w-32 mb-4" />

      {/* Cartes */}
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <div className="p-5 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-full max-w-sm" />
              <div className="pt-3 border-t border-border flex gap-3">
                <Skeleton className="h-6 w-40 rounded-full" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
