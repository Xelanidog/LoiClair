import { Skeleton } from '@/components/ui/skeleton';

export default function KpisLoading() {
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Titre + filtres */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* 3 cartes synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>

      {/* Graphique */}
      <Skeleton className="h-64 w-full rounded-xl mb-6" />

      {/* État des dossiers — 6 cartes */}
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Efficacité — 4 cartes */}
      <Skeleton className="h-6 w-52 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-10 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
