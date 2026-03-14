import { Skeleton } from '@/components/ui/skeleton';

export default function ResumeIALoading() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4">
        <Skeleton className="h-3 w-24" />
        <span className="text-xs text-muted-foreground" style={{ opacity: 0.4 }}>/</span>
        <Skeleton className="h-3 w-28" />
      </div>
      {/* Titre */}
      <div className="rounded-xl px-0 pt-0 pb-4 md:pb-6 mb-6">
        <Skeleton className="h-6 w-3/4 md:w-1/2" />
        <Skeleton className="h-3 w-40 mt-2" />
      </div>

      {/* Résumé IA */}
      <section className="mb-8">
        <Skeleton className="h-4 w-32 mb-3" />
        <div
          style={{
            padding: '1px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(218,165,32,0.15), rgba(218,165,32,0.02) 30%, rgba(218,165,32,0.02) 70%, rgba(218,165,32,0.15))',
          }}
        >
          <div className="bg-background px-4 pt-5 pb-5 space-y-4" style={{ borderRadius: '15px' }}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3 w-28" />
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '16px', paddingTop: '12px' }}>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </section>

      {/* À propos */}
      <section className="mb-8">
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-3 w-20 shrink-0" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-8">
        <Skeleton className="h-4 w-44 mb-3" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
