// src/app/(app)/Month/monthQueries.ts
// Requêtes Supabase isolées pour la page "Fil du Mois"

import type { SupabaseClient } from '@supabase/supabase-js';

export async function getMonthActes(supabase: SupabaseClient, weekStart: string, weekEnd: string) {
  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .gte('date_acte', weekStart)
    .lte('date_acte', weekEnd)
    .not('date_acte', 'is', null)
    .is('parent_uid', null) // Seulement les actes de premier niveau (pas les sous-actes)
    .order('date_acte', { ascending: false });

  if (error) console.error('Erreur actes semaine:', error);
  return data ?? [];
}

// Motions de censure (ont un parent_uid, donc exclues de getWeekActes)
// Filtre : seulement celles avec textes ET votes
export async function getMonthMotionActes(supabase: SupabaseClient, weekStart: string, weekEnd: string) {
  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .gte('date_acte', weekStart)
    .lte('date_acte', weekEnd)
    .eq('libelle_acte', 'Motion de censure')
    .not('textes_associes', 'is', null)
    .order('date_acte', { ascending: false });

  if (error) console.error('Erreur motions semaine:', error);
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

// Sous-actes importants (toujours enfants, jamais renvoyés par getMonthActes)
const IMPORTANT_SUB_LIBELLES = [
  "Promulgation d'une loi",
  "Saisine du conseil constitutionnel",
  "Conclusion du conseil constitutionnel",
  "Dépôt d'une déclaration du gouvernement",
];

export async function getMonthImportantSubActes(supabase: SupabaseClient, monthStart: string, monthEnd: string) {
  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .gte('date_acte', monthStart)
    .lte('date_acte', monthEnd)
    .in('libelle_acte', IMPORTANT_SUB_LIBELLES)
    .order('date_acte', { ascending: false });

  if (error) console.error('Erreur sous-actes importants:', error);
  return data ?? [];
}

export async function getMonthScrutins(supabase: SupabaseClient, weekStart: string, weekEnd: string) {
  const { data, error } = await supabase
    .from('scrutins')
    .select('uid, numero, date_scrutin, titre, sort_code, sort_libelle, synthese_pour, synthese_contre, synthese_abstentions, synthese_nombre_votants, synthese_non_votants, synthese_suffrages_requis, type_vote_libelle')
    .gte('date_scrutin', weekStart)
    .lte('date_scrutin', weekEnd)
    .not('date_scrutin', 'is', null)
    .order('date_scrutin', { ascending: false });

  if (error) console.error('Erreur scrutins semaine:', error);
  return data ?? [];
}

export async function getMonthDossiers(supabase: SupabaseClient, weekStart: string, weekEnd: string) {
  const { data, error } = await supabase
    .from('dossiers_legislatifs')
    .select('uid, titre, procedure_libelle, statut_final, date_depot, initiateur_acteur_ref(nom, prenom), initiateur_groupe_libelle')
    .gte('date_depot', weekStart)
    .lte('date_depot', weekEnd)
    .not('date_depot', 'is', null)
    .order('date_depot', { ascending: false });

  if (error) console.error('Erreur dossiers semaine:', error);
  return data ?? [];
}

// Retrouve l'acte législatif associé à chaque scrutin via actes_legislatifs.vote_refs
// Retourne un objet acte complet réutilisable par acteToFeedEvent
export type ActeRow = { uid: string; code_acte: string; libelle_acte: string | null; date_acte: string; statut_conclusion: string | null; organe_ref: string | null; vote_refs: string | null; textes_associes: string | null; texte_adopte: string | null; dossier_uid: string | null };

export async function getScrutinActeMap(supabase: SupabaseClient, scrutinUids: string[]) {
  if (scrutinUids.length === 0) return new Map<string, ActeRow>();

  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, statut_conclusion, organe_ref, vote_refs, textes_associes, texte_adopte, dossier_uid')
    .in('vote_refs', scrutinUids)
    .not('dossier_uid', 'is', null);

  if (error) console.error('Erreur scrutin-acte map:', error);

  const map = new Map<string, ActeRow>();
  for (const row of data ?? []) {
    if (row.vote_refs) {
      const existing = map.get(row.vote_refs);
      if (!existing || (!existing.textes_associes && row.textes_associes)) {
        map.set(row.vote_refs, row);
      }
    }
  }
  return map;
}

// Récupère les titres des dossiers liés aux actes (batch) + initiateur
export async function getDossierTitles(supabase: SupabaseClient, dossierUids: string[]) {
  if (dossierUids.length === 0) return new Map<string, { titre: string; uid: string; statut_final: string | null; procedure_libelle: string | null; auteur: string | null; groupeAbrege: string | null }>();

  const { data, error } = await supabase
    .from('dossiers_legislatifs')
    .select('uid, titre, statut_final, procedure_libelle, initiateur_acteur_ref(nom, prenom), initiateur_groupe_libelle')
    .in('uid', dossierUids);

  if (error) console.error('Erreur titres dossiers:', error);

  const map = new Map<string, { titre: string; uid: string; statut_final: string | null; procedure_libelle: string | null; auteur: string | null; groupeAbrege: string | null }>();
  for (const d of data ?? []) {
    const acteurRef = d.initiateur_acteur_ref as unknown as { nom: string; prenom: string } | null;
    const acteur = acteurRef ?? null;
    map.set(d.uid, {
      ...d,
      auteur: acteur ? `${acteur.prenom} ${acteur.nom}` : null,
      groupeAbrege: d.initiateur_groupe_libelle ?? null,
    });
  }
  return map;
}

export async function getDossierTimeline(supabase: SupabaseClient, dossierUid: string) {
  const TRACKED_LIBELLES = [
    "1er dépôt d'une initiative.",
    "Dépôt de rapport",
    "Décision",
    "Dépôt d'une initiative en navette",
    "Convocation d'une CMP",
    "Dépôt du rapport d'une CMP",
    "Décision de la CMP",
    "Motion de censure",
    "Dépôt d'une déclaration du gouvernement",
    "Décision sur une motion de censure",
    "Saisine du conseil constitutionnel",
    "Conclusion du conseil constitutionnel",
    "Promulgation d'une loi",
  ];

  const { data, error } = await supabase
    .from('actes_legislatifs')
    .select('uid, code_acte, libelle_acte, date_acte, organe_ref, vote_refs, textes_associes, texte_adopte, statut_conclusion, dossier_uid, parent_uid')
    .eq('dossier_uid', dossierUid)
    .not('date_acte', 'is', null)
    .in('libelle_acte', TRACKED_LIBELLES)
    .order('date_acte', { ascending: true });

  if (error) console.error('Erreur timeline dossier:', error);
  return data ?? [];
}

export async function getTextesByUids(supabase: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return new Map<string, { uid: string; denomination: string | null; titre_principal: string | null; lien_texte: string | null; provenance: string | null; statut_adoption: string | null }>();

  const { data, error } = await supabase
    .from('textes')
    .select('uid, denomination, titre_principal, lien_texte, provenance, statut_adoption')
    .in('uid', uids);

  if (error) console.error('Erreur textes batch:', error);

  const map = new Map<string, { uid: string; denomination: string | null; titre_principal: string | null; lien_texte: string | null; provenance: string | null; statut_adoption: string | null }>();
  for (const t of data ?? []) {
    map.set(t.uid, t);
  }
  return map;
}

export async function getOrganesByUids(supabase: SupabaseClient, uids: string[]) {
  if (uids.length === 0) return new Map<string, { name: string; codeType: string | null }>();

  const { data, error } = await supabase
    .from('organes')
    .select('uid, libelle, libelle_abrege, code_type')
    .in('uid', uids);

  if (error) console.error('Erreur organes batch:', error);

  const map = new Map<string, { name: string; codeType: string | null }>();
  for (const o of data ?? []) {
    const name = o.libelle || o.libelle_abrege;
    if (name) map.set(o.uid, { name, codeType: o.code_type ?? null });
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
