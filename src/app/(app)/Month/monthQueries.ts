// src/app/(app)/Month/monthQueries.ts
// Requêtes Supabase isolées pour la page "Fil du Mois"

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Source unique : mapping libellé → type d'événement ──
// Toutes les listes filtrées (feed, timeline) en dérivent automatiquement.
export type FeedEventType =
  | 'DEPOT_TEXTE' | 'DEPOT_RAPPORT' | 'DECISION' | 'NAVETTE'
  | 'CMP_CONVOCATION' | 'CMP_RAPPORT' | 'MOTION_CENSURE' | 'DECL_GOUVERNEMENT'
  | 'MOTION_VOTE' | 'CC_SAISINE' | 'PROMULGATION' | 'AUTRE';

export const LIBELLE_TO_TYPE: Record<string, FeedEventType> = {
  "1er depot d'une initiative.": 'DEPOT_TEXTE',
  "1er dépôt d'une initiative.": 'DEPOT_TEXTE',
  "Dépôt de rapport": 'DEPOT_RAPPORT',
  "Décision": 'DECISION',
  "Dépôt d'une initiative en navette": 'NAVETTE',
  "Convocation d'une CMP": 'CMP_CONVOCATION',
  "Dépôt du rapport d'une CMP": 'CMP_RAPPORT',
  "Décision de la CMP": 'DECISION',
  "Motion de censure": 'MOTION_CENSURE',
  "Dépôt d'une déclaration du gouvernement": 'DECL_GOUVERNEMENT',
  "Décision sur une motion de censure": 'MOTION_VOTE',
  "Saisine du conseil constitutionnel": 'CC_SAISINE',
  "Conclusion du conseil constitutionnel": 'DECISION',
  "Promulgation d'une loi": 'PROMULGATION',
};

// Fil du mois : tous sauf motions (traitées séparément)
const FEED_TRACKED_LIBELLES = Object.keys(LIBELLE_TO_TYPE).filter(
  l => LIBELLE_TO_TYPE[l] !== 'MOTION_CENSURE' && LIBELLE_TO_TYPE[l] !== 'MOTION_VOTE',
);

// Timeline dossier : tous les libellés
const TIMELINE_TRACKED_LIBELLES = Object.keys(LIBELLE_TO_TYPE);

export async function getMonthActes(supabase: SupabaseClient, dateStart: string, dateEnd: string) {
  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .gte('date_acte', dateStart)
    .lte('date_acte', dateEnd)
    .not('date_acte', 'is', null)
    .in('libelle_acte', FEED_TRACKED_LIBELLES)
    .order('date_acte', { ascending: false });

  if (error) console.error('Erreur actes mois:', error);
  return data ?? [];
}

// Motions de censure (traitées séparément de getMonthActes)
// Filtre : seulement celles avec textes
export async function getMonthMotionActes(supabase: SupabaseClient, dateStart: string, dateEnd: string) {
  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .gte('date_acte', dateStart)
    .lte('date_acte', dateEnd)
    .eq('libelle_acte', 'Motion de censure')
    .not('textes_associes', 'is', null)
    .order('date_acte', { ascending: false });

  if (error) console.error('Erreur motions mois:', error);
  return data ?? [];
}

// Récupère le statut_conclusion des actes enfants de type MOTION-VOTE
// (code_acte *-MOTION-VOTE, sans dépendre du libelle exact)
export async function getMotionDecisionActes(supabase: SupabaseClient, parentUids: string[]) {
  if (parentUids.length === 0) return new Map<string, string>();

  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, parent_uid, statut_conclusion')
    .in('parent_uid', parentUids)
    .not('statut_conclusion', 'is', null);

  if (error) console.error('Erreur décision motions:', error);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.parent_uid && row.statut_conclusion) {
      map.set(row.parent_uid, row.statut_conclusion);
    }
  }
  return map;
}


export async function getMonthScrutins(supabase: SupabaseClient, dateStart: string, dateEnd: string) {
  const { data, error } = await supabase
    .from('scrutins')
    .select('uid, numero, date_scrutin, titre, sort_code, sort_libelle, synthese_pour, synthese_contre, synthese_abstentions, synthese_nombre_votants, synthese_non_votants, synthese_suffrages_requis, type_vote_libelle')
    .gte('date_scrutin', dateStart)
    .lte('date_scrutin', dateEnd)
    .not('date_scrutin', 'is', null)
    .order('date_scrutin', { ascending: false });

  if (error) console.error('Erreur scrutins mois:', error);
  return data ?? [];
}

export async function getMonthDossiers(supabase: SupabaseClient, dateStart: string, dateEnd: string) {
  const { data, error } = await supabase
    .from('dossiers_legislatifs')
    .select('uid, titre, procedure_libelle, statut_final, date_depot, initiateur_acteur_ref(nom, prenom), initiateur_groupe_libelle')
    .gte('date_depot', dateStart)
    .lte('date_depot', dateEnd)
    .not('date_depot', 'is', null)
    .order('date_depot', { ascending: false });

  if (error) console.error('Erreur dossiers mois:', error);
  return data ?? [];
}

// Retrouve l'acte législatif associé à chaque scrutin via actes_legislatifs.vote_refs
// Retourne un objet acte complet réutilisable par acteToFeedEvent
export type ActeRow = { uid: string; code_acte: string; libelle_acte: string | null; date_acte: string; statut_conclusion: string | null; organe_ref: string | null; vote_refs: string[] | null; textes_associes: string[] | null; texte_adopte: string | null; dossier_uid: string | null };

export async function getScrutinActeMap(supabase: SupabaseClient, scrutinUids: string[]) {
  if (scrutinUids.length === 0) return new Map<string, ActeRow>();

  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .overlaps('vote_refs', scrutinUids)
    .not('dossier_uid', 'is', null);

  if (error) console.error('Erreur scrutin-acte map:', error);

  const map = new Map<string, ActeRow>();
  for (const row of data ?? []) {
    for (const ref of row.vote_refs ?? []) {
      const existing = map.get(ref);
      if (!existing || (!existing.textes_associes?.length && row.textes_associes?.length)) {
        map.set(ref, row);
      }
    }
  }
  return map;
}

// Récupère les titres des dossiers liés aux actes (batch) + initiateur
export async function getDossierTitles(supabase: SupabaseClient, dossierUids: string[]) {
  if (dossierUids.length === 0) return new Map<string, { titre: string; uid: string; statut_final: string | null; procedure_libelle: string | null; initiateurActeurRef: string | null; groupeAbrege: string | null }>();

  const { data, error } = await supabase
    .from('dossiers_legislatifs')
    .select('uid, titre, statut_final, procedure_libelle, initiateur_acteur_ref, initiateur_groupe_libelle')
    .in('uid', dossierUids);

  if (error) console.error('Erreur titres dossiers:', error);

  const map = new Map<string, { titre: string; uid: string; statut_final: string | null; procedure_libelle: string | null; initiateurActeurRef: string | null; groupeAbrege: string | null }>();
  for (const d of data ?? []) {
    map.set(d.uid, {
      titre: d.titre,
      uid: d.uid,
      statut_final: d.statut_final,
      procedure_libelle: d.procedure_libelle,
      initiateurActeurRef: d.initiateur_acteur_ref ?? null,
      groupeAbrege: d.initiateur_groupe_libelle ?? null,
    });
  }
  return map;
}

export async function getDossierTimeline(supabase: SupabaseClient, dossierUid: string) {
  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, organe_ref, vote_refs, textes_associes, texte_adopte, statut_conclusion, dossier_uid, parent_uid')
    .eq('dossier_uid', dossierUid)
    .not('date_acte', 'is', null)
    .in('libelle_acte', TIMELINE_TRACKED_LIBELLES)
    .order('date_acte', { ascending: true });

  if (error) console.error('Erreur timeline dossier:', error);
  return data ?? [];
}

export async function getTextesByUids(supabase: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return new Map<string, { uid: string; denomination: string | null; titre_principal: string | null; lien_texte: string | null; provenance: string | null; statut_adoption: string | null; url_accessible: boolean | null; auteurs_refs: string[] | null }>();

  const { data, error } = await supabase
    .from('textes')
    .select('uid, denomination, titre_principal, lien_texte, provenance, statut_adoption, url_accessible, auteurs_refs')
    .in('uid', uids);

  if (error) console.error('Erreur textes batch:', error);

  const map = new Map<string, { uid: string; denomination: string | null; titre_principal: string | null; lien_texte: string | null; provenance: string | null; statut_adoption: string | null; url_accessible: boolean | null; auteurs_refs: string[] | null }>();
  for (const t of data ?? []) {
    map.set(t.uid, t);
  }
  return map;
}

export async function getOrganesByUids(supabase: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return new Map<string, { name: string; libelleAbrege: string | null; codeType: string | null }>();

  const { data, error } = await supabase
    .from('organes')
    .select('uid, libelle, libelle_abrege, code_type')
    .in('uid', uids);

  if (error) console.error('Erreur organes batch:', error);

  const map = new Map<string, { name: string; libelleAbrege: string | null; codeType: string | null }>();
  for (const o of data ?? []) {
    const name = o.libelle || o.libelle_abrege;
    if (name) map.set(o.uid, { name, libelleAbrege: o.libelle_abrege ?? null, codeType: o.code_type ?? null });
  }
  return map;
}

export async function getActeursByUids(supabase: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return new Map<string, { prenom: string; nom: string; groupe: string | null; organes_refs: string[] | null }>();

  const { data, error } = await supabase
    .from('acteurs')
    .select('uid, prenom, nom, groupe, organes_refs')
    .in('uid', uids);

  if (error) console.error('Erreur acteurs batch:', error);

  const map = new Map<string, { prenom: string; nom: string; groupe: string | null; organes_refs: string[] | null }>();
  for (const a of data ?? []) {
    map.set(a.uid, { prenom: a.prenom ?? '', nom: a.nom ?? '', groupe: a.groupe ?? null, organes_refs: a.organes_refs ?? null });
  }
  return map;
}

export async function getScrutinsByUids(supabase: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return new Map<string, { uid: string; titre: string | null; sort_libelle: string | null; type_vote_libelle: string | null; synthese_pour: number | null; synthese_contre: number | null; synthese_abstentions: number | null; synthese_nombre_votants: number | null; synthese_non_votants: number | null; synthese_suffrages_requis: number | null }>();

  const { data, error } = await supabase
    .from('scrutins')
    .select('uid, titre, sort_libelle, type_vote_libelle, synthese_pour, synthese_contre, synthese_abstentions, synthese_nombre_votants, synthese_non_votants, synthese_suffrages_requis')
    .in('uid', uids);

  if (error) console.error('Erreur scrutins batch:', error);

  const map = new Map<string, { uid: string; titre: string | null; sort_libelle: string | null; type_vote_libelle: string | null; synthese_pour: number | null; synthese_contre: number | null; synthese_abstentions: number | null; synthese_nombre_votants: number | null; synthese_non_votants: number | null; synthese_suffrages_requis: number | null }>();
  for (const s of data ?? []) {
    map.set(s.uid, s);
  }
  return map;
}
