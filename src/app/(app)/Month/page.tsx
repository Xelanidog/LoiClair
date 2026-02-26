// src/app/(app)/Month/page.tsx
// Server Component — Fetch des donnees du mois (ou d'un dossier) et transformation en evenements enrichis

import { supabase } from '@/lib/supabase';
import {
  getMonthActes,
  getMonthScrutins,
  getMonthDossiers,
  getDossierTitles,
  getScrutinActeMap,
  getDossierTimeline,
  getTextesByUids,
  getOrganesByUids,
  getScrutinsByUids,
  getMonthMotionActes,
  getMotionDecisionActes,
  getMonthImportantSubActes,
} from './monthQueries';
import { MonthFeedClient } from './MonthFeedClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fil du Mois — LoiClair',
  description: 'Les evenements legislatifs du mois : votes, depots, promulgations et plus encore.',
};

// ---------------------------------------------------------------------------
// Types exportes pour le client
// ---------------------------------------------------------------------------

export type FeedEventType =
  | 'DEPOT_TEXTE'
  | 'DEPOT_RAPPORT'
  | 'DECISION'
  | 'NAVETTE'
  | 'CMP_CONVOCATION'
  | 'CMP_RAPPORT'
  | 'MOTION_CENSURE'
  | 'DECL_GOUVERNEMENT'
  | 'MOTION_VOTE'
  | 'CC_SAISINE'
  | 'PROMULGATION'
  | 'AUTRE';

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
  scrutinUid: string | null;
  scrutinTitre: string | null;
  statutConclusion: string | null;
  // Auteur (pour DEPOT_TEXTE) / Provenance (pour DEPOT_RAPPORT)
  auteur: string | null;
  groupeAbrege: string | null;
  texteProvenance: string | null;
  organeCodeType: string | null;
  // Vote details (optional)
  votePour?: number | null;
  voteContre?: number | null;
  voteAbstentions?: number | null;
  voteVotants?: number | null;
  voteNonVotants?: number | null;
  voteSuffragesRequis?: number | null;
};

export type GroupedFeedEvent = {
  key: string; // `${dossierUid}-${dateISO}-${type}`
  type: FeedEventType;
  date: string;
  dossierUid: string | null;
  dossierTitre: string | null;
  events: FeedEvent[];
};

export type WeekKpis = {
  totalEvents: number;
  scrutins: number;
  nouveauxTextes: number;
  promulgations: number;
};

// Type interne pour le calcul des KPIs semaine (non exporte)
type DayGroup = {
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  events: FeedEvent[];
};

// ---------------------------------------------------------------------------
// Classification par libelle
// ---------------------------------------------------------------------------

const LIBELLE_TO_TYPE: Record<string, FeedEventType> = {
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

/** Transforme un acte brut en FeedEvent enrichi */
function acteToFeedEvent(
  a: { uid: string; code_acte: string; libelle_acte: string | null; date_acte: string; statut_conclusion: string | null; organe_ref: string | null; vote_refs: string | null; textes_associes: string | null; texte_adopte: string | null; dossier_uid: string | null },
  dossierInfo: { titre: string; auteur: string | null; groupeAbrege: string | null } | null,
  textes: Map<string, { uid: string; denomination: string | null; titre_principal: string | null; lien_texte: string | null; provenance: string | null }>,
  organes: Map<string, { name: string; codeType: string | null }>,
  scrutinsMap: Map<string, { uid: string; titre: string | null; sort_libelle: string | null; synthese_pour: number | null; synthese_contre: number | null; synthese_abstentions: number | null; synthese_nombre_votants: number | null; synthese_non_votants: number | null; synthese_suffrages_requis: number | null }>,
): FeedEvent {
  const type = classifyByLibelle(a.libelle_acte);
  const texte = a.textes_associes ? textes.get(a.textes_associes) : null;
  const texteAdopte = a.texte_adopte ? textes.get(a.texte_adopte) : null;
  const organeData = a.organe_ref ? organes.get(a.organe_ref) : null;
  const scrutin = a.vote_refs ? scrutinsMap.get(a.vote_refs) : null;

  return {
    id: `acte-${a.uid}`,
    type,
    date: a.date_acte,
    titre: a.libelle_acte || a.code_acte,
    dossierUid: a.dossier_uid,
    dossierTitre: dossierInfo?.titre ?? null,
    libelleActe: a.libelle_acte,
    codeActe: a.code_acte,
    organeName: organeData?.name ?? null,
    texteUid: texte?.uid ?? null,
    texteDenomination: texte?.denomination ?? null,
    texteTitre: texte?.titre_principal ?? null,
    texteLien: texte?.lien_texte ?? null,
    texteAdopteUid: texteAdopte?.uid ?? null,
    texteAdopteDenomination: texteAdopte?.denomination ?? null,
    texteAdopteTitre: texteAdopte?.titre_principal ?? null,
    texteAdopteLien: texteAdopte?.lien_texte ?? null,
    scrutinUid: scrutin?.uid ?? null,
    scrutinTitre: scrutin?.titre ?? null,
    statutConclusion: a.statut_conclusion,
    auteur: (type === 'DEPOT_TEXTE' || type === 'DECISION' || type === 'NAVETTE' || type === 'CMP_CONVOCATION' || type === 'CMP_RAPPORT') ? (dossierInfo?.auteur ?? null) : null,
    groupeAbrege: (type === 'DEPOT_TEXTE' || type === 'DECISION' || type === 'NAVETTE' || type === 'CMP_CONVOCATION' || type === 'CMP_RAPPORT') ? (dossierInfo?.groupeAbrege ?? null) : null,
    texteProvenance: texte?.provenance ?? null,
    organeCodeType: organeData?.codeType ?? null,
    votePour: scrutin?.synthese_pour ?? null,
    voteContre: scrutin?.synthese_contre ?? null,
    voteAbstentions: scrutin?.synthese_abstentions ?? null,
    voteVotants: scrutin?.synthese_nombre_votants ?? null,
    voteNonVotants: scrutin?.synthese_non_votants ?? null,
    voteSuffragesRequis: scrutin?.synthese_suffrages_requis ?? null,
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
    const key = `${event.dossierUid}-${dateISO}-${event.type}`;
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

export default async function WeekPage({
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
      if (a.textes_associes) texteUids.add(a.textes_associes);
      if (a.texte_adopte) texteUids.add(a.texte_adopte);
      if (a.organe_ref) organeUids.add(a.organe_ref);
      if (a.vote_refs) scrutinUids.add(a.vote_refs);
    }

    // 3. Batch resolve toutes les refs
    const [textes, organes, scrutinsMap, dossierTitlesMap] = await Promise.all([
      getTextesByUids(supabase, [...texteUids]),
      getOrganesByUids(supabase, [...organeUids]),
      getScrutinsByUids(supabase, [...scrutinUids]),
      getDossierTitles(supabase, [dossierParam]),
    ]);

    const dossierInfo = dossierTitlesMap.get(dossierParam);

    // 4. Construire une map parent_uid → statut_conclusion pour les motions
    // Les actes "Décision sur une motion de censure" (MOTION_VOTE) ont le statut ; on l'injecte dans leurs parents (MOTION_CENSURE)
    const motionConclusionMap = new Map<string, string>();
    for (const a of timelineActes) {
      if (a.parent_uid && a.statut_conclusion && classifyByLibelle(a.libelle_acte) === 'MOTION_VOTE') {
        motionConclusionMap.set(a.parent_uid, a.statut_conclusion);
      }
    }

    // 5. Transformer actes en FeedEvents (injecter les conclusions pour MOTION_CENSURE)
    const feedEvents: FeedEvent[] = timelineActes
      .map(a => {
        const type = classifyByLibelle(a.libelle_acte);
        if (type === 'MOTION_CENSURE' && !a.statut_conclusion) {
          const childConclusion = motionConclusionMap.get(a.uid) ?? null;
          const texteStatut = a.textes_associes ? textes.get(a.textes_associes)?.statut_adoption ?? null : null;
          const scrutinFallback = a.vote_refs ? scrutinsMap.get(a.vote_refs)?.sort_libelle ?? null : null;
          return acteToFeedEvent(
            { ...a, statut_conclusion: childConclusion ?? texteStatut ?? scrutinFallback },
            dossierInfo ?? null, textes, organes, scrutinsMap,
          );
        }
        return acteToFeedEvent(a, dossierInfo ?? null, textes, organes, scrutinsMap);
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
        dayGroups={[]}
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

  // Fetch en parallele
  const [actes, scrutins, newDossiers, motionActes, importantSubActes] = await Promise.all([
    getMonthActes(supabase, monthStartISO, monthEndISO),
    getMonthScrutins(supabase, monthStartISO, monthEndISO),
    getMonthDossiers(supabase, monthStartISO, monthEndISO),
    getMonthMotionActes(supabase, monthStartISO, monthEndISO),
    getMonthImportantSubActes(supabase, monthStartISO, monthEndISO),
  ]);

  // Dédupliquer les motions par uid (la base peut contenir des doublons)
  const uniqueMotions = [...new Map(motionActes.map(a => [a.uid, a])).values()];

  // Filtrer les scrutins significatifs (JS seulement, pas de requête)
  const filteredScrutins = scrutins.filter(s => {
    const titre = (s.titre || '').toLowerCase();
    return titre.includes('ensemble') || titre.includes('motion de rejet');
  });

  // ── Round 2 : résolutions intermédiaires (parallèle) ──
  const motionUids = uniqueMotions.map(a => a.uid);
  const scrutinUidsForMap = filteredScrutins.map(s => s.uid);
  const [motionDecisionMap, scrutinActeMap] = await Promise.all([
    getMotionDecisionActes(supabase, motionUids),
    getScrutinActeMap(supabase, scrutinUidsForMap),
  ]);

  // Collecter TOUS les UIDs depuis actes + motions + scrutinActeMap
  const texteUids = new Set<string>();
  const organeUids = new Set<string>();
  const scrutinUidsFromActes = new Set<string>();
  const dossierUidsSet = new Set<string>();

  for (const a of [...actes, ...uniqueMotions, ...importantSubActes]) {
    if (a.textes_associes) texteUids.add(a.textes_associes);
    if (a.texte_adopte) texteUids.add(a.texte_adopte);
    if (a.organe_ref) organeUids.add(a.organe_ref);
    if (a.vote_refs) scrutinUidsFromActes.add(a.vote_refs);
    if (a.dossier_uid) dossierUidsSet.add(a.dossier_uid);
  }

  for (const acte of scrutinActeMap.values()) {
    if (acte.dossier_uid) dossierUidsSet.add(acte.dossier_uid);
    if (acte.organe_ref) organeUids.add(acte.organe_ref);
    if (acte.textes_associes) texteUids.add(acte.textes_associes);
    if (acte.texte_adopte) texteUids.add(acte.texte_adopte);
    if (acte.vote_refs) scrutinUidsFromActes.add(acte.vote_refs);
  }

  // ── Round 3 : résolution unique de toutes les refs (parallèle) ──
  const [dossierTitles, textes, organes, scrutinsMapFromActes] = await Promise.all([
    getDossierTitles(supabase, [...dossierUidsSet]),
    getTextesByUids(supabase, [...texteUids]),
    getOrganesByUids(supabase, [...organeUids]),
    getScrutinsByUids(supabase, [...scrutinUidsFromActes]),
  ]);

  // Injecter les scrutins filtrés (données déjà disponibles depuis round 1)
  for (const s of filteredScrutins) {
    if (!scrutinsMapFromActes.has(s.uid)) {
      scrutinsMapFromActes.set(s.uid, s);
    }
  }

  // Transformer les actes en FeedEvents enrichis (filtrer AUTRE)
  const acteEvents: FeedEvent[] = actes
    .map(a => {
      const dossier = a.dossier_uid ? dossierTitles.get(a.dossier_uid) : null;
      return acteToFeedEvent(
        a,
        dossier ?? null,
        textes,
        organes,
        scrutinsMapFromActes,
      );
    })
    .filter(e => e.type !== 'AUTRE');

  // Réutiliser acteToFeedEvent pour les scrutins ayant un acte lié (pas de duplication)
  const scrutinEvents: FeedEvent[] = filteredScrutins.map(s => {
    const acte = scrutinActeMap.get(s.uid);
    if (acte) {
      const dossier = acte.dossier_uid ? dossierTitles.get(acte.dossier_uid) : null;
      return acteToFeedEvent(acte, dossier ?? null, textes, organes, scrutinsMapFromActes);
    }
    // Fallback : scrutin sans acte lié (rare, ex: motion de rejet sans dossier)
    return {
      id: `scrutin-${s.uid}`,
      type: 'DECISION' as FeedEventType,
      date: s.date_scrutin,
      titre: s.titre || `Scrutin n${s.numero}`,
      dossierUid: null, dossierTitre: null, libelleActe: null, codeActe: null,
      organeName: null, texteUid: null, texteDenomination: null, texteTitre: null,
      texteLien: null, texteAdopteUid: null, texteAdopteDenomination: null,
      texteAdopteTitre: null, texteAdopteLien: null,
      scrutinUid: s.uid, scrutinTitre: s.titre, statutConclusion: s.sort_libelle,
      auteur: null, groupeAbrege: null, texteProvenance: null, organeCodeType: null,
      votePour: s.synthese_pour, voteContre: s.synthese_contre,
      voteAbstentions: s.synthese_abstentions, voteVotants: s.synthese_nombre_votants,
      voteNonVotants: s.synthese_non_votants, voteSuffragesRequis: s.synthese_suffrages_requis,
    };
  });

  // Transformer les sous-actes importants en FeedEvents enrichis
  const importantSubActeEvents: FeedEvent[] = importantSubActes
    .map(a => {
      const dossier = a.dossier_uid ? dossierTitles.get(a.dossier_uid) : null;
      return acteToFeedEvent(a, dossier ?? null, textes, organes, scrutinsMapFromActes);
    })
    .filter(e => e.type !== 'AUTRE');

  // Transformer les nouveaux dossiers en FeedEvents DEPOT_TEXTE
  // (seulement ceux qui ne sont pas deja dans acteEvents, motionEvents ou importantSubActeEvents)
  const acteDossierUids = new Set(acteEvents.filter(e => e.type === 'DEPOT_TEXTE').map(e => e.dossierUid));
  const motionDossierUids = new Set(uniqueMotions.map(a => a.dossier_uid).filter(Boolean));
  const subActeDossierUids = new Set(importantSubActes.map(a => a.dossier_uid).filter(Boolean));
  const dossierEvents: FeedEvent[] = newDossiers
    .filter(d => !acteDossierUids.has(d.uid) && !motionDossierUids.has(d.uid) && !subActeDossierUids.has(d.uid))
    .map(d => {
      const acteurRef = d.initiateur_acteur_ref as unknown as { nom: string; prenom: string } | null;
      const acteur = acteurRef ?? null;
      return {
        id: `dossier-${d.uid}`,
        type: 'DEPOT_TEXTE' as const,
        date: d.date_depot,
        titre: d.titre,
        dossierUid: d.uid,
        dossierTitre: d.titre,
        libelleActe: "1er dépôt d'une initiative.",
        codeActe: null,
        organeName: null,
        texteUid: null,
        texteDenomination: null,
        texteTitre: null,
        texteLien: null,
        texteAdopteUid: null,
        texteAdopteDenomination: null,
        texteAdopteTitre: null,
        texteAdopteLien: null,
        scrutinUid: null,
        scrutinTitre: null,
        statutConclusion: null,
        auteur: acteur ? `${acteur.prenom} ${acteur.nom}` : null,
        groupeAbrege: d.initiateur_groupe_libelle ?? null,
        texteProvenance: null,
        organeCodeType: null,
      };
    });

  // Construire les FeedEvents des motions de censure
  // Chaîne de fallback pour le statut : enfant statut_conclusion → texte statut_adoption → scrutin sort_libelle
  const motionEvents: FeedEvent[] = uniqueMotions.map(a => {
    const dossier = a.dossier_uid ? dossierTitles.get(a.dossier_uid) : null;
    const childConclusion = motionDecisionMap.get(a.uid) ?? null;
    const texteStatut = a.textes_associes ? textes.get(a.textes_associes)?.statut_adoption ?? null : null;
    const scrutinFallback = a.vote_refs ? scrutinsMapFromActes.get(a.vote_refs)?.sort_libelle ?? null : null;
    return acteToFeedEvent(
      { ...a, statut_conclusion: childConclusion ?? texteStatut ?? scrutinFallback },
      dossier ?? null,
      textes,
      organes,
      scrutinsMapFromActes,
    );
  });

  // Fusionner tous les evenements
  const allEvents = [...acteEvents, ...scrutinEvents, ...dossierEvents, ...motionEvents, ...importantSubActeEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Grouper par jour pour les KPIs (avant le groupement, pour filtrer les events hors mois)
  const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'Europe/Paris' });
  const monthNameFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'Europe/Paris' });

  const dayGroupsMap = new Map<string, DayGroup>();
  const daysInMonth = monthEnd.getDate();

  for (let i = daysInMonth; i >= 1; i--) {
    const d = new Date(year, month, i, 12, 0, 0);
    const iso = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
    dayGroupsMap.set(iso, {
      date: iso,
      dayName: dayFormatter.format(d),
      dayNumber: i,
      monthName: monthNameFormatter.format(d),
      events: [],
    });
  }

  // Distribuer les evenements dans les jours
  for (const event of allEvents) {
    const eventDate = new Date(event.date);
    const parisDate = new Date(eventDate.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const iso = `${parisDate.getFullYear()}-${String(parisDate.getMonth() + 1).padStart(2, '0')}-${String(parisDate.getDate()).padStart(2, '0')}`;
    const group = dayGroupsMap.get(iso);
    if (group) {
      group.events.push(event);
    }
  }

  const dayGroups = [...dayGroupsMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  // KPIs calcules a partir des evenements distribues (post-timezone)
  const distributedEvents = dayGroups.flatMap(d => d.events);
  const kpis: WeekKpis = {
    totalEvents: distributedEvents.length,
    scrutins: distributedEvents.filter(e => e.type === 'DECISION').length,
    nouveauxTextes: distributedEvents.filter(e => e.type === 'DEPOT_TEXTE').length,
    promulgations: distributedEvents.filter(e => e.type === 'PROMULGATION').length,
  };

  // Grouper uniquement les events distribues (pas ceux du buffer ±1j)
  const groupMap = groupFeedEvents(distributedEvents);
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
      dayGroups={dayGroups}
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
