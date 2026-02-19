// src/app/Composition/page.tsx
// PAS DE "use client" ici → c'est un Server Component

import { Suspense } from 'react'
import { getKpiMetrics, type KpiMetrics } from './Compositionqueries'
import { CompositionClient } from './CompositionClient'

export default async function CompositionPage() {
  const [anData, senatData, gouvData] = await Promise.all([
    getKpiMetrics('AN'),
    getKpiMetrics('Senat'),
    getKpiMetrics('Gouvernement'),
  ])

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Composition des institutions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Âge moyen, parité et profils des députés, sénateurs et membres du Gouvernement
        </p>
      </div>

      <Suspense fallback={
        <div className="text-center py-20 text-muted-foreground">
          Chargement des données…
        </div>
      }>
        <CompositionClient anData={anData} senatData={senatData} gouvData={gouvData} />
      </Suspense>
    </div>
  )
}