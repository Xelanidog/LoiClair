"use client"

import Link from "next/link"
import { Users, Scale, Group, Calendar, User, UserX, TrendingUp, TrendingDown } from "lucide-react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import { KpiItem, GroupPieChart, GroupesTable, ActeursTable } from "@/components/composition"
import type { KpiMetrics } from '@/app/(app)/Composition/Compositionqueries'

interface Props {
  data: KpiMetrics
}

export function AssembleeClient({ data }: Props) {
  const pct = (n: number | null, eligible: number | null) =>
    n !== null && eligible
      ? <AnimatedNumber value={Math.round(n / eligible * 100)} decimals={0} suffix=" %" className="font-medium text-foreground" />
      : undefined

  return (
    <div className="container mx-auto p-4 sm:p-6" style={{ maxWidth: '64rem' }}>

      {/* ── Header pédagogique ── */}
      <header className="mb-8">
        <h1 className="font-bold tracking-tight mb-1" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
          Assemblée nationale
        </h1>
        <p className="text-muted-foreground mb-3" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
          577 députés élus au suffrage universel direct pour 5 ans.
          Ils votent la loi et contrôlent le gouvernement.
        </p>
        <Link
          href="/processus-legislatif"
          className="text-sm font-medium hover:underline"
          style={{ color: 'oklch(0.55 0.28 320)' }}
        >
          Comprendre le rôle de l'Assemblée dans le processus législatif →
        </Link>
      </header>

      {/* ── Section 1 : Qui sont les députés ? ── */}
      <section className="mb-10">
        <h2 className="font-bold mb-5" style={{ fontSize: '1.25rem' }}>
          Qui sont les députés ?
        </h2>

        <div className="flex flex-wrap gap-6 mb-4">
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
        <Link
          href="/documentation/methode#parite-femmes"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block mb-6"
          style={{ opacity: 0.6 }}
        >
          Parité : comment c'est calculé →
        </Link>

        <div className="flex flex-wrap gap-6">
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
      </section>

      {/* ── Section 2 : Comment votent-ils ? ── */}
      {data.scrutinStats && (
        <section className="mb-10 pt-8 border-t">
          <h2 className="font-bold mb-5" style={{ fontSize: '1.25rem' }}>
            Comment votent-ils ?
          </h2>

          {/* Scrutins ordinaires */}
          <div className="flex flex-wrap gap-6 mb-4">
            <KpiItem
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              title="Votants moy. (scrutins ordinaires)"
              value={data.scrutinStats.ordinaire.avgVotants}
              animate={true}
              decimals={0}
              extraContent={pct(data.scrutinStats.ordinaire.avgVotants, data.scrutinStats.ordinaire.avgEligible)}
            />
            <KpiItem
              icon={<UserX className="h-5 w-5 text-muted-foreground" />}
              title="Absents moy. (scrutins ordinaires)"
              value={data.scrutinStats.ordinaire.avgAbsents}
              animate={true}
              decimals={0}
              extraContent={pct(data.scrutinStats.ordinaire.avgAbsents, data.scrutinStats.ordinaire.avgEligible)}
            />
          </div>

          {/* Scrutins importants */}
          <div className="flex flex-wrap gap-6 mb-4">
            <KpiItem
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              title="Votants moy. (scrutins importants)"
              value={data.scrutinStats.important.avgVotants}
              animate={true}
              decimals={0}
              extraContent={pct(data.scrutinStats.important.avgVotants, data.scrutinStats.important.avgEligible)}
            />
            <KpiItem
              icon={<UserX className="h-5 w-5 text-muted-foreground" />}
              title="Absents moy. (scrutins importants)"
              value={data.scrutinStats.important.avgAbsents}
              animate={true}
              decimals={0}
              extraContent={pct(data.scrutinStats.important.avgAbsents, data.scrutinStats.important.avgEligible)}
            />
          </div>

          <Link
            href="/documentation/methode#participation-moyenne-aux-scrutins"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block mb-6"
            style={{ opacity: 0.6 }}
          >
            Comment c'est calculé →
          </Link>

          {/* Extrêmes individuels */}
          {(data.meilleurePresence !== null || data.meilleureCohesion !== null) && (
            <>
              <div className="flex flex-wrap gap-6 mb-4">
                <KpiItem
                  icon={<TrendingUp className="h-5 w-5 text-[#27AE60]" />}
                  title="Meilleure participation"
                  value={data.meilleurePresence?.valeur ?? null}
                  extraContent={data.meilleurePresence?.nom}
                  animate={true}
                  decimals={1}
                  suffix=" %"
                />
                <KpiItem
                  icon={<TrendingDown className="h-5 w-5 text-[#E74C3C]" />}
                  title="Moindre participation"
                  value={data.pirePresence?.valeur ?? null}
                  extraContent={data.pirePresence?.nom}
                  animate={true}
                  decimals={1}
                  suffix=" %"
                />
                <KpiItem
                  icon={<TrendingUp className="h-5 w-5 text-[#27AE60]" />}
                  title="Meilleure part. (importants)"
                  value={data.meilleurePresenceImportants?.valeur ?? null}
                  extraContent={data.meilleurePresenceImportants?.nom}
                  animate={true}
                  decimals={1}
                  suffix=" %"
                />
                <KpiItem
                  icon={<TrendingDown className="h-5 w-5 text-[#E74C3C]" />}
                  title="Moindre part. (importants)"
                  value={data.pirePresenceImportants?.valeur ?? null}
                  extraContent={data.pirePresenceImportants?.nom}
                  animate={true}
                  decimals={1}
                  suffix=" %"
                />
                <KpiItem
                  icon={<TrendingUp className="h-5 w-5 text-[#27AE60]" />}
                  title="Meilleure cohésion"
                  value={data.meilleureCohesion?.valeur ?? null}
                  extraContent={data.meilleureCohesion?.nom}
                  animate={true}
                  decimals={1}
                  suffix=" %"
                />
                <KpiItem
                  icon={<TrendingDown className="h-5 w-5 text-[#E74C3C]" />}
                  title="Moindre cohésion"
                  value={data.pireCohesion?.valeur ?? null}
                  extraContent={data.pireCohesion?.nom}
                  animate={true}
                  decimals={1}
                  suffix=" %"
                />
              </div>
              <span className="text-xs text-muted-foreground inline-flex flex-wrap gap-3 mb-2" style={{ opacity: 0.6 }}>
                <Link href="/documentation/methode#taux-de-participation-aux-votes" className="hover:text-foreground transition-colors">
                  Participation : comment c'est calculé →
                </Link>
                <Link href="/documentation/methode#taux-de-cohesion" className="hover:text-foreground transition-colors">
                  Cohésion : comment c'est calculé →
                </Link>
              </span>
            </>
          )}
        </section>
      )}

      {/* ── Section 3 : Les groupes politiques ── */}
      {data.groupes && data.groupes.length > 0 && (
        <section className="mb-10 pt-8 border-t">
          <h2 className="font-bold mb-5" style={{ fontSize: '1.25rem' }}>
            Les groupes politiques
          </h2>
          <GroupPieChart data={data.groupes} membres={data.membres} membreLabel="Députés" />
          {data.groupesList.length > 0 && (
            <div className="mt-6">
              <GroupesTable groupes={data.groupesList} showVoteColumns={true} />
            </div>
          )}
        </section>
      )}

      {/* ── Section 4 : Liste des députés ── */}
      {data.acteursList.length > 0 && (
        <section className="mb-10 pt-8 border-t">
          <h2 className="font-bold mb-5" style={{ fontSize: '1.25rem' }}>
            Liste des députés
          </h2>
          <ActeursTable acteurs={data.acteursList} showVoteStats={true} />
        </section>
      )}

    </div>
  )
}
