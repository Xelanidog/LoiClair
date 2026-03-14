// src/app/Composition/page.tsx — Dashboard comparatif des institutions
export const revalidate = 3600

import Link from "next/link"
import { getDashboardKpis } from './Compositionqueries'
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Briefcase, Scale as ScaleIcon, ArrowRight } from "lucide-react"
import { CompositionDashboardClient } from './CompositionDashboardClient'

export const metadata = {
  title: "Composition des institutions — LoiClair",
  description: "Vue d'ensemble de la composition de l'Assemblée nationale, du Sénat et du Gouvernement.",
}

export default async function CompositionPage() {
  const [anData, senatData, gouvData] = await Promise.all([
    getDashboardKpis('AN'),
    getDashboardKpis('Senat'),
    getDashboardKpis('Gouvernement'),
  ])

  return (
    <div className="container mx-auto p-4 sm:p-6" style={{ maxWidth: '80rem' }}>
      <div className="mb-8">
        <h1 className="font-bold tracking-tight mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
          Composition des institutions
        </h1>
        <p className="text-muted-foreground" style={{ fontSize: '1rem' }}>
          Vue d'ensemble de l'Assemblée nationale, du Sénat et du Gouvernement
        </p>
      </div>

      <CompositionDashboardClient an={anData} senat={senatData} gouv={gouvData} />
    </div>
  )
}
