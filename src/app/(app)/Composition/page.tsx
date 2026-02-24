// src/app/Composition/page.tsx
// PAS DE "use client" ici → c'est un Server Component

import { Suspense } from 'react'
import { getKpiMetrics, type KpiMetrics } from './Compositionqueries'
import { CompositionClient } from './CompositionClient'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Building2, Briefcase } from "lucide-react"
import { motion } from "framer-motion";

export default async function CompositionPage() {
  const [anData, senatData, gouvData] = await Promise.all([
    getKpiMetrics('AN'),
    getKpiMetrics('Senat'),
    getKpiMetrics('Gouvernement'),
  ])

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 max-w-7xl">
          <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Composition des institutions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Âge moyen, parité et profils des députés, sénateurs et membres du Gouvernement
        </p>
      </div>

      <Tabs defaultValue="an" className="w-full flex flex-col gap-5">
  <TabsList variant="default" className="gap-2 sm:gap-5 rounded-xl flex-wrap h-auto" >
    <TabsTrigger value="an" className="px-2 sm:px-6 rounded-xl text-sm sm:text-base">Assemblée Nationale</TabsTrigger>
    <TabsTrigger value="senat" className="px-2 sm:px-6 rounded-xl text-sm sm:text-base">Sénat</TabsTrigger>
    <TabsTrigger value="gouv" className="px-2 sm:px-6 rounded-xl text-sm sm:text-base">Gouvernement</TabsTrigger>
  </TabsList>

        <Suspense fallback={
          <div className="text-center py-20 text-muted-foreground">
            Chargement des données…
          </div>
        }>
          <TabsContent value="an">
            <CompositionClient data={anData} title="Assemblée Nationale" icon={<Building2 className="h-5 w-5" />} />
          </TabsContent>

          <TabsContent value="senat">
            <CompositionClient data={senatData} title="Sénat" icon={<Building2 className="h-5 w-5" />} />
          </TabsContent>

          <TabsContent value="gouv">
            <CompositionClient data={gouvData} title="Gouvernement" icon={<Briefcase className="h-5 w-5" />} />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  )
}