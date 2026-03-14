"use client"

import Link from "next/link"
import { Users, Scale, Group, Calendar, User } from "lucide-react"
import { KpiItem, GroupPieChart, GroupesTable, ActeursTable } from "@/components/composition"
import type { KpiMetrics } from '@/app/(app)/Composition/Compositionqueries'

export function SenatClient({ data }: { data: KpiMetrics }) {
  return (
    <div className="container mx-auto p-4 sm:p-6" style={{ maxWidth: '64rem' }}>

      {/* Header pédagogique */}
      <div className="mb-8">
        <h1 className="font-bold tracking-tight mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
          Sénat
        </h1>
        <p className="text-muted-foreground mb-3" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
          348 sénateurs élus au suffrage universel indirect pour 6 ans.
          Le Sénat assure la représentation des collectivités territoriales.
        </p>
        <Link
          href="/processus-legislatif"
          className="text-sm font-medium hover:underline"
          style={{ color: 'oklch(0.55 0.28 320)' }}
        >
          Comprendre le rôle du Sénat dans le processus législatif →
        </Link>
      </div>

      {/* Section : Qui sont les sénateurs ? */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-6">Qui sont les sénateurs ?</h2>

        {data.membres === 0 ? (
          <p className="text-muted-foreground">Données indisponibles pour le moment.</p>
        ) : (
          <>
            {/* Ligne 1 : Membres, Parité, Groupes */}
            <div className="flex flex-wrap gap-6 mb-8">
              <KpiItem
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                title="Membres"
                value={data.membres}
                animate={true}
                decimals={0}
              />
              <KpiItem
                icon={<Scale className="h-5 w-5 text-muted-foreground" />}
                title="Parité femmes"
                value={data.pariteFemmes}
                animate={true}
                decimals={0}
              />
              {data.nombreGroupes !== null && data.nombreGroupes > 0 && (
                <KpiItem
                  icon={<Group className="h-5 w-5 text-muted-foreground" />}
                  title="Groupes"
                  value={data.nombreGroupes}
                  animate={true}
                  decimals={0}
                  delay={0.3}
                />
              )}
            </div>

            {/* Ligne 2 : Âges */}
            <div className="flex flex-wrap gap-6 mb-4">
              <KpiItem
                icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
                title="Âge moyen"
                value={data.ageMoyen}
                animate={true}
                decimals={0}
              />
              <KpiItem
                icon={<User className="h-5 w-5 text-muted-foreground" />}
                title="Le plus jeune"
                value={data.plusJeune?.age ?? '—'}
                animate={!!data.plusJeune}
                decimals={0}
                extraContent={data.plusJeune?.nom}
              />
              <KpiItem
                icon={<User className="h-5 w-5 text-muted-foreground" />}
                title="Le plus âgé"
                value={data.plusAge?.age ?? '—'}
                animate={!!data.plusAge}
                decimals={0}
                extraContent={data.plusAge?.nom}
              />
            </div>

            <Link
              href="/documentation/methode#parite-femmes"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block mb-2"
              style={{ opacity: 0.6 }}
            >
              Comment c'est calculé →
            </Link>
          </>
        )}
      </section>

      {/* Section : Les groupes politiques */}
      {data.groupes && data.groupes.length > 0 && (
        <section className="mb-10 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-6">Les groupes politiques</h2>
          <GroupPieChart
            data={data.groupes}
            membres={data.membres}
            membreLabel="Sénateurs"
          />
          {data.groupesList.length > 0 && (
            <div className="mt-6">
              <GroupesTable groupes={data.groupesList} showVoteColumns={false} />
            </div>
          )}
        </section>
      )}

      {/* Section : Liste des sénateurs */}
      {data.acteursList.length > 0 && (
        <section className="mb-10 pt-6 border-t">
          <h2 className="text-xl font-semibold mb-6">Liste des sénateurs</h2>
          <ActeursTable acteurs={data.acteursList} showVoteStats={false} />
        </section>
      )}

    </div>
  )
}
