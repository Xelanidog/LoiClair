// src/app/Composition/page.tsx
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Briefcase, Calendar, Scale, User, Users } from "lucide-react";

import { getKpiMetrics, type KpiMetrics } from './Compositionqueries';

export default async function CompositionPage() {
  const [anData, senatData, gouvData] = await Promise.all([
    getKpiMetrics('AN'),
    getKpiMetrics('Senat'),
    getKpiMetrics('Gouvernement'),
  ]);

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
        <div className="space-y-16 md:space-y-20 lg:space-y-24">
          <InstitutionCard title="Assemblée Nationale" icon={<Building2 className="h-6 w-6" />} data={anData} />
          <InstitutionCard title="Sénat" icon={<Building2 className="h-6 w-6" />} data={senatData} />
          <InstitutionCard title="Gouvernement" icon={<Briefcase className="h-6 w-6" />} data={gouvData} />
        </div>
      </Suspense>
    </div>
  );
}

function InstitutionCard({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: KpiMetrics;
}) {
  if (data.membres === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">{icon} {title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-10">
          Données indisponibles pour le moment
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-m">
<CardHeader className="border-b border-border/50 bg-muted/50 px-6 py-5 flex items-center justify-start gap-3 w-full">
        <CardTitle className="flex items-center gap-3 m-0 p-0">
    {icon}
    {title}
  </CardTitle >
      </CardHeader>

     <CardContent className="px-6 pb-10">
  {/* Ligne 1 : Membres + Parité */}
  <div className="flex justify-left items-start gap-10 md:gap-12 mb-5">
    <KpiItem
      icon={<Users className="h-5 w-5 text-muted-foreground" />}
      title="Membres"
      value={data.membres.toLocaleString('fr-FR')}
    />
    <KpiItem
      icon={<Scale className="h-5 w-5 text-muted-foreground" />}
      title="Parité femmes"
      value={data.pariteFemmes !== null ? `${data.pariteFemmes}%` : '—'}
    />
  </div>

  {/* Ligne 2 : Âges */}
  <div className="flex justify-left items-start gap-10 md:gap-12">
    <KpiItem
      icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
      title="Âge moyen"
      value={data.ageMoyen !== null ? `${data.ageMoyen} ans` : '—'}
    />
    <KpiItem
      icon={<User className="h-5 w-5 text-muted-foreground" />}
      title="Le plus jeune"
      value={data.plusJeune ? `${data.plusJeune.age} ans – ${data.plusJeune.nom}` : '—'}
    />
    <KpiItem
      icon={<User className="h-5 w-5 text-muted-foreground" />}
      title="Le plus âgé"
      value={data.plusAge ? `${data.plusAge.age} ans – ${data.plusAge.nom}` : '—'}
    />
  </div>
</CardContent>
    </Card>
  );
}

function KpiItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="text-left min-w-[110px] sm:min-w-[130px] space-y-1">
      <div className="flex justify-left mb-2 opacity-80">{icon}</div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {title}
      </div>
      <div className="text-m tracking-tight">
        {value}
      </div>
    </div>
  );
}