// src/app/Composition/Compositionqueries.ts
import { supabase } from '@/lib/supabase';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

export type Institution = 'AN' | 'Senat' | 'Gouvernement';

export interface ActeurRow {
  nomComplet: string;
  age: number | null;
  profession: string | null;
  groupe: string | null;
  departement: string | null;
  taux_presence: number | null;
  taux_presence_importants: number | null;
  taux_cohesion_groupe: number | null;
  votes_pour: number | null;
  votes_contre: number | null;
  votes_abstentions: number | null;
  votes_actifs_importants: number | null;
  scrutins_pendant_mandat: number | null;
  scrutins_pendant_mandat_importants: number | null;
  date_debut_mandat: string | null;
}

export interface GroupeRow {
  uid: string;
  libelle: string;
  libelle_abrege: string;
  nb_deputes: number;
  pct_representation: number | null;
  taux_presence_moyen: number | null;
  taux_presence_importants_moyen: number | null;
  taux_cohesion_interne: number | null;
  fill: string;
}

export interface KpiMetrics {
  membres: number;
  ageMoyen: number | null;
  plusJeune: { age: number; nom: string; details?: string } | null;
  plusAge: { age: number; nom: string; details?: string } | null;
  pariteFemmes: number | null;
  mandatsActifsMoyens: number | null;
  groupes: Array<{ name: string; nameShort: string; value: number; fill: string }> | null;
  nombreGroupes: number | null;
  meilleurePresence: { nom: string; valeur: number } | null;
  pirePresence: { nom: string; valeur: number } | null;
  meilleurePresenceImportants: { nom: string; valeur: number } | null;
  pirePresenceImportants: { nom: string; valeur: number } | null;
  meilleureCohesion: { nom: string; valeur: number } | null;
  pireCohesion: { nom: string; valeur: number } | null;
  acteursList: ActeurRow[];
  groupesList: GroupeRow[];
  scrutinStats: {
    ordinaire: { avgVotants: number | null; avgAbsents: number | null; avgEligible: number | null; count: number };
    important:  { avgVotants: number | null; avgAbsents: number | null; avgEligible: number | null; count: number };
  } | null;
}

// Infos d'un organe : libellé + stats de vote
interface OrganeInfo {
  libelle: string;
  libelleAbrege: string;
  taux_presence_moyen: number | null;
  taux_presence_importants_moyen: number | null;
  taux_cohesion_interne: number | null;
}

// Palette de couleurs partagée (Tailwind 500/400)
const GROUP_COLOR_PALETTE = [
  '#06B6D4', '#D4A54A', '#8B5CF6', '#27AE60', '#E74C3C',
  '#0891B2', '#F39C12', '#6366F1', '#2ECC71', '#A8A29E',
  '#22D3EE', '#E67E22', '#7C3AED', '#1ABC9C', '#44403C',
] as const;

function computeExtremes(acteurs: any[], field: string) {
  const valid = acteurs.filter(a => a[field] != null);
  if (valid.length === 0) return { best: null, worst: null };
  const best = valid.reduce((acc, a) => a[field] > acc[field] ? a : acc);
  const worst = valid.reduce((acc, a) => a[field] < acc[field] ? a : acc);
  const toEntry = (a: any) => ({ nom: `${a.prenom ?? ''} ${a.nom ?? ''}`.trim(), valeur: Math.round(a[field] * 10) / 10 });
  return { best: toEntry(best), worst: toEntry(worst) };
}

function getInstitutionFilter(institution: Institution) {
  switch (institution) {
    case 'AN': return { est_depute_actuel: true };
    case 'Senat': return { est_senateur_actuel: true };
    case 'Gouvernement': return { est_ministre_actuel: true };
    default: return {};
  }
}

// Construit la map uid → OrganeInfo (libellé + stats de vote) en une seule requête
async function buildOrganesMap(acteurs: any[]): Promise<Map<string, OrganeInfo>> {
  const uids = new Set<string>();
  acteurs.forEach(a => { if (a.groupe) uids.add(a.groupe); });

  if (uids.size === 0) return new Map();

  const { data: organesData } = await supabase
    .from('organes')
    .select('uid, libelle, libelle_abrege, taux_presence_moyen, taux_presence_importants_moyen, taux_cohesion_interne')
    .in('uid', Array.from(uids));

  const organesMap = new Map<string, OrganeInfo>();
  organesData?.forEach(o => {
    organesMap.set(o.uid, {
      libelle: o.libelle || o.uid,
      libelleAbrege: o.libelle_abrege || o.libelle || o.uid,
      taux_presence_moyen: o.taux_presence_moyen ?? null,
      taux_presence_importants_moyen: o.taux_presence_importants_moyen ?? null,
      taux_cohesion_interne: o.taux_cohesion_interne ?? null,
    });
  });

  return organesMap;
}

// Données pour le pie chart (nom + nb membres + couleur)
function buildGroupesData(
  acteurs: any[],
  organesMap: Map<string, OrganeInfo>
): Array<{ name: string; nameShort: string; value: number; fill: string }> | null {
  const groupesMap = new Map<string, number>();

  acteurs.forEach(a => {
    if (a.groupe) {
      groupesMap.set(a.groupe, (groupesMap.get(a.groupe) || 0) + 1);
    }
  });

  if (groupesMap.size === 0) return null;

  const groupes = Array.from(groupesMap.entries())
    .map(([uid, value]) => ({
      name: organesMap.get(uid)?.libelle || uid,
      nameShort: organesMap.get(uid)?.libelleAbrege || organesMap.get(uid)?.libelle || uid,
      value,
      fill: '#A8A29E',
    }))
    .sort((a, b) => b.value - a.value)
    .map((g, index) => ({
      ...g,
      fill: GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length],
    }));

  return groupes;
}

// Tableau récapitulatif des groupes avec toutes leurs stats
function buildGroupesList(
  acteurs: any[],
  organesMap: Map<string, OrganeInfo>,
  totalMembres: number
): GroupeRow[] {
  const groupesCount = new Map<string, number>();
  acteurs.forEach(a => {
    if (a.groupe) groupesCount.set(a.groupe, (groupesCount.get(a.groupe) || 0) + 1);
  });

  if (groupesCount.size === 0) return [];

  return Array.from(groupesCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([uid, nb], index) => {
      const info = organesMap.get(uid);
      return {
        uid,
        libelle: info?.libelle || uid,
        libelle_abrege: info?.libelleAbrege || info?.libelle || uid,
        nb_deputes: nb,
        pct_representation: totalMembres > 0
          ? Math.round((nb / totalMembres) * 1000) / 10
          : null,
        taux_presence_moyen: info?.taux_presence_moyen ?? null,
        taux_presence_importants_moyen: info?.taux_presence_importants_moyen ?? null,
        taux_cohesion_interne: info?.taux_cohesion_interne ?? null,
        fill: GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length],
      };
    });
}

export async function getKpiMetrics(
  institution: Institution,
  groupeFilter?: string
): Promise<KpiMetrics> {
  const baseFilter = getInstitutionFilter(institution);
  const BASE_SELECT = 'age, civ, prenom, nom, groupe, mandats, departement_election, libelle_profession, taux_presence, taux_presence_importants, taux_cohesion_groupe, date_debut_mandat';
  const EXTENDED_SELECT = BASE_SELECT + ', votes_pour, votes_contre, votes_abstentions, votes_actifs_importants, scrutins_pendant_mandat, scrutins_pendant_mandat_importants';

  const buildQuery = (select: string) => {
    let q = supabase.from('acteurs').select(select).eq('en_exercice', true).match(baseFilter);
    if (groupeFilter && groupeFilter !== 'tous') q = q.eq('groupe', groupeFilter);
    return q;
  };

  // Tentative avec colonnes étendues (X/Y scrutins) ; fallback sur colonnes de base si elles n'existent pas encore
  let { data, error }: PostgrestSingleResponse<any[]> = await buildQuery(EXTENDED_SELECT);
  if (error) {
    ({ data, error } = await buildQuery(BASE_SELECT));
  }

  if (error || !data) {
    console.error('Erreur KPI fetch:', error);
    return {
      membres: 0, ageMoyen: null, plusJeune: null, plusAge: null,
      pariteFemmes: null, mandatsActifsMoyens: null, groupes: null, nombreGroupes: null,

      meilleurePresence: null, pirePresence: null,
      meilleurePresenceImportants: null, pirePresenceImportants: null,
      meilleureCohesion: null, pireCohesion: null,
      acteursList: [], groupesList: [], scrutinStats: null,
    };
  }

  const acteurs = data;
  const membres = acteurs.length;

  // Âge moyen
  const ages = acteurs.map(a => a.age).filter((a): a is number => a != null && !isNaN(a));
  const ageMoyen = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : null;

  // Plus jeune / plus âgé
  let plusJeune: KpiMetrics['plusJeune'] = null;
  let plusAge: KpiMetrics['plusAge'] = null;

  if (ages.length > 0) {
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);

    const jeune = acteurs.find(a => a.age === minAge);
    const age = acteurs.find(a => a.age === maxAge);

    if (jeune) {
      plusJeune = { age: minAge, nom: `${jeune.prenom} ${jeune.nom}`, details: jeune.departement_election || undefined };
    }
    if (age) {
      plusAge = { age: maxAge, nom: `${age.prenom} ${age.nom}`, details: age.departement_election || undefined };
    }
  }

  // Parité
  const femmes = acteurs.filter(a => a.civ?.trim() === 'Mme').length;
  const pariteFemmes = membres > 0 ? Math.round((femmes / membres) * 100) : null;

  // Mandats actifs moyens
  let totalMandatsActifs = 0;
  acteurs.forEach(acteur => {
    if (acteur.mandats && Array.isArray(acteur.mandats)) {
      const actifs = acteur.mandats.filter((m: any) => {
        const fin = m.date_fin;
        return !fin || new Date(fin) > new Date();
      });
      totalMandatsActifs += actifs.length;
    }
  });
  const mandatsActifsMoyens = membres > 0 ? totalMandatsActifs / membres : null;

  // Extremes individuels de participation et cohésion
  const presExtremes = computeExtremes(acteurs, 'taux_presence');
  const presImpExtremes = computeExtremes(acteurs, 'taux_presence_importants');
  const cohesionExtremes = computeExtremes(acteurs, 'taux_cohesion_groupe');

  // Résolution des libellés et stats de vote des groupes (une seule requête Supabase)
  const organesMap = await buildOrganesMap(acteurs);

  // Pie chart (AN + Sénat)
  let groupes: KpiMetrics['groupes'] = null;
  if (institution === 'AN' || institution === 'Senat') {
    groupes = buildGroupesData(acteurs, organesMap);
  }

  // Tableau récapitulatif des groupes avec stats (AN + Sénat)
  // Pour le Sénat, les colonnes de vote seront null (scrutins AN uniquement)
  const groupesList = (institution === 'AN' || institution === 'Senat')
    ? buildGroupesList(acteurs, organesMap, membres)
    : [];

  // Liste des acteurs pour le tableau
  const acteursList: ActeurRow[] = acteurs
    .map(a => ({
      nomComplet: `${a.prenom ?? ''} ${a.nom ?? ''}`.trim(),
      age: a.age ?? null,
      profession: a.libelle_profession ?? null,
      groupe: a.groupe ? (organesMap.get(a.groupe)?.libelle ?? null) : null,
      departement: a.departement_election ?? null,
      taux_presence: a.taux_presence ?? null,
      taux_presence_importants: a.taux_presence_importants ?? null,
      taux_cohesion_groupe: a.taux_cohesion_groupe ?? null,
      votes_pour: a.votes_pour ?? null,
      votes_contre: a.votes_contre ?? null,
      votes_abstentions: a.votes_abstentions ?? null,
      votes_actifs_importants: a.votes_actifs_importants ?? null,
      scrutins_pendant_mandat: a.scrutins_pendant_mandat ?? null,
      scrutins_pendant_mandat_importants: a.scrutins_pendant_mandat_importants ?? null,
      date_debut_mandat: a.date_debut_mandat ?? null,
    }))
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr'));

  // Statistiques de participation aux scrutins (AN uniquement)
  let scrutinStats: KpiMetrics['scrutinStats'] = null;
  if (institution === 'AN') {
    const { data: scrutinsData } = await supabase
      .from('scrutins')
      .select('type_vote_code, synthese_nombre_votants, non_votants_institutionnels')
      .not('synthese_nombre_votants', 'is', null);

    if (scrutinsData && scrutinsData.length > 0) {
      const AN_TOTAL = 577;
      const avg = (arr: any[], field: string) =>
        arr.length > 0
          ? Math.round(arr.reduce((s: number, x: any) => s + (x[field] ?? 0), 0) / arr.length)
          : null;

      const ordinaire = scrutinsData.filter(s => !['MOC', 'SPS'].includes(s.type_vote_code ?? ''));
      const important  = scrutinsData.filter(s =>  ['MOC', 'SPS'].includes(s.type_vote_code ?? ''));

      const avgOrd = avg(ordinaire, 'synthese_nombre_votants');
      const avgImp = avg(important, 'synthese_nombre_votants');
      // Non-votants institutionnels (PAN/PSE/MG) : exclus de la base d'éligibles
      const nvOrd = avg(ordinaire, 'non_votants_institutionnels') ?? 0;
      const nvImp = avg(important, 'non_votants_institutionnels') ?? 0;
      const eligOrd = AN_TOTAL - nvOrd;
      const eligImp = AN_TOTAL - nvImp;

      scrutinStats = {
        ordinaire: { avgVotants: avgOrd, avgAbsents: avgOrd !== null ? eligOrd - avgOrd : null, avgEligible: eligOrd, count: ordinaire.length },
        important:  { avgVotants: avgImp, avgAbsents: avgImp !== null ? eligImp - avgImp : null, avgEligible: eligImp, count: important.length },
      };
    }
  }

  return {
    membres,
    ageMoyen: ageMoyen ? Math.round(ageMoyen) : null,
    plusJeune,
    plusAge,
    pariteFemmes,
    mandatsActifsMoyens: mandatsActifsMoyens ? Math.round(mandatsActifsMoyens * 10) / 10 : null,
    groupes,
    nombreGroupes: groupes ? groupes.length : null,
    meilleurePresence: presExtremes.best,
    pirePresence: presExtremes.worst,
    meilleurePresenceImportants: presImpExtremes.best,
    pirePresenceImportants: presImpExtremes.worst,
    meilleureCohesion: cohesionExtremes.best,
    pireCohesion: cohesionExtremes.worst,
    acteursList,
    groupesList,
    scrutinStats,
  };
}
