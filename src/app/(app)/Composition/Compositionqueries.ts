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
  taux_presence_solennels: number | null;
  taux_cohesion_groupe: number | null;
}

export interface GroupeRow {
  uid: string;
  libelle: string;
  libelle_abrege: string;
  nb_deputes: number;
  pct_representation: number | null;
  taux_presence_moyen: number | null;
  taux_presence_solennels_moyen: number | null;
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
  presenceMoyenne: number | null;
  presenceSolennelsMoyenne: number | null;
  acteursList: ActeurRow[];
  groupesList: GroupeRow[];
}

// Infos d'un organe : libellé + stats de vote
interface OrganeInfo {
  libelle: string;
  libelleAbrege: string;
  taux_presence_moyen: number | null;
  taux_presence_solennels_moyen: number | null;
  taux_cohesion_interne: number | null;
}

// Palette de couleurs partagée (Tailwind 500/400)
const GROUP_COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#F97316', '#6366F1', '#14B8A6', '#A78BFA',
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A3E635',
] as const;

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
    .select('uid, libelle, libelle_abrege, taux_presence_moyen, taux_presence_solennels_moyen, taux_cohesion_interne')
    .in('uid', Array.from(uids));

  const organesMap = new Map<string, OrganeInfo>();
  organesData?.forEach(o => {
    organesMap.set(o.uid, {
      libelle: o.libelle || o.uid,
      libelleAbrege: o.libelle_abrege || o.libelle || o.uid,
      taux_presence_moyen: o.taux_presence_moyen ?? null,
      taux_presence_solennels_moyen: o.taux_presence_solennels_moyen ?? null,
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
      fill: '#888888',
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
        taux_presence_solennels_moyen: info?.taux_presence_solennels_moyen ?? null,
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
  let query = supabase
    .from('acteurs')
    .select('age, civ, prenom, nom, groupe, mandats, departement_election, libelle_profession, taux_presence, taux_presence_solennels, taux_cohesion_groupe')
    .eq('en_exercice', true)
    .match(baseFilter);

  if (groupeFilter && groupeFilter !== 'tous') {
    query = query.eq('groupe', groupeFilter);
  }

  const { data, error }: PostgrestSingleResponse<any[]> = await query;

  if (error || !data) {
    console.error('Erreur KPI fetch:', error);
    return {
      membres: 0, ageMoyen: null, plusJeune: null, plusAge: null,
      pariteFemmes: null, mandatsActifsMoyens: null, groupes: null, nombreGroupes: null,
      presenceMoyenne: null, presenceSolennelsMoyenne: null,
      acteursList: [], groupesList: [],
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

  // Moyennes de présence aux votes (calculées sur les acteurs ayant des données)
  const withPresence = acteurs.filter(a => a.taux_presence != null);
  const presenceMoyenne = withPresence.length > 0
    ? Math.round(withPresence.reduce((sum: number, a) => sum + a.taux_presence, 0) / withPresence.length * 10) / 10
    : null;

  const withPresenceSol = acteurs.filter(a => a.taux_presence_solennels != null);
  const presenceSolennelsMoyenne = withPresenceSol.length > 0
    ? Math.round(withPresenceSol.reduce((sum: number, a) => sum + a.taux_presence_solennels, 0) / withPresenceSol.length * 10) / 10
    : null;

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
      taux_presence_solennels: a.taux_presence_solennels ?? null,
      taux_cohesion_groupe: a.taux_cohesion_groupe ?? null,
    }))
    .sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr'));

  return {
    membres,
    ageMoyen: ageMoyen ? Math.round(ageMoyen) : null,
    plusJeune,
    plusAge,
    pariteFemmes,
    mandatsActifsMoyens: mandatsActifsMoyens ? Math.round(mandatsActifsMoyens * 10) / 10 : null,
    groupes,
    nombreGroupes: groupes ? groupes.length : null,
    presenceMoyenne,
    presenceSolennelsMoyenne,
    acteursList,
    groupesList,
  };
}
