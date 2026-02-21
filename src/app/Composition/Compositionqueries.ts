// src/app/Composition/Compositionqueries.ts
import { supabase } from '@/lib/supabase';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

export type Institution = 'AN' | 'Senat' | 'Gouvernement';

export interface KpiMetrics {
  membres: number;
  ageMoyen: number | null;
  plusJeune: { age: number; nom: string; details?: string } | null;
  plusAge: { age: number; nom: string; details?: string } | null;
  pariteFemmes: number | null;
  mandatsActifsMoyens: number | null;
  groupes: Array<{ name: string; value: number; fill: string }> | null;
  nombreGroupes: number | null;
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

// Fonction mutualisée : construit les données de groupes à partir des acteurs
async function buildGroupesData(
  acteurs: any[]
): Promise<Array<{ name: string; value: number; fill: string }> | null> {
  const groupesMap = new Map<string, number>();

  acteurs.forEach(a => {
    if (a.groupe) {
      groupesMap.set(a.groupe, (groupesMap.get(a.groupe) || 0) + 1);
    }
  });

  if (groupesMap.size === 0) return null;

  const uids = Array.from(groupesMap.keys());

  const { data: organesData } = await supabase
    .from('organes')
    .select('uid, libelle')
    .in('uid', uids);

  const organesMap = new Map<string, string>();
  organesData?.forEach(o => {
    organesMap.set(o.uid, o.libelle || o.uid);
  });

  const groupes = Array.from(groupesMap.entries())
    .map(([uid, value]) => ({
      name: organesMap.get(uid) || uid,
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

export async function getKpiMetrics(
  institution: Institution,
  groupeFilter?: string
): Promise<KpiMetrics> {
  const baseFilter = getInstitutionFilter(institution);
  let query = supabase
    .from('acteurs')
    .select('age, civ, prenom, nom, groupe, mandats, departement_election')
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

  // Groupes : mutualisé pour AN et Sénat
  let groupes: KpiMetrics['groupes'] = null;
  if (institution === 'AN' || institution === 'Senat') {
    groupes = await buildGroupesData(acteurs);
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
  };
}
