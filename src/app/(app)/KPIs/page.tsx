// src/app/KPIs/page.tsx

'use server';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MonthlyDossiersChart } from '@/components/ui/MonthlyDossiersChart';
import GenericFilter from '@/components/GenericFilter';
import ResetButton from '@/components/ResetButton';
import { GroupeStatsTable } from '@/components/GroupeStatsTable';
import { GroupeBarChart } from '@/components/ui/GroupeBarChart';
import { ParlementairesTable } from '@/components/ParlementairesTable';

export default async function KpisPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedParams = await searchParams;

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

// On attend les SIX en parallèle
const [typesResult, groupesResult, actesDelaisResult, organesChambreResult, textesImplicationResult, acteursParlemResult] = await Promise.all([typesPromise, groupesPromise, actesDelaisPromise, organesChambrePromise, textesImplicationPromise, acteursParlemPromise]);


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

  // Calcul des statuts
  dossiersData.forEach((d: any) => {
    const statut = d.statut_final?.toLowerCase() || 'inconnu';

    if (statut === 'en_cours' || statut.includes('cours')) statsData.en_cours++;
    else if (statut.includes('an') || statut.includes('assemblée') || statut.includes('assemblee')) statsData.adoptes_an++;
    else if (statut.includes('sénat')) statsData.adoptes_senat++;
    else if (statut.includes('parlement') || statut.includes('navette') || statut === 'adopté') statsData.adoptes_parlement++;
    else if (statut.includes('promulgu')) statsData.promulgues++;
    else if (statut.includes('rejet')) statsData.rejetes++;

    if (PROCEDURES_PROMULGABLES.has(d.procedure_libelle)) statsData.total_promulgables++;
  });

  // Taux de promulgation : promulgués / textes à vocation législative
  statsData.taux_promulgation = statsData.total_promulgables > 0
    ? Math.round(statsData.promulgues * 1000 / statsData.total_promulgables) / 10
    : 0;

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
  console.error('❌ Erreur Supabase KPIs :', error);
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
      if (d.statut_final?.toLowerCase().includes('promulgu')) gs.promulgues++;
    }
  }
  groupeStats = [...gsMap.values()]
    .filter(g => g.total >= 10)
    .sort((a, b) => b.total - a.total);
} catch (error) {
  console.error('❌ Erreur calcul délais chambre :', error);
}

// ────────────────────────────────────────────────────────────────
// Classement des parlementaires les plus actifs (auteurs + rapporteurs)
// ────────────────────────────────────────────────────────────────
const organesNomMap = new Map<string, string>(
  (organesChambreResult.data || []).map(o => [o.uid, o.libelle || o.libelle_abrege || ''])
);

const auteurCount = new Map<string, number>();
const rappCount = new Map<string, number>();
for (const t of (textesImplicationResult.data || [])) {
  for (const uid of (t.auteurs_refs || [])) auteurCount.set(uid, (auteurCount.get(uid) || 0) + 1);
  for (const uid of (t.rapporteurs_refs || [])) rappCount.set(uid, (rappCount.get(uid) || 0) + 1);
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
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(year, month - 1));
  return { month: `${monthName}-${year}`, dossiers: count, year };
});


return (
  <div className="container mx-auto p-6 max-w-7xl">
    {/* Titre + filtre en haut – même style que la page dossiers */}
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-3">KPIs Parlement</h1>
        <p className="text-muted-foreground">
          Activité de la 17ᵉ législature en temps réel
          {procedure && <span className="ml-2 font-medium text-sm text-blue-600">[ {procedure} ]</span>}
          {groupe && <span className="ml-2 font-medium text-sm text-blue-600">[ {groupe} ]</span>}
        </p>
      </div>

      {/* Barre de filtres : Type + Groupe + Reset */}
      <div className="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1">
        <GenericFilter
          paramName="type"
          label="Type de procédure"
          placeholder="Type de procédure"
          allLabel="Tous les types"
          tooltipTitle="Filtre par type de procédure"
          tooltipDescription="Ex : procédure législative ordinaire, projet de loi de finances, etc."
          options={typeOptions}
        />
        <GenericFilter
          paramName="groupe"
          label="Groupe politique"
          placeholder="Groupe politique"
          allLabel="Tous les groupes"
          tooltipTitle="Filtre par groupe politique initiateur"
          tooltipDescription="Ex : La France insoumise, Renaissance, Les Républicains..."
          options={groupeOptions}
        />
        <ResetButton />
      </div>
    </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
            <CardDescription>Dossiers législatifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {statsData.total_dossiers.toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ce mois-ci</CardTitle>
            <CardDescription>Dossiers déposés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {statsData.mois_courant.toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyenne mensuelle</CardTitle>
            <CardDescription>Sur les 24 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {statsData.moyenne_mensuelle}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal */}
      <MonthlyDossiersChart data={chartData} />

            {/* Nouvelles cartes par statut */}
      <div className="mt-6">
  <h2 className="text-lg font-semibold mb-4">État des dossiers</h2>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">

    {/* Carte 1 - En traitement */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">En traitement</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le texte a été déposé au parlement (Assemblée Nationale ou Sénat) et est étudié pour décision
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold">
          {statsData.en_cours.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 2 - Adoptés par l'Assemblée Nationale */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Adoptés par l'Assemblée Nationale</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          L'Assemblée Nationale a adopté. Prochaine étape : étude par le Sénat
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-emerald-600">
          {statsData.adoptes_an.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 3 - Adoptés par le Sénat */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Adoptés par le Sénat</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le Sénat a adopté. Prochaine étape : étude par l'Assemblée Nationale
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-emerald-600">
          {statsData.adoptes_senat.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 4 - Adoptés par le Parlement */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Adoptés par le Parlement</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Les deux assemblées ont adopté le texte. Prochaine étape : promulgation
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-emerald-600">
          {statsData.adoptes_parlement.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 5 - Promulgués */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Promulgués</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le Président a promulgué la loi. Publication au Journal officiel
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-purple-600">
          {statsData.promulgues.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 6 - Rejetés */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Rejetés</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le texte est abandonnée (sauf nouveau dépôt ou version modifiée)
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-4xl font-bold text-red-600">
          {statsData.rejetes.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

  </div>
</div>

      {/* Efficacité du processus */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Efficacité du processus</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Taux de promulgation</CardTitle>
              <CardDescription>
                Part des dossiers terminés qui ont abouti à une loi signée par le Président
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">
                {statsData.taux_promulgation} %
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {statsData.promulgues} promulgués sur {statsData.total_promulgables} textes à vocation législative
              </p>
              <Link href="/documentation/methode#taux-de-promulgation" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                Comment c'est calculé →
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Délai moyen de promulgation</CardTitle>
              <CardDescription>
                Temps moyen entre le dépôt du texte et sa promulgation en loi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {statsData.delai_moyen_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Du dépôt au Journal officiel
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Min {statsData.delai_min_jours} j — Max {statsData.delai_max_jours} j
              </p>
              <Link href="/documentation/methode#delai-moyen-de-promulgation" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                Comment c'est calculé →
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Délai moyen à l'Assemblée</CardTitle>
              <CardDescription>
                Du dépôt à l'AN jusqu'à la décision d'adoption par l'Assemblée nationale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {statsData.delai_moyen_an_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Par texte adopté à l'AN
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Min {statsData.delai_min_an_jours} j — Max {statsData.delai_max_an_jours} j
              </p>
              <Link href="/documentation/methode#delai-moyen-a-l-assemblee-nationale" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                Comment c'est calculé →
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Délai moyen au Sénat</CardTitle>
              <CardDescription>
                Du dépôt au Sénat jusqu'à la décision d'adoption par le Sénat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">
                {statsData.delai_moyen_sn_jours} j
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Par texte adopté au Sénat
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Min {statsData.delai_min_sn_jours} j — Max {statsData.delai_max_sn_jours} j
              </p>
            
              <Link href="/documentation/methode#delai-moyen-au-senat" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mt-3 inline-block">
                Comment c'est calculé →
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Activité par groupe politique */}
      {groupeStats.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Activité par groupe politique</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GroupeBarChart
              data={groupeStats.map(g => ({ groupe: g.groupe, value: g.total }))}
              title="Textes proposés"
              description="Nombre de dossiers législatifs déposés par groupe politique"
              color="var(--chart-1)"
              valueLabel="Dossiers"
              link="/documentation/methode#activite-par-groupe-politique"
            />
            <GroupeBarChart
              data={groupeStats
                .filter(g => g.promulgues > 0)
                .sort((a, b) => b.promulgues - a.promulgues)
                .map(g => ({ groupe: g.groupe, value: g.promulgues }))}
              title="Lois promulguées"
              description="Nombre de lois effectivement promulguées par groupe politique"
              color="var(--chart-5)"
              valueLabel="Promulguées"
              link="/documentation/methode#activite-par-groupe-politique"
            />
          </div>
        </div>
      )}

      {/* Taux de succès par groupe politique */}
      {groupeStats.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Succès législatif par groupe</h2>
          <p className="text-muted-foreground mb-2">
            Adoption Assemblé Nationale et Sénat : sur tous les textes pertinents aux deux chambres. Promulgation : sur les textes à vocation législative uniquement (par exemple certains texte étudiés au parlement n'ont pas vocation à être promulgués; comme les résolution par exemple).
          </p>
          <Link href="/documentation/methode#succes-legislatif-par-groupe-politique" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-6 inline-block">
            Comment c'est calculé →
          </Link>
          <GroupeStatsTable data={groupeStats} />
        </div>
      )}

      {/* Parlementaires les plus actifs */}
      {allParlementaires.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Parlementaires les plus actifs</h2>
          <p className="text-muted-foreground mb-2">
            Classement des 20 députés et sénateurs les plus impliqués dans les textes législatifs, en tant qu'auteur/co-auteur ou rapporteur.
          </p>
          <Link href="/documentation/methode#parlementaires-les-plus-actifs" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-6 inline-block">
            → Comment c&apos;est calculé
          </Link>
          <ParlementairesTable data={allParlementaires} />
        </div>
      )}
    </div>
  );
}