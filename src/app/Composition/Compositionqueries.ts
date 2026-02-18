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
  groupes: Array<{ name: string; value: number }> | null; // pour plus tard
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

  return {
    membres,
    ageMoyen: ageMoyen ? Math.round(ageMoyen * 10) / 10 : null,
    plusJeune,
    plusAge,
    pariteFemmes,
    mandatsActifsMoyens: mandatsActifsMoyens ? Math.round(mandatsActifsMoyens * 10) / 10 : null,
    groupes: null, // on ajoutera plus tard
  };
}