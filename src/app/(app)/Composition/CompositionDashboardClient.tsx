// src/app/Composition/CompositionDashboardClient.tsx
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Briefcase, Users, Scale, Calendar, ArrowRight } from "lucide-react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { GroupPieChart } from "@/components/composition"
import type { DashboardKpis } from './Compositionqueries'

interface Props {
  an: DashboardKpis
  senat: DashboardKpis
  gouv: DashboardKpis
}

export function CompositionDashboardClient({ an, senat, gouv }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <InstitutionCard
        title="Assemblée nationale"
        subtitle="577 députés"
        href="/organes/assemblee"
        icon={<Building2 className="h-5 w-5" />}
        data={an}
        membreLabel="Députés"
      />
      <InstitutionCard
        title="Sénat"
        subtitle="348 sénateurs"
        href="/organes/senat"
        icon={<Building2 className="h-5 w-5" />}
        data={senat}
        membreLabel="Sénateurs"
      />
      <InstitutionCard
        title="Gouvernement"
        subtitle="Pouvoir exécutif"
        href="/organes/gouvernement"
        icon={<Briefcase className="h-5 w-5" />}
        data={gouv}
        membreLabel="Membres"
        showPieChart={false}
      />
    </div>
  )
}

function InstitutionCard({
  title,
  subtitle,
  href,
  icon,
  data,
  membreLabel,
  showPieChart = true,
}: {
  title: string
  subtitle: string
  href: string
  icon: React.ReactNode
  data: DashboardKpis
  membreLabel: string
  showPieChart?: boolean
}) {
  if (data.membres === 0) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground py-10">
          Données indisponibles
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-muted-foreground">{icon}</span>
          <h2 className="font-bold" style={{ fontSize: '1.125rem' }}>{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{subtitle}</p>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <MiniKpi label="Membres" value={data.membres} />
          <MiniKpi label="Parité femmes" value={data.pariteFemmes} suffix=" %" />
          <MiniKpi label="Âge moyen" value={data.ageMoyen} suffix=" ans" />
          {data.nombreGroupes !== null && (
            <MiniKpi label="Groupes" value={data.nombreGroupes} />
          )}
        </div>

        {/* Mini pie chart */}
        {showPieChart && data.groupes && data.groupes.length > 0 && (
          <div className="mb-5 -mx-2">
            <GroupPieChart data={data.groupes} membres={data.membres} membreLabel={membreLabel} />
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Explorer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniKpi({
  label,
  value,
  suffix = '',
}: {
  label: string
  value: number | null
  suffix?: string
}) {
  if (value === null) return null
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
      <span style={{ fontSize: '1.25rem' }}>
        <AnimatedNumber
          value={value}
          decimals={0}
          suffix={suffix}
          className="font-bold text-foreground"
        />
      </span>
    </div>
  )
}
