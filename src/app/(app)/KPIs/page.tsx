// src/app/KPIs/page.tsx

export const revalidate = 3600; // Cache 1h — données mises à jour une fois par nuit

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MonthlyDossiersChart } from '@/components/ui/MonthlyDossiersChart';
import GenericFilter from '@/components/GenericFilter';
import ResetButton from '@/components/ResetButton';
import { GroupeStatsTable } from '@/components/GroupeStatsTable';
import { GroupeBarChart } from '@/components/ui/GroupeBarChart';
import { LegislativeFunnel } from '@/components/ui/LegislativeFunnel';
import { ParlementairesTable } from '@/components/ParlementairesTable';

export default async function KpisPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const t = await getTranslations('kpis');
  const locale = await getLocale();

  // === Extraction du filtre type (exactement comme dans dossiers-legislatifs) ===
  const typeFilter = typeof resolvedParams.type === 'string'
    ? resolvedParams.type.toLowerCase()
    : undefined;

    const groupeFilter = typeof resolvedParams.groupe === 'string'
   ? resolvedParams.groupe.toLowerCase()
   : undefined;



// ────────────────────────────────────────────────
// PARALLÉLISATION : on lance les deux fetches en même temps
// ────────────────────────────────────────────────

// 1. Promesse pour les types (sans await)
const typesPromise = supabase
  .from('dossiers_legislatifs')
  .select('procedure_libelle')
  .not('procedure_libelle', 'is', null);

// 2. Promesse pour les groupes (sans await)
const groupesPromise = supabase
  .from('dossiers_legislatifs')
  .select('initiateur_groupe_libelle')
  .not('initiateur_groupe_libelle', 'is', null);

// 3. Promesse pour les délais par chambre (table actes_legislatifs, globale)
const actesDelaisPromise = supabase
  .from('actes_legislatifs')
  .select('dossier_uid, code_acte, date_acte, statut_conclusion')
  .in('code_acte', [
    'AN1-DEPOT', 'AN2-DEPOT', 'ANLDEF-DEPOT', 'ANLUNI-DEPOT', 'ANNLEC-DEPOT',
    'AN1-DEBATS-DEC', 'AN2-DEBATS-DEC', 'ANLDEF-DEBATS-DEC', 'ANLUNI-DEBATS-DEC', 'ANNLEC-DEBATS-DEC',
    'CMP-DEBATS-AN-DEC',
    'SN1-DEPOT', 'SN2-DEPOT', 'SNNLEC-DEPOT',
    'SN1-DEBATS-DEC', 'SN2-DEBATS-DEC', 'SNNLEC-DEBATS-DEC',
    'CMP-DEBATS-SN-DEC',
  ])
  .not('date_acte', 'is', null);

// 4. Promesse pour le type de chambre des organes (groupes politiques)
const organesChambrePromise = supabase
  .from('organes')
  .select('uid, code_type, libelle_abrege, libelle')
  .in('code_type', ['GP', 'GROUPESENAT', 'GOUVERNEMENT']);

// 5. Textes avec auteurs/rapporteurs pour le classement des parlementaires
const textesImplicationPromise = supabase
  .from('textes')
  .select('auteurs_refs, rapporteurs_refs')
  .or('auteurs_refs.not.is.null,rapporteurs_refs.not.is.null');

// 6. Acteurs parlementaires actuels
const acteursParlemPromise = supabase
  .from('acteurs')
  .select('uid, prenom, nom, groupe, est_depute_actuel, est_senateur_actuel')
  .or('est_depute_actuel.eq.true,est_senateur_actuel.eq.true');

// 7. Application des lois (baromètre AN)
const applicationLoisPromise = supabase
  .from('application_lois')
  .select('dossier_uid, statut_application, delai_max_jours')
  .eq('legislature', 17);

// On attend les SEPT en parallèle
const [typesResult, groupesResult, actesDelaisResult, organesChambreResult, textesImplicationResult, acteursParlemResult, applicationLoisResult] = await Promise.all([typesPromise, groupesPromise, actesDelaisPromise, organesChambrePromise, textesImplicationPromise, acteursParlemPromise, applicationLoisPromise]);


// ────────────────────────────────────────────────
// Traitement des résultats
// ────────────────────────────────────────────────


const toSlug = (str: string) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+$/, '');

const uniqueTypes = [...new Set(typesResult.data?.map(item => item.procedure_libelle) || [])].sort();
const procedureMap: { [key: string]: string } = {};
uniqueTypes.forEach(type => { procedureMap[toSlug(type)] = type; });
const typeOptions = uniqueTypes.map(libelle => ({ slug: toSlug(libelle), libelle }));
const procedure = typeFilter ? procedureMap[typeFilter] : undefined;

const uniqueGroupesLibelles = [...new Set(groupesResult.data?.map(item => item.initiateur_groupe_libelle) || [])].sort();
const groupeMap: { [key: string]: string } = {};
uniqueGroupesLibelles.forEach(libelle => { groupeMap[toSlug(libelle)] = libelle; });
const groupeOptions = uniqueGroupesLibelles.map(libelle => ({ slug: toSlug(libelle), libelle }));
const groupe = groupeFilter ? groupeMap[groupeFilter] : undefined;



const PROCEDURES_PROMULGABLES = new Set([
  'Proposition de loi ordinaire',
  'Projet de loi ordinaire',
  'Projet ou proposition de loi constitutionnelle',
  'Projet ou proposition de loi organique',
  'Projet de ratification des traités et conventions',
  'Projet de loi de finances rectificative',
  'Projet de loi de financement de la sécurité sociale',
  'Projet de loi de finances de l\'année',
]);

// Textes sans vote chambre — exclus des dénominateurs AN et SN
const EXCLUS_TOUS = new Set([
  'Pétitions',
  'Allocution du Président de l\'Assemblée nationale',
  'Commission d\'enquête',
  'Mission d\'information',
  'Rapport d\'information sans mission',
]);

// Textes supplémentaires exclus du dénominateur SN (procédures AN uniquement)
const EXCLUS_SN_SUPPL = new Set([
  'Engagement de la responsabilité gouvernementale',
  'Résolution',
]);

let dossiersData: any[] = [];
let groupeStats: { groupe: string; chambre: string; total: number; total_an: number; total_sn: number; total_promulgables: number; promulgues: number; adoptes_an: number; adoptes_sn: number }[] = [];

let statsData = {
  total_dossiers: 0,
  mois_courant: 0,
  moyenne_mensuelle: 0,
  historique: [] as { mois: string; count: number }[],
  en_cours: 0,
  adoptes_an: 0,
  adoptes_senat: 0,
  adoptes_parlement: 0,
  promulgues: 0,
  rejetes: 0,
  total_promulgables: 0,
  taux_promulgation: 0,
  delai_moyen_jours: 0,
  delai_min_jours: 0,
  delai_max_jours: 0,
  delai_moyen_an_jours: 0,
  delai_min_an_jours: 0,
  delai_max_an_jours: 0,
  delai_moyen_sn_jours: 0,
  delai_min_sn_jours: 0,
  delai_max_sn_jours: 0,
  lois_appliquees: 0,
  taux_application: 0,
  delai_moyen_application_jours: 0,
  delai_min_application_jours: 0,
  delai_max_application_jours: 0,
  nb_lois_avec_decrets: 0,
};

try {
  // ────────────────────────────────────────────────────────────────
  // Construction de la requête de base
  let query = supabase
    .from('dossiers_legislatifs')
    .select('uid, date_depot, statut_final, date_promulgation, procedure_libelle, initiateur_groupe_libelle, initiateur_groupe_uid')
    .not('date_depot', 'is', null)
    .order('date_depot', { ascending: false })
    .limit(10000);

  // Appliquer le filtre sur procedure_libelle SI présent
  if (procedure) {
    query = query.eq('procedure_libelle', procedure);
  }

  if (groupe) {
    query = query.eq('initiateur_groupe_libelle', groupe);
  }

  const { data: dossiers, error } = await query;

  if (error) throw error;

  dossiersData = dossiers || [];
  statsData.total_dossiers = dossiersData.length;

  const now = new Date();
  const moisCourantStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const depotDates = dossiersData
    .map((row: any) => row.date_depot ? new Date(row.date_depot) : null)
    .filter((date): date is Date => date !== null && !isNaN(date.getTime()));

  statsData.mois_courant = depotDates.filter(d => d >= moisCourantStart).length;

  // Map dossier_uid → statut_application (depuis table application_lois)
  const applicationMap = new Map<string, string>(
    (applicationLoisResult.data || [])
      .filter((a: any) => a.dossier_uid)
      .map((a: any) => [a.dossier_uid, a.statut_application])
  );

  // Calcul des statuts
  dossiersData.forEach((d: any) => {
    const statut = d.statut_final?.toLowerCase() || 'inconnu';

    if (statut === 'en_cours' || statut.includes('cours')) statsData.en_cours++;
    else if (statut.includes('an') || statut.includes('assemblée') || statut.includes('assemblee')) statsData.adoptes_an++;
    else if (statut.includes('sénat')) statsData.adoptes_senat++;
    else if (statut.includes('parlement') || statut.includes('navette') || statut === 'adopté') statsData.adoptes_parlement++;
    else if (statut.includes('promulgu') || statut.includes('appliqu')) {
      statsData.promulgues++;
      // Vérifier si la loi est appliquée (statut_final "Appliquée" ou via applicationMap)
      if (statut.includes('appliqu')) {
        statsData.lois_appliquees++;
      } else {
        const statutApp = applicationMap.get(d.uid);
        if (statutApp === 'appliquee' || statutApp === 'application_directe') {
          statsData.lois_appliquees++;
        }
      }
    }
    else if (statut.includes('rejet')) statsData.rejetes++;

    if (PROCEDURES_PROMULGABLES.has(d.procedure_libelle)) statsData.total_promulgables++;
  });

  // Taux de promulgation : promulgués / textes à vocation législative
  statsData.taux_promulgation = statsData.total_promulgables > 0
    ? Math.round(statsData.promulgues * 1000 / statsData.total_promulgables) / 10
    : 0;

  // Taux d'application : lois appliquées / textes à vocation législative (même dénominateur)
  statsData.taux_application = statsData.total_promulgables > 0
    ? Math.round(statsData.lois_appliquees * 1000 / statsData.total_promulgables) / 10
    : 0;

  // Délai moyen promulgation → application complète (lois nécessitant des décrets uniquement)
  const delaisApp = (applicationLoisResult.data || [])
    .filter((a: any) => a.statut_application === 'appliquee')
    .map((a: any) => (a.delai_max_jours ?? 0) as number);
  statsData.nb_lois_avec_decrets = delaisApp.length;
  statsData.delai_moyen_application_jours = delaisApp.length > 0
    ? Math.round(delaisApp.reduce((sum: number, d: number) => sum + d, 0) / delaisApp.length)
    : 0;
  statsData.delai_min_application_jours = delaisApp.length > 0 ? Math.round(Math.min(...delaisApp)) : 0;
  statsData.delai_max_application_jours = delaisApp.length > 0 ? Math.round(Math.max(...delaisApp)) : 0;

  // Délai moyen dépôt → promulgation (en jours)
  const delais = dossiersData
    .filter((d: any) => d.date_promulgation && d.date_depot)
    .map((d: any) => (new Date(d.date_promulgation).getTime() - new Date(d.date_depot).getTime()) / 86400000)
    .filter((j: number) => j > 0);
  statsData.delai_moyen_jours = delais.length > 0 ? Math.round(delais.reduce((a: number, b: number) => a + b, 0) / delais.length) : 0;
  statsData.delai_min_jours = delais.length > 0 ? Math.round(Math.min(...delais)) : 0;
  statsData.delai_max_jours = delais.length > 0 ? Math.round(Math.max(...delais)) : 0;

  // Calcul historique mensuel (inchangé)
  const startDate = new Date(now.getFullYear(), now.getMonth() - 23, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthlyCounts: { [key: string]: number } = {};

  for (let d = new Date(startDate); d < endDate; d.setMonth(d.getMonth() + 1)) {
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[moisKey] = 0;
  }

  depotDates.forEach(d => {
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyCounts[moisKey] !== undefined) monthlyCounts[moisKey]++;
  });

  statsData.historique = Object.entries(monthlyCounts)
    .map(([mois, count]) => ({ mois, count }))
    .sort((a, b) => a.mois.localeCompare(b.mois));

  const totalSur24Mois = statsData.historique.reduce((sum, item) => sum + item.count, 0);
  statsData.moyenne_mensuelle = statsData.historique.length
    ? Math.round(totalSur24Mois / statsData.historique.length)
    : 0;

} catch (error) {
  throw error;
}

// Calcul des délais par chambre (depuis actes_legislatifs)
try {
  const actes = actesDelaisResult.data || [];
  const filteredUids = new Set(dossiersData.map((d: any) => d.uid));
  const depotsAN = new Map<string, Date>();
  const decisionsAN = new Map<string, Date>();
  const depotsSN = new Map<string, Date>();
  const decisionsSN = new Map<string, Date>();
  const adoptesAN = new Set<string>();
  const adoptesSN = new Set<string>();

  // Adoption = tout sauf rejeté/rejetée/désaccord (inclut modifié, 49-3, art.45, définitive art.151-7, etc.)
  const estAdopte = (s: string | null) =>
    !!s && (s.toLowerCase().includes('adopt') || s.toLowerCase().includes('modifi') || s.toLowerCase().includes('définitiv'));

  const isDecisionAN = (code: string) =>
    (code.startsWith('AN') || code === 'CMP-DEBATS-AN-DEC') && code.endsWith('DEBATS-DEC');
  const isDecisionSN = (code: string) =>
    (code.startsWith('SN') || code === 'CMP-DEBATS-SN-DEC') && code.endsWith('DEBATS-DEC');

  for (const acte of actes) {
    if (!filteredUids.has(acte.dossier_uid)) continue;
    const date = new Date(acte.date_acte);
    const { dossier_uid, code_acte, statut_conclusion } = acte;
    if (code_acte.startsWith('AN') && code_acte.endsWith('DEPOT')) {
      if (!depotsAN.has(dossier_uid) || date < depotsAN.get(dossier_uid)!) depotsAN.set(dossier_uid, date);
    } else if (isDecisionAN(code_acte) && estAdopte(statut_conclusion)) {
      if (!decisionsAN.has(dossier_uid) || date < decisionsAN.get(dossier_uid)!) decisionsAN.set(dossier_uid, date);
      adoptesAN.add(dossier_uid);
    } else if (code_acte.startsWith('SN') && code_acte.endsWith('DEPOT')) {
      if (!depotsSN.has(dossier_uid) || date < depotsSN.get(dossier_uid)!) depotsSN.set(dossier_uid, date);
    } else if (isDecisionSN(code_acte) && estAdopte(statut_conclusion)) {
      // DLR5L11N19503 exclu du calcul de délai : dossier déposé en 2000, bloqué 11 ans au Sénat (cas politique unique)
      if (dossier_uid !== 'DLR5L11N19503' && (!decisionsSN.has(dossier_uid) || date < decisionsSN.get(dossier_uid)!)) decisionsSN.set(dossier_uid, date);
      adoptesSN.add(dossier_uid);
    }
  }

  const calcStats = (depots: Map<string, Date>, decisions: Map<string, Date>) => {
    const delais: number[] = [];
    for (const [uid, depot] of depots) {
      const decision = decisions.get(uid);
      if (decision && decision > depot) delais.push((decision.getTime() - depot.getTime()) / 86400000);
    }
    if (delais.length === 0) return { moyenne: 0, min: 0, max: 0 };
    return {
      moyenne: Math.round(delais.reduce((a, b) => a + b, 0) / delais.length),
      min: Math.round(Math.min(...delais)),
      max: Math.round(Math.max(...delais)),
    };
  };

  const sAN = calcStats(depotsAN, decisionsAN);
  statsData.delai_moyen_an_jours = sAN.moyenne;
  statsData.delai_min_an_jours = sAN.min;
  statsData.delai_max_an_jours = sAN.max;

  const sSN = calcStats(depotsSN, decisionsSN);
  statsData.delai_moyen_sn_jours = sSN.moyenne;
  statsData.delai_min_sn_jours = sSN.min;
  statsData.delai_max_sn_jours = sSN.max;

  // Mapping uid organe → chambre
  const organesChambreMap = new Map<string, string>(
    (organesChambreResult.data || []).map(o => [
      o.uid,
      o.code_type === 'GP' ? 'AN' : o.code_type === 'GROUPESENAT' ? 'Sénat' : 'Gouvernement',
    ])
  );

  // Stats par groupe politique (clé = uid, sauf gouvernements tous fusionnés en une seule ligne)
  const gsMap = new Map<string, { groupe: string; chambre: string; total: number; total_an: number; total_sn: number; total_promulgables: number; promulgues: number; adoptes_an: number; adoptes_sn: number }>();
  for (const d of dossiersData) {
    const gUid = d.initiateur_groupe_uid;
    const g = d.initiateur_groupe_libelle;
    if (!g) continue;
    const chambre = gUid ? (organesChambreMap.get(gUid) || 'Autre') : 'Autre';
    const key = chambre === 'Gouvernement' ? 'GOUVERNEMENT' : (gUid || g);
    if (!gsMap.has(key)) gsMap.set(key, {
      groupe: chambre === 'Gouvernement' ? 'Gouvernement' : g,
      chambre,
      total: 0, total_an: 0, total_sn: 0, total_promulgables: 0, promulgues: 0, adoptes_an: 0, adoptes_sn: 0,
    });
    const gs = gsMap.get(key)!;
    const proc = d.procedure_libelle;
    gs.total++;
    if (d.uid && adoptesAN.has(d.uid)) gs.adoptes_an++;
    if (d.uid && adoptesSN.has(d.uid)) gs.adoptes_sn++;
    if (!EXCLUS_TOUS.has(proc)) {
      gs.total_an++;
      if (!EXCLUS_SN_SUPPL.has(proc)) gs.total_sn++;
    }
    if (PROCEDURES_PROMULGABLES.has(proc)) {
      gs.total_promulgables++;
      const sf = d.statut_final?.toLowerCase() || '';
      if (sf.includes('promulgu') || sf.includes('appliqu')) gs.promulgues++;
    }
  }
  groupeStats = [...gsMap.values()]
    .filter(g => g.total >= 10)
    .sort((a, b) => b.total - a.total);
} catch (error) {
  throw error;
}

// ────────────────────────────────────────────────────────────────
// Classement des parlementaires les plus actifs (auteurs + rapporteurs)
// ────────────────────────────────────────────────────────────────
const organesNomMap = new Map<string, string>(
  (organesChambreResult.data || []).map(o => [o.uid, o.libelle || o.libelle_abrege || ''])
);

const auteurCount = new Map<string, number>();
const rappCount = new Map<string, number>();
for (const texte of (textesImplicationResult.data || [])) {
  for (const uid of (texte.auteurs_refs || [])) auteurCount.set(uid, (auteurCount.get(uid) || 0) + 1);
  for (const uid of (texte.rapporteurs_refs || [])) rappCount.set(uid, (rappCount.get(uid) || 0) + 1);
}

const allParlementaires = (acteursParlemResult.data || [])
  .map(a => ({
    nom: `${a.prenom} ${a.nom}`,
    chambre: a.est_depute_actuel ? 'AN' : 'Sénat',
    groupe: organesNomMap.get(a.groupe) || '',
    nb_auteur: auteurCount.get(a.uid) || 0,
    nb_rapporteur: rappCount.get(a.uid) || 0,
    total: (auteurCount.get(a.uid) || 0) + (rappCount.get(a.uid) || 0),
  }))
  .filter(a => a.total > 0)
  .sort((a, b) => b.total - a.total);

// Données graphique
const chartData = statsData.historique.slice(-24).map(({ mois, count }) => {
  const [year, month] = mois.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(year, month - 1));
  return { month: `${monthName}-${year}`, dossiers: count, year };
});


return (
  <div className="container mx-auto p-6 max-w-7xl">
    {/* Titre + filtre en haut – même style que la page dossiers */}
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-3">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">
          {t('pageSubtitle')}
          {procedure && <span className="ml-2 font-medium text-sm text-primary">[ {procedure} ]</span>}
          {groupe && <span className="ml-2 font-medium text-sm text-primary">[ {groupe} ]</span>}
        </p>
      </div>

      {/* Barre de filtres : Type + Groupe + Reset */}
      <div className="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1">
        <GenericFilter
          paramName="type"
          label={t('filterTypeLabel')}
          placeholder={t('filterTypePlaceholder')}
          allLabel={t('filterTypeAll')}
          tooltipTitle={t('filterTypeTooltipTitle')}
          tooltipDescription={t('filterTypeTooltipDesc')}
          options={typeOptions}
        />
        <GenericFilter
          paramName="groupe"
          label={t('filterGroupeLabel')}
          placeholder={t('filterGroupePlaceholder')}
          allLabel={t('filterGroupeAll')}
          tooltipTitle={t('filterGroupeTooltipTitle')}
          tooltipDescription={t('filterGroupeTooltipDesc')}
          options={groupeOptions}
        />
        <ResetButton />
      </div>
    </div>

      {/* Funnel législatif */}
      <div className="mb-6">
        <LegislativeFunnel
          title={t('funnelTitle')}
          description={t('funnelDesc')}
          ofTotalLabel={(rate) => t('ofTotal', { rate })}
          locale={locale}
          steps={[
            { label: t('funnelStep1Label'), count: statsData.total_dossiers, description: t('funnelStep1Desc') },
            { label: t('funnelStep2Label'), count: statsData.total_promulgables, description: t('funnelStep2Desc') },
            { label: t('funnelStep3Label'), count: statsData.adoptes_an + statsData.adoptes_senat + statsData.adoptes_parlement + statsData.promulgues, description: t('funnelStep3Desc') },
            { label: t('funnelStep4Label'), count: statsData.promulgues, description: t('funnelStep4Desc') },
            { label: t('funnelStep5Label'), count: statsData.lois_appliquees, description: t('funnelStep5Desc') },
          ]}
        />
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <Card>
          <CardHeader>
            <CardTitle>{t('cardTotalTitle')}</CardTitle>
            <CardDescription>{t('cardTotalDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {statsData.total_dossiers.toLocaleString(locale)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('cardMonthTitle')}</CardTitle>
            <CardDescription>{t('cardMonthDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {statsData.mois_courant.toLocaleString(locale)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('cardAvgTitle')}</CardTitle>
            <CardDescription>{t('cardAvgDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {statsData.moyenne_mensuelle}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal */}
      <MonthlyDossiersChart
        data={chartData}
        title={t('chartTitle')}
        description={t('chartDescription')}
        tooltipLabel={t('chartTooltipLabel')}
        trendUpTemplate={t('chartTrendUp', { rate: '__RATE__' })}
        trendDownTemplate={t('chartTrendDown', { rate: '__RATE__' })}
        trendStable={t('chartTrendStable')}
        comparisonLabel={t('chartComparison')}
      />

            {/* Nouvelles cartes par statut */}
      <div className="mt-6">
  <h2 className="text-lg font-semibold mb-4">{t('statusSectionTitle')}</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">

    {/* Carte 1 - En traitement */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusEnTraitementTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusEnTraitementDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold">
          {statsData.en_cours.toLocaleString(locale)}
        </div>
      </div>
    </Card>

    {/* Carte 2 - Adoptés par l'Assemblée Nationale */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusAdoptesANTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusAdoptesANDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-[#27AE60]">
          {statsData.adoptes_an.toLocaleString(locale)}
        </div>
      </div>
    </Card>

    {/* Carte 3 - Adoptés par le Sénat */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusAdoptesSNTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusAdoptesSNDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-[#27AE60]">
          {statsData.adoptes_senat.toLocaleString(locale)}
        </div>
      </div>
    </Card>

    {/* Carte 4 - Adoptés par le Parlement */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusAdoptesParlemTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusAdoptesParlemDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-[#27AE60]">
          {statsData.adoptes_parlement.toLocaleString(locale)}
        </div>
      </div>
    </Card>

    {/* Carte 5 - Promulgués */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusPromulguesTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusPromulguesDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-violet-600">
          {statsData.promulgues.toLocaleString(locale)}
        </div>
      </div>
    </Card>

    {/* Carte 6 - Appliquées */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusAppliquéesTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusAppliquéesDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-[#27AE60]">
          {statsData.lois_appliquees.toLocaleString(locale)}
        </div>
      </div>
    </Card>

    {/* Carte 7 - Rejetés */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">{t('statusRejétésTitle')}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          {t('statusRejétésDesc')}
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-[#E74C3C]">
          {statsData.rejetes.toLocaleString(locale)}
        </div>
      </div>
    </Card>

  </div>
</div>

      {/* Efficacité du processus */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">{t('efficiencySectionTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('tauxPromulgationTitle')}</CardTitle>
              <CardDescription>
                {t('tauxPromulgationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-violet-600">
                {statsData.taux_promulgation} %
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('promulgatedCount', { count: statsData.promulgues, total: statsData.total_promulgables })}
              </p>
              <Link href="/documentation/methode#taux-de-promulgation" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                {t('methodologyLink')}
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('tauxApplicationTitle')}</CardTitle>
              <CardDescription>
                {t('tauxApplicationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#27AE60]">
                {statsData.taux_application} %
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('appliedCount', { count: statsData.lois_appliquees, total: statsData.total_promulgables })}
              </p>
              <Link href="/documentation/methode#taux-d-application" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                {t('methodologyLink')}
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('delaiApplicationTitle')}</CardTitle>
              <CardDescription>
                {t('delaiApplicationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#27AE60]">
                {statsData.delai_moyen_application_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('delaiApplicationSubtitle', { count: statsData.nb_lois_avec_decrets })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('minMax', { min: statsData.delai_min_application_jours, max: statsData.delai_max_application_jours })}
              </p>
              <Link href="/documentation/methode#delai-moyen-d-application" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                {t('methodologyLink')}
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('delaiPromulgationTitle')}</CardTitle>
              <CardDescription>
                {t('delaiPromulgationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {statsData.delai_moyen_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('delaiPromulgationSubtitle')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('minMax', { min: statsData.delai_min_jours, max: statsData.delai_max_jours })}
              </p>
              <Link href="/documentation/methode#delai-moyen-de-promulgation" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                {t('methodologyLink')}
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('delaiANTitle')}</CardTitle>
              <CardDescription>
                {t('delaiANDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {statsData.delai_moyen_an_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('delaiANSubtitle')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('minMax', { min: statsData.delai_min_an_jours, max: statsData.delai_max_an_jours })}
              </p>
              <Link href="/documentation/methode#delai-moyen-a-l-assemblee-nationale" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                {t('methodologyLink')}
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('delaiSNTitle')}</CardTitle>
              <CardDescription>
                {t('delaiSNDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#F39C12]">
                {statsData.delai_moyen_sn_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('delaiSNSubtitle')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('minMax', { min: statsData.delai_min_sn_jours, max: statsData.delai_max_sn_jours })}
              </p>

              <Link href="/documentation/methode#delai-moyen-au-senat" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                {t('methodologyLink')}
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Activité par groupe politique */}
      {groupeStats.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">{t('groupeActivityTitle')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GroupeBarChart
              data={groupeStats.map(g => ({ groupe: g.groupe, value: g.total }))}
              title={t('textesProposes')}
              description={t('textesProposesDDesc')}
              color="var(--chart-1)"
              valueLabel={t('textesProposesDLabel')}
              link="/documentation/methode#activite-par-groupe-politique"
            />
            <GroupeBarChart
              data={groupeStats
                .filter(g => g.promulgues > 0)
                .sort((a, b) => b.promulgues - a.promulgues)
                .map(g => ({ groupe: g.groupe, value: g.promulgues }))}
              title={t('loisPromulguees')}
              description={t('loisPromulgueesDesc')}
              color="var(--chart-5)"
              valueLabel={t('loisPromulgueesLabel')}
              link="/documentation/methode#activite-par-groupe-politique"
            />
          </div>
        </div>
      )}

      {/* Taux de succès par groupe politique */}
      {groupeStats.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">{t('successLegislatifTitle')}</h2>
          <p className="text-muted-foreground mb-2">
            {t('successLegislatifDesc')}
          </p>
          <Link href="/documentation/methode#succes-legislatif-par-groupe-politique" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-6 inline-block">
            {t('methodologyLink')}
          </Link>
          <GroupeStatsTable data={groupeStats} />
        </div>
      )}

      {/* Parlementaires les plus actifs */}
      {allParlementaires.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">{t('parlementairesTitle')}</h2>
          <p className="text-muted-foreground mb-2">
            {t('parlementairesDesc')}
          </p>
          <Link href="/documentation/methode#parlementaires-les-plus-actifs" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-6 inline-block">
            {t('methodologyLinkAlt')}
          </Link>
          <ParlementairesTable data={allParlementaires} />
        </div>
      )}
    </div>
  );
}