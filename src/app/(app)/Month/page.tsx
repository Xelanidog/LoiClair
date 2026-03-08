// src/app/(app)/Month/page.tsx
// Server Component — Fetch des donnees du mois (ou d'un dossier) et transformation en evenements enrichis

export const revalidate = 3600; // Cache 1h — données mises à jour une fois par nuit

import { supabase } from '@/lib/supabase';
import {
  getMonthActes,
  getDossierTitles,
  getDossierTimeline,
  getTextesByUids,
  getOrganesByUids,
  getActeursByUids,
  getScrutinsByUids,
  getMonthMotionActes,
  getMotionDecisionActes,
  LIBELLE_TO_TYPE,
  type FeedEventType,
  type ActeRow,
} from './monthQueries';
import { MonthFeedClient } from './MonthFeedClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fil du Mois — LoiClair',
  description: 'Les evenements legislatifs du mois : votes, depots, promulgations et plus encore.',
};

// ---------------------------------------------------------------------------
// Types exportes pour le client (FeedEventType importé depuis monthQueries)
// ---------------------------------------------------------------------------

export type { FeedEventType } from './monthQueries';

export type ScrutinItem = {
  uid: string;
  titre: string | null;
  typeVoteCode: string | null;
  typeVoteLibelle: string | null;
  typeMajorite: string | null;
  votePour: number | null;
  voteContre: number | null;
  voteAbstentions: number | null;
  voteVotants: number | null;
  voteNonVotants: number | null;
  voteSuffragesRequis: number | null;
  statutConclusion: string | null;
};

export type FeedEvent = {
  id: string;
  type: FeedEventType;
  date: string;
  titre: string;
  dossierUid: string | null;
  dossierTitre: string | null;
  // Enriched fields
  libelleActe: string | null;
  codeActe: string | null;
  organeName: string | null;
  texteUid: string | null;
  texteDenomination: string | null;
  texteLien: string | null;
  texteTitre: string | null;
  texteAdopteUid: string | null;
  texteAdopteDenomination: string | null;
  texteAdopteTitre: string | null;
  texteAdopteLien: string | null;
  texteUrlAccessible: boolean | null;
  scrutinUid: string | null;
  scrutinTitre: string | null;
  typeVoteCode: string | null;
  typeVoteLibelle: string | null;
  typeMajorite: string | null;
  statutConclusion: string | null;
  // Auteur (pour DEPOT_TEXTE) / Provenance (pour DEPOT_RAPPORT)
  auteur: string | null;
  groupeAbrege: string | null;
  auteurChambre: 'AN' | 'SENAT' | 'GOUV' | null;
  texteProvenance: string | null;
  texteHasTomes: boolean | null;
  organeCodeType: string | null;
  rapporteurName: string | null;
  rapporteurGroupe: string | null;
  rapporteurIsMultiple: boolean | null;
  codeLoi: string | null;
  titreLoi: string | null;
  // Vote details (optional) — premier scrutin, pour backward compat
  votePour?: number | null;
  voteContre?: number | null;
  voteAbstentions?: number | null;
  voteVotants?: number | null;
  voteNonVotants?: number | null;
  voteSuffragesRequis?: number | null;
  // Tous les scrutins liés (1 pour vote simple, N pour multi-votes)
  scrutins: ScrutinItem[];
};

export type GroupedFeedEvent = {
  key: string; // `${dossierUid}-${dateISO}-${type}`
  type: FeedEventType;
  date: string;
  dossierUid: string | null;
  dossierTitre: string | null;
  events: FeedEvent[];
};

export type MonthKpis = {
  totalEvents: number;
  scrutins: number;
  nouveauxTextes: number;
  promulgations: number;
};

// ---------------------------------------------------------------------------
// Classification par libelle (source unique : LIBELLE_TO_TYPE de monthQueries)
// ---------------------------------------------------------------------------

function classifyByLibelle(libelle: string | null): FeedEventType {
  if (!libelle) return 'AUTRE';
  return LIBELLE_TO_TYPE[libelle] ?? 'AUTRE';
}

// ---------------------------------------------------------------------------
// Utilitaires de date
// ---------------------------------------------------------------------------

function getMonthBounds(isoMonth?: string): { monthStart: Date; monthEnd: Date; year: number; month: number } {
  let year: number;
  let month: number; // 0-indexed

  if (isoMonth && /^\d{4}-\d{2}$/.test(isoMonth)) {
    const [y, m] = isoMonth.split('-');
    year = parseInt(y, 10);
    month = parseInt(m, 10) - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }

  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { monthStart, monthEnd, year, month };
}

function formatISOMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Helpers : groupement et enrichissement
// ---------------------------------------------------------------------------

/** Résout le groupe d'un acteur via acteur.groupe → organe, ou organes_refs en fallback */
function resolveGroupeAbrege(
  acteur: { groupe: string | null; organes_refs: string[] | null } | null | undefined,
  organes: Map<string, { name: string; libelleAbrege: string | null; codeType: string | null }>,
): string | null {
  if (!acteur) return null;
  if (acteur.groupe) return organes.get(acteur.groupe)?.libelleAbrege ?? null;
  if (acteur.organes_refs?.length) {
    for (const code of ['GP', 'GOUVERNEMENT'] as const) {
      for (const ref of acteur.organes_refs) {
        const org = organes.get(ref);
        if (org?.codeType === code) return code === 'GOUVERNEMENT' ? 'Gouvernement' : org.libelleAbrege;
      }
    }
    return organes.get(acteur.organes_refs[0])?.libelleAbrege ?? null;
  }
  return null;
}

/** Résout la chambre d'origine d'un acteur (pour le badge AN/Sénat/Gouv) */
function resolveAuteurChambre(
  acteur: { groupe: string | null; organes_refs: string[] | null } | null | undefined,
  organes: Map<string, { name: string; libelleAbrege: string | null; codeType: string | null }>,
): 'AN' | 'SENAT' | 'GOUV' | null {
  if (!acteur) return null;
  for (const ref of acteur.organes_refs ?? []) {
    if (organes.get(ref)?.codeType === 'GOUVERNEMENT') return 'GOUV';
  }
  for (const ref of acteur.organes_refs ?? []) {
    const c = organes.get(ref)?.codeType;
    if (c === 'ASSEMBLEE') return 'AN';
    if (c === 'SENAT') return 'SENAT';
  }
  if (acteur.groupe && organes.get(acteur.groupe)?.codeType === 'GP') return 'AN';
  return null;
}

/** Transforme un acte brut en FeedEvent enrichi */
function acteToFeedEvent(
  a: ActeRow,
  dossierInfo: { titre: string; initiateurActeurRef: string | null; groupeAbrege: string | null } | null,
  textes: Map<string, { uid: string; denomination: string | null; titre_principal: string | null; lien_texte: string | null; provenance: string | null; statut_adoption: string | null; url_accessible: boolean | null; auteurs_refs: string[] | null; has_tomes: boolean | null; rapporteurs_refs: string[] | null }>,
  organes: Map<string, { name: string; libelleAbrege: string | null; codeType: string | null }>,
  scrutinsMap: Map<string, { uid: string; titre: string | null; sort_libelle: string | null; type_vote_code: string | null; type_vote_libelle: string | null; type_majorite: string | null; synthese_pour: number | null; synthese_contre: number | null; synthese_abstentions: number | null; synthese_nombre_votants: number | null; synthese_non_votants: number | null; synthese_suffrages_requis: number | null }>,
  acteurs: Map<string, { prenom: string; nom: string; groupe: string | null; organes_refs: string[] | null }>,
): FeedEvent {
  const type = classifyByLibelle(a.libelle_acte);
  const texte = a.textes_associes?.[0] ? textes.get(a.textes_associes[0]) : null;
  const texteAdopte = a.texte_adopte ? textes.get(a.texte_adopte) : null;
  const organeData = a.organe_ref ? organes.get(a.organe_ref) : null;
  const scrutinsList = (a.vote_refs ?? []).map(ref => scrutinsMap.get(ref)).filter(Boolean) as NonNullable<ReturnType<typeof scrutinsMap.get>>[];
  const scrutin = scrutinsList[0] ?? null;

  // ── Auteur & groupe ──────────────────────────────────────────────────────
  const WITH_AUTEUR = new Set<FeedEventType>(['DEPOT_TEXTE', 'DECISION', 'NAVETTE', 'CMP_CONVOCATION', 'CMP_RAPPORT']);
  let auteur: string | null = null;
  let groupeAbrege: string | null = null;
  let auteurChambre: 'AN' | 'SENAT' | 'GOUV' | null = null;
  let rapporteurName: string | null = null;
  let rapporteurGroupe: string | null = null;
  let rapporteurIsMultiple: boolean | null = null;

  if (WITH_AUTEUR.has(type)) {
    if (type === 'DEPOT_TEXTE') {
      // Source principale : auteurs_refs du texte ; fallback : initiateur du dossier
      const auteurUid = texte?.auteurs_refs?.[0] ?? dossierInfo?.initiateurActeurRef ?? null;
      const acteurData = auteurUid ? acteurs.get(auteurUid) : null;
      auteur = acteurData ? `${acteurData.prenom} ${acteurData.nom}`.trim() : null;
      groupeAbrege = resolveGroupeAbrege(acteurData, organes);
      auteurChambre = resolveAuteurChambre(acteurData, organes);
    } else {
      const auteurUid = dossierInfo?.initiateurActeurRef ?? null;
      const acteurData = auteurUid ? acteurs.get(auteurUid) : null;
      auteur = acteurData ? `${acteurData.prenom} ${acteurData.nom}`.trim() : null;
      groupeAbrege = dossierInfo?.groupeAbrege ?? null;
      auteurChambre = resolveAuteurChambre(acteurData, organes);
    }
  }

  // ── Rapporteur (DEPOT_RAPPORT + CMP_RAPPORT) ────────────────────────────
  if (type === 'DEPOT_RAPPORT' || type === 'CMP_RAPPORT') {
    const rapporteurUid = texte?.rapporteurs_refs?.[0] ?? null;
    const rapporteurData = rapporteurUid ? acteurs.get(rapporteurUid) : null;
    if (rapporteurData) {
      rapporteurName = `${rapporteurData.prenom} ${rapporteurData.nom}`.trim();
      rapporteurGroupe = resolveGroupeAbrege(rapporteurData, organes);
      rapporteurIsMultiple = (texte?.rapporteurs_refs?.length ?? 0) > 1;
    }
  }

  return {
    id: `acte-${a.uid}`,
    type,
    date: a.date_acte,
    titre: a.libelle_acte || a.code_acte,
    dossierUid: a.dossier_uid,
    dossierTitre: dossierInfo?.titre ?? null,
    libelleActe: a.libelle_acte,
    codeActe: a.code_acte,
    // DEPOT_TEXTE + DEPOT_RAPPORT : libelle_abrege (version courte) ; autres types : nom complet
    organeName: (type === 'DEPOT_TEXTE' || type === 'DEPOT_RAPPORT') ? (organeData?.libelleAbrege ?? organeData?.name ?? null) : (organeData?.name ?? null),
    texteUid: texte?.uid ?? null,
    texteDenomination: texte?.denomination ?? null,
    texteTitre: texte?.titre_principal ?? null,
    texteLien: texte?.lien_texte ?? null,
    texteAdopteUid: texteAdopte?.uid ?? null,
    texteAdopteDenomination: texteAdopte?.denomination ?? null,
    texteAdopteTitre: texteAdopte?.titre_principal ?? null,
    texteAdopteLien: texteAdopte?.lien_texte ?? null,
    texteUrlAccessible: texte?.url_accessible ?? null,
    scrutinUid: scrutin?.uid ?? null,
    scrutinTitre: scrutin?.titre ?? null,
    typeVoteCode: scrutin?.type_vote_code ?? null,
    typeVoteLibelle: scrutin?.type_vote_libelle ?? null,
    typeMajorite: scrutin?.type_majorite ?? null,
    statutConclusion: a.statut_conclusion,
    auteur,
    groupeAbrege,
    auteurChambre,
    texteProvenance: texte?.provenance ?? null,
    texteHasTomes: texte?.has_tomes ?? null,
    organeCodeType: organeData?.codeType ?? null,
    rapporteurName,
    rapporteurGroupe,
    rapporteurIsMultiple,
    codeLoi: a.code_loi ?? null,
    titreLoi: a.titre_loi ?? null,
    votePour: scrutin?.synthese_pour ?? null,
    voteContre: scrutin?.synthese_contre ?? null,
    voteAbstentions: scrutin?.synthese_abstentions ?? null,
    voteVotants: scrutin?.synthese_nombre_votants ?? null,
    voteNonVotants: scrutin?.synthese_non_votants ?? null,
    voteSuffragesRequis: scrutin?.synthese_suffrages_requis ?? null,
    scrutins: scrutinsList.map(s => ({
      uid: s.uid,
      titre: s.titre,
      typeVoteCode: s.type_vote_code,
      typeVoteLibelle: s.type_vote_libelle,
      typeMajorite: s.type_majorite,
      votePour: s.synthese_pour,
      voteContre: s.synthese_contre,
      voteAbstentions: s.synthese_abstentions,
      voteVotants: s.synthese_nombre_votants,
      voteNonVotants: s.synthese_non_votants,
      voteSuffragesRequis: s.synthese_suffrages_requis,
      statutConclusion: a.statut_conclusion,
    })),
  };
}

/** Convertit une date en YYYY-MM-DD timezone Paris */
function toParisDateISO(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.split('T')[0] || 'unknown';
  const paris = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  return `${paris.getFullYear()}-${String(paris.getMonth() + 1).padStart(2, '0')}-${String(paris.getDate()).padStart(2, '0')}`;
}

/** Groupe des FeedEvents en GroupedFeedEvent[] */
function groupFeedEvents(feedEvents: FeedEvent[]): Map<string, GroupedFeedEvent> {
  const groupMap = new Map<string, GroupedFeedEvent>();
  for (const event of feedEvents) {
    const dateISO = event.date ? toParisDateISO(event.date) : 'unknown';
    const key = (event.type === 'DECISION' || event.type === 'CC_SAISINE' || event.type === 'MOTION_CENSURE')
      ? `${event.id}-${dateISO}-${event.type}`
      : `${event.dossierUid}-${dateISO}-${event.type}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      groupMap.set(key, {
        key,
        type: event.type,
        date: dateISO,
        dossierUid: event.dossierUid,
        dossierTitre: event.dossierTitre,
        events: [event],
      });
    }
  }
  return groupMap;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const dossierParam = typeof resolvedParams.dossier === 'string' ? resolvedParams.dossier : undefined;

  // =========================================================================
  // MODE DOSSIER : timeline complete d'un dossier legislatif
  // =========================================================================
  if (dossierParam) {
    // 1. Fetch tous les actes pour ce dossier (timeline)
    const timelineActes = await getDossierTimeline(supabase, dossierParam);

    // 2. Collecter tous les UIDs uniques
    const texteUids = new Set<string>();
    const organeUids = new Set<string>();
    const scrutinUids = new Set<string>();

    for (const a of timelineActes) {
      (a.textes_associes ?? []).forEach((t: string) => texteUids.add(t));
      if (a.texte_adopte) texteUids.add(a.texte_adopte);
      if (a.organe_ref) organeUids.add(a.organe_ref);
      (a.vote_refs ?? []).forEach((r: string) => scrutinUids.add(r));
    }

    // 3. Batch resolve textes, scrutins, dossier
    const [textes, scrutinsMap, dossierTitlesMap] = await Promise.all([
      getTextesByUids(supabase, [...texteUids]),
      getScrutinsByUids(supabase, [...scrutinUids]),
      getDossierTitles(supabase, [dossierParam]),
    ]);

    const dossierInfo = dossierTitlesMap.get(dossierParam);

    // 4. Collecter les UIDs d'acteurs (auteurs + rapporteurs des textes + initiateur du dossier)
    const acteurUids = new Set<string>();
    for (const texte of textes.values()) {
      if (texte.auteurs_refs?.[0]) acteurUids.add(texte.auteurs_refs[0]);
      if (texte.rapporteurs_refs?.[0]) acteurUids.add(texte.rapporteurs_refs[0]);
    }
    if (dossierInfo?.initiateurActeurRef) acteurUids.add(dossierInfo.initiateurActeurRef);

    // 5. Fetch acteurs, puis leurs organes de groupe
    const acteurs = await getActeursByUids(supabase, [...acteurUids]);
    for (const a of acteurs.values()) {
      if (a.groupe) organeUids.add(a.groupe);
      (a.organes_refs ?? []).forEach(r => organeUids.add(r));
    }
    const organes = await getOrganesByUids(supabase, [...organeUids]);

    // 6. Construire une map parent_uid → statut_conclusion pour les motions
    const motionConclusionMap = new Map<string, string>();
    for (const a of timelineActes) {
      if (a.parent_uid && a.statut_conclusion && classifyByLibelle(a.libelle_acte) === 'MOTION_VOTE') {
        motionConclusionMap.set(a.parent_uid, a.statut_conclusion);
      }
    }

    // 7. Transformer actes en FeedEvents
    const feedEvents: FeedEvent[] = timelineActes
      .map(a => {
        const type = classifyByLibelle(a.libelle_acte);
        if (type === 'MOTION_CENSURE' && !a.statut_conclusion) {
          const childConclusion = motionConclusionMap.get(a.uid) ?? null;
          const texteStatut = a.textes_associes?.[0] ? textes.get(a.textes_associes[0])?.statut_adoption ?? null : null;
          const scrutinFallback = a.vote_refs?.[0] ? scrutinsMap.get(a.vote_refs[0])?.sort_libelle ?? null : null;
          return acteToFeedEvent(
            { ...a, statut_conclusion: childConclusion ?? texteStatut ?? scrutinFallback },
            dossierInfo ?? null, textes, organes, scrutinsMap, acteurs,
          );
        }
        return acteToFeedEvent(a, dossierInfo ?? null, textes, organes, scrutinsMap, acteurs);
      })
      .filter(e => e.type !== 'AUTRE' && e.type !== 'MOTION_VOTE');

    // 5. Grouper par dossierUid + date + type
    const groupMap = groupFeedEvents(feedEvents);

    // Trier chronologiquement (plus ancien en premier pour la timeline)
    const groupedEvents = [...groupMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <MonthFeedClient
        groupedEvents={groupedEvents}
        dossierMode={true}
        dossierTitre={dossierInfo?.titre ?? null}
        dossierUid={dossierParam}
        kpis={{ totalEvents: feedEvents.length, scrutins: 0, nouveauxTextes: 0, promulgations: 0 }}
        year={0}
        monthFormatted=""
        monthRangeShort=""
        prevMonth=""
        nextMonth=""
        isCurrentOrFutureMonth={true}
      />
    );
  }

  // =========================================================================
  // MODE MOIS : fil mensuel
  // =========================================================================
  const moisParam = typeof resolvedParams.mois === 'string' ? resolvedParams.mois : undefined;
  const { monthStart, monthEnd, year, month } = getMonthBounds(moisParam);

  // Elargir les bornes de +/-1 jour pour compenser les decalages de timezone
  const queryStart = new Date(monthStart.getTime() - 86400000);
  const queryEnd = new Date(monthEnd.getTime() + 86400000);
  const monthStartISO = queryStart.toISOString();
  const monthEndISO = queryEnd.toISOString();

  // ── Vérification connectivité Supabase ──
  const { error: dbError } = await supabase.from('actes_legislatifs').select('uid').limit(1);
  if (dbError) throw new Error('db_unavailable');

  // ── Round 1 : actes du mois ──
  const [actes, motionActes] = await Promise.all([
    getMonthActes(supabase, monthStartISO, monthEndISO),
    getMonthMotionActes(supabase, monthStartISO, monthEndISO),
  ]);

  const uniqueMotions = [...new Map(motionActes.map(a => [a.uid, a])).values()];

  // ── Round 2 : résolutions intermédiaires ──
  const motionUids = uniqueMotions.map(a => a.uid);
  const motionDecisionMap = await getMotionDecisionActes(supabase, motionUids);

  // Collecter UIDs depuis actes + motions
  const texteUids = new Set<string>();
  const organeUids = new Set<string>();
  const scrutinUidsFromActes = new Set<string>();
  const dossierUidsSet = new Set<string>();

  for (const a of [...actes, ...uniqueMotions]) {
    (a.textes_associes ?? []).forEach((t: string) => texteUids.add(t));
    if (a.texte_adopte) texteUids.add(a.texte_adopte);
    if (a.organe_ref) organeUids.add(a.organe_ref);
    (a.vote_refs ?? []).forEach((r: string) => scrutinUidsFromActes.add(r));
    if (a.dossier_uid) dossierUidsSet.add(a.dossier_uid);
  }
  // ── Round 3 : textes, scrutins, dossiers ──
  const [dossierTitles, textes, scrutinsMapFromActes] = await Promise.all([
    getDossierTitles(supabase, [...dossierUidsSet]),
    getTextesByUids(supabase, [...texteUids]),
    getScrutinsByUids(supabase, [...scrutinUidsFromActes]),
  ]);

  // ── Round 4 : acteurs (auteurs + rapporteurs des textes + initiateurs des dossiers) ──
  const acteurUids = new Set<string>();
  for (const texte of textes.values()) {
    if (texte.auteurs_refs?.[0]) acteurUids.add(texte.auteurs_refs[0]);
    if (texte.rapporteurs_refs?.[0]) acteurUids.add(texte.rapporteurs_refs[0]);
  }
  for (const d of dossierTitles.values()) {
    if (d.initiateurActeurRef) acteurUids.add(d.initiateurActeurRef);
  }
  const acteurs = await getActeursByUids(supabase, [...acteurUids]);

  // Ajouter les organes de groupe des acteurs au batch organes
  for (const a of acteurs.values()) {
    if (a.groupe) organeUids.add(a.groupe);
    (a.organes_refs ?? []).forEach(r => organeUids.add(r));
  }
  const organes = await getOrganesByUids(supabase, [...organeUids]);

  // ── Transformation en FeedEvents ──
  const acteEvents: FeedEvent[] = actes
    .map(a => {
      const dossier = a.dossier_uid ? dossierTitles.get(a.dossier_uid) : null;
      return acteToFeedEvent(a, dossier ?? null, textes, organes, scrutinsMapFromActes, acteurs);
    })
    .filter(e => e.type !== 'AUTRE');

  const motionEvents: FeedEvent[] = uniqueMotions.map(a => {
    const dossier = a.dossier_uid ? dossierTitles.get(a.dossier_uid) : null;
    const childConclusion = motionDecisionMap.get(a.uid) ?? null;
    const texteStatut = a.textes_associes?.[0] ? textes.get(a.textes_associes[0])?.statut_adoption ?? null : null;
    const scrutinFallback = a.vote_refs?.[0] ? scrutinsMapFromActes.get(a.vote_refs[0])?.sort_libelle ?? null : null;
    return acteToFeedEvent(
      { ...a, statut_conclusion: childConclusion ?? texteStatut ?? scrutinFallback },
      dossier ?? null, textes, organes, scrutinsMapFromActes, acteurs,
    );
  });

  const allEvents: FeedEvent[] = [...acteEvents, ...motionEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtrer les events du buffer ±1j qui tombent hors du mois (timezone Paris)
  const monthStartISO_paris = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEndISO_paris = `${year}-${String(month + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
  const monthEvents = allEvents.filter(event => {
    const iso = toParisDateISO(event.date);
    return iso >= monthStartISO_paris && iso <= monthEndISO_paris;
  });

  // KPIs calculés à partir des événements du mois (post-timezone)
  const kpis: MonthKpis = {
    totalEvents: monthEvents.length,
    scrutins: monthEvents.filter(e => e.type === 'DECISION').length,
    nouveauxTextes: monthEvents.filter(e => e.type === 'DEPOT_TEXTE').length,
    promulgations: monthEvents.filter(e => e.type === 'PROMULGATION').length,
  };

  // Grouper les événements filtrés
  const groupMap = groupFeedEvents(monthEvents);
  const groupedEvents = [...groupMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  // Navigation entre mois
  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);

  const prevMonth = formatISOMonth(prevMonthDate);
  const nextMonth = formatISOMonth(nextMonthDate);

  const isCurrentOrFutureMonth = monthEnd >= new Date();

  // Formatage du mois : "février 2026"
  const monthNoon = new Date(year, month, 15, 12, 0, 0);
  const monthFormatted = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(monthNoon);

  // Format court pour le pill : "fév. 2026"
  const monthRangeShort = new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(monthNoon);

  return (
    <MonthFeedClient
      groupedEvents={groupedEvents}
      dossierMode={false}
      dossierTitre={null}
      kpis={kpis}
      year={year}
      monthFormatted={monthFormatted}
      monthRangeShort={monthRangeShort}
      prevMonth={prevMonth}
      nextMonth={nextMonth}
      isCurrentOrFutureMonth={isCurrentOrFutureMonth}
    />
  );
}
