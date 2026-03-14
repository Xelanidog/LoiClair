"use client"

import Link from "next/link"
import { Users, Scale, Calendar, User } from "lucide-react"
import { KpiItem, ActeursTable } from "@/components/composition"
import type { KpiMetrics } from '@/app/(app)/Composition/Compositionqueries'

export function GouvernementClient({ data }: { data: KpiMetrics }) {
  return (
    <div className="container mx-auto p-4 sm:p-6" style={{ maxWidth: '64rem' }}>

      {/* Header pédagogique */}
      <div className="mb-8">
        <h1
          className="font-bold text-foreground mb-2"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.2 }}
        >
          Gouvernement
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mb-3">
          Le Gouvernement conduit et détermine la politique de la Nation.
          Il est responsable devant l'Assemblée nationale.
        </p>
        <Link
          href="/processus-legislatif"
          className="text-sm font-medium hover:underline"
          style={{ color: "oklch(0.55 0.28 320)" }}
        >
          Comprendre le processus législatif →
        </Link>
      </div>

      {/* Section KPIs */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
            Qui sont les membres du Gouvernement ?
          </h2>
          <Link
            href="/documentation/methode#parite-femmes"
            className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Comment c'est calculé
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          <KpiItem
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            title="Membres"
            value={data.membres}
            animate
            delay={0.1}
          />
          <KpiItem
            icon={<Scale className="h-5 w-5 text-muted-foreground" />}
            title="Parité femmes"
            value={data.pariteFemmes}
            animate
            delay={0.2}
          />
          <KpiItem
            icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
            title="Âge moyen"
            value={data.ageMoyen}
            animate
            delay={0.3}
          />
          <KpiItem
            icon={<User className="h-5 w-5 text-muted-foreground" />}
            title="Plus jeune"
            value={data.plusJeune?.age ?? null}
            animate
            delay={0.4}
            extraContent={
              data.plusJeune ? (
                <span className="text-xs text-muted-foreground">{data.plusJeune.nom}</span>
              ) : undefined
            }
          />
          <KpiItem
            icon={<User className="h-5 w-5 text-muted-foreground" />}
            title="Plus âgé"
            value={data.plusAge?.age ?? null}
            animate
            delay={0.5}
            extraContent={
              data.plusAge ? (
                <span className="text-xs text-muted-foreground">{data.plusAge.nom}</span>
              ) : undefined
            }
          />
        </div>
      </section>

      {/* Section liste des membres */}
      <section>
        <ActeursTable acteurs={data.acteursList} showVoteStats={false} />
      </section>

    </div>
  )
}
