// src/app/Composition/CompositionClient.tsx
"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Briefcase, Calendar, Scale, Users, Group, User, UserX, TrendingUp, TrendingDown } from "lucide-react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import type { KpiMetrics } from './Compositionqueries'
import { KpiItem, GroupPieChart, GroupesTable, ActeursTable } from "@/components/composition"

interface Props {
  data: KpiMetrics
  title: string
  icon: React.ReactNode
}

export function CompositionClient({ data, title, icon }: Props) {
  return (
    <InstitutionCard
      title={title}
      icon={icon}
      data={data}
    />
  )
}

function InstitutionCard({
  title,
  icon,
  data,
}: {
  title: string
  icon: React.ReactNode
  data: KpiMetrics
}) {
  if (data.membres === 0) {
    return (
      <Card>
        <CardContent className="text-center text-muted-foreground py-10">
          Données indisponibles pour le moment
        </CardContent>
      </Card>
    )
  }

  const membreLabel = title === "Assemblée Nationale"
    ? "Députés"
    : title === "Sénat"
      ? "Sénateurs"
      : "Membres"

  return (
    <Card className="overflow-hidden border-0 shadow-none rounded-md">
      <CardContent className="px-4 pb-4">

        {/* Ligne 1 : Membres + Parité */}
        <div className="flex flex-wrap justify-start items-start mb-8">
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
        <Link href="/documentation/methode#parite-femmes" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors -mt-6 mb-4 inline-block">
          Comment c'est calculé →
        </Link>

        {/* Ligne 2 : Âges */}
        <div className="flex flex-wrap justify-left items-start mb-8">
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

        {/* Ligne 3 : Participation aux scrutins (AN uniquement) */}
        {data.scrutinStats && (() => {
          const pct = (n: number | null, eligible: number | null) => n !== null && eligible
            ? <AnimatedNumber value={Math.round(n / eligible * 100)} decimals={0} suffix=" %" className="font-medium text-foreground" />
            : undefined
          const eligOrd = data.scrutinStats.ordinaire.avgEligible
          const eligImp = data.scrutinStats.important.avgEligible
          return (
            <div className="flex flex-col gap-4 pb-4 mt-2">
              <div className="flex flex-wrap justify-start items-start gap-6">
                <KpiItem
                  icon={<Users className="h-5 w-5 text-muted-foreground" />}
                  title="Votants moy. (scrutins ordinaires)"
                  value={data.scrutinStats.ordinaire.avgVotants}
                  animate={true}
                  decimals={0}
                  extraContent={pct(data.scrutinStats.ordinaire.avgVotants, eligOrd)}
                />
                <KpiItem
                  icon={<UserX className="h-5 w-5 text-muted-foreground" />}
                  title="Absents moy. (scrutins ordinaires)"
                  value={data.scrutinStats.ordinaire.avgAbsents}
                  animate={true}
                  decimals={0}
                  extraContent={pct(data.scrutinStats.ordinaire.avgAbsents, eligOrd)}
                />
              </div>
              <div className="flex flex-wrap justify-start items-start gap-6">
                <KpiItem
                  icon={<Users className="h-5 w-5 text-muted-foreground" />}
                  title="Votants moy. (scrutins importants)"
                  value={data.scrutinStats.important.avgVotants}
                  animate={true}
                  decimals={0}
                  extraContent={pct(data.scrutinStats.important.avgVotants, eligImp)}
                />
                <KpiItem
                  icon={<UserX className="h-5 w-5 text-muted-foreground" />}
                  title="Absents moy. (scrutins importants)"
                  value={data.scrutinStats.important.avgAbsents}
                  animate={true}
                  decimals={0}
                  extraContent={pct(data.scrutinStats.important.avgAbsents, eligImp)}
                />
              </div>
            </div>
          )
        })()}
        {data.scrutinStats && (
          <Link href="/documentation/methode#participation-moyenne-aux-scrutins" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors -mt-2 mb-4 inline-block">
            Comment c'est calculé →
          </Link>
        )}

        {/* Ligne 5 : extremes individuels */}
        {(data.meilleurePresence !== null || data.meilleureCohesion !== null) && (
          <div className="flex flex-wrap justify-start items-start pb-4 gap-6 mt-2">
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
        )}
        {(data.meilleurePresence !== null || data.meilleureCohesion !== null) && (
          <span className="text-xs text-muted-foreground/60 -mt-2 mb-4 inline-flex gap-3">
            <Link href="/documentation/methode#taux-de-participation-aux-votes" className="hover:text-foreground transition-colors">
              Participation : comment c'est calculé →
            </Link>
            <Link href="/documentation/methode#taux-de-cohesion" className="hover:text-foreground transition-colors">
              Cohésion : comment c'est calculé →
            </Link>
          </span>
        )}

        {/* Pie chart – AN et Sénat */}
        {(title === "Assemblée Nationale" || title === "Sénat")
          && data.groupes
          && data.groupes.length > 0 && (
          <div className="mt-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-center mb-4">
              Répartition par groupe politique
            </h3>
            <GroupPieChart data={data.groupes} membres={data.membres} membreLabel={membreLabel} />
          </div>
        )}

        {/* Tableau des groupes politiques */}
        {data.groupesList.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <GroupesTable groupes={data.groupesList} />
          </div>
        )}

        {/* Tableau des acteurs */}
        {data.acteursList.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <ActeursTable acteurs={data.acteursList} showVoteStats={data.groupesList.length > 0} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
