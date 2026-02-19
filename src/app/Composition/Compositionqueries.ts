// src/lib/kpiQueries.ts
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
}

// Helper pour mapper le filtre institution → conditions Supabase
function getInstitutionFilter(institution: Institution) {
  switch (institution) {
    case 'AN':
      return { est_depute_actuel: true };
    case 'Senat':
      return { est_senateur_actuel: true };
    case 'Gouvernement':
      return { est_ministre_actuel: true };
    default:
      return {};
  }
}

export async function getKpiMetrics(
  institution: Institution,
  groupeFilter?: string // slug du groupe (uid de l'organe)
): Promise<KpiMetrics> {
  const baseFilter = getInstitutionFilter(institution);
  let query = supabase
    .from('acteurs')
    .select('age, civ, prenom, nom, groupe, mandats, departement_election')
    .eq('en_exercice', true)
    .match(baseFilter);

  // Appliquer filtre groupe si présent
  if (groupeFilter && groupeFilter !== 'tous') {
    query = query.eq('groupe', groupeFilter);
  }

  const { data, error }: PostgrestSingleResponse<any[]> = await query;

  if (error || !data) {
    console.error('Erreur KPI fetch:', error);
    return {
      membres: 0,
      ageMoyen: null,
      plusJeune: null,
      plusAge: null,
      pariteFemmes: null,
      mandatsActifsMoyens: null,
      groupes: null,
    };
  }



  const acteurs = data;

  // Calculs
  const membres = acteurs.length;

  // Âge moyen
  const ages = acteurs.map(a => a.age).filter(a => a != null && !isNaN(a));
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
      plusJeune = {
        age: minAge,
        nom: `${jeune.prenom} ${jeune.nom}`,
        details: jeune.departement_election || undefined,
      };
    }
    if (age) {
      plusAge = {
        age: maxAge,
        nom: `${age.prenom} ${age.nom}`,
        details: age.departement_election || undefined,
      };
    }
  }

  // Parité (approximation via civ)
  const femmes = acteurs.filter(a => a.civ?.trim() === 'Mme').length;
  const pariteFemmes = membres > 0 ? Math.round((femmes / membres) * 100) : null;

  // Mandats actifs moyens (approximation simple pour V1)
  // On compte les mandats où date_fin est null ou future
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

// ────────────────────────────────────────────────
// Récupération des vrais libellés des groupes
// ────────────────────────────────────────────────
let groupes: KpiMetrics['groupes'] = null;

if (institution === 'AN') {
  const groupesMap = new Map<string, number>();

  acteurs.forEach(a => {
    if (a.groupe) {
      groupesMap.set(a.groupe, (groupesMap.get(a.groupe) || 0) + 1); 
    }
  });

  if (groupesMap.size > 0) {
    const uids = Array.from(groupesMap.keys());

    const { data: organesData, error: organesError } = await supabase
      .from('organes')
      .select('uid, libelle')
      .in('uid', uids);


    // 3. Mapper uid → libellé propre (priorité : libelle > libelle_court > acronym > uid)
    const organesMap = new Map<string, string>();
    organesData?.forEach(o => {
      const nom = o.libelle || o.uid;
      organesMap.set(o.uid, nom);
    });

    // 4. Couleurs temporaires (à remplacer plus tard par champ couleur dans organes si ajouté)
    // Sources : Okabe-Ito, IBM Design, Paul Tol palettes
const GROUP_COLOR_PALETTE = [
  '#3B82F6',   // bleu vif moderne (comme Tailwind blue-500)
  '#10B981',   // vert émeraude doux (emerald-500)
  '#F59E0B',   // ambre/orange chaud (amber-500)
  '#8B5CF6',   // violet-indigo moderne (violet-500)
  '#EC4899',   // rose magenta dynamique (pink-500)
  '#06B6D4',   // cyan turquoise frais (cyan-500)
  '#F97316',   // orange corail (orange-500)
  '#6366F1',   // indigo tech (indigo-500)
  '#14B8A6',   // teal élégant (teal-500)
  '#A78BFA',   // violet clair doux (violet-400)
  '#F472B6',   // rose corail (pink-400)
  '#60A5FA',   // bleu ciel (blue-400)
  '#34D399',   // vert menthe (emerald-400)
  '#FBBF24',   // jaune doré doux (amber-400)
  '#A3E635',   // lime clair (lime-400)
] as const;

    // 5. Construire le tableau final
    groupes = Array.from(groupesMap.entries())
  .map(([uid, value]) => {
    const nom = organesMap.get(uid) || uid;
    return { name: nom, value, fill: '#888888' }; // placeholder temporaire
  })
  .sort((a, b) => b.value - a.value);   // tri descendant par taille

// ← Ici, après le sort, on assigne les couleurs par position
groupes = groupes.map((g, index) => ({
  ...g,
  fill: GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length],
}));
  }
}

  return {
    membres,
    ageMoyen: ageMoyen ? Math.round(ageMoyen * 10) / 10 : null,
    plusJeune,
    plusAge,
    pariteFemmes,
    mandatsActifsMoyens: mandatsActifsMoyens ? Math.round(mandatsActifsMoyens * 10) / 10 : null,
    groupes,
  };
}