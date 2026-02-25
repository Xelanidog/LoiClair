// src/app/(app)/Week/page.tsx
// Server Component — Fetch des donnees de la semaine (ou d'un dossier) et transformation en evenements enrichis

import { supabase } from '@/lib/supabase';
import {
  getWeekActes,
  getWeekScrutins,
  getWeekDossiers,
  getDossierTitles,
  getScrutinActeMap,
  getDossierTimeline,
  getTextesByUids,
  getOrganesByUids,
  getScrutinsByUids,
  getWeekMotionActes,
  getMotionDecisionActes,
} from './weekQueries';
import { WeekFeedClient } from './WeekFeedClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fil de la Semaine — LoiClair',
  description: 'Les evenements legislatifs de la semaine : votes, depots, promulgations et plus encore.',
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

function getWeekBounds(isoWeek?: string): { weekStart: Date; weekEnd: Date; weekNumber: number; year: number } {
  let date: Date;

  if (isoWeek && /^\d{4}-W\d{2}$/.test(isoWeek)) {
    const [yearStr, weekStr] = isoWeek.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    date = new Date(jan4);
    date.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  } else {
    date = new Date();
    const dayOfWeek = date.getDay() || 7;
    date.setDate(date.getDate() - dayOfWeek + 1);
  }

  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const jan4 = new Date(weekStart.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
  const dayOfWeekJan4 = jan4.getDay() || 7;
  const weekNumber = Math.ceil((dayOfYear + dayOfWeekJan4 - 1) / 7);

  return { weekStart, weekEnd, weekNumber, year: weekStart.getFullYear() };
}

function formatISOWeek(date: Date): string {
  const year = date.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
  const dayOfWeekJan4 = jan4.getDay() || 7;
  const weekNum = Math.ceil((dayOfYear + dayOfWeekJan4 - 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
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
      .filter(e => e.type !== 'AUTRE');

    // 5. Grouper par dossierUid + date + type
    const groupMap = groupFeedEvents(feedEvents);

    // Trier chronologiquement (plus ancien en premier pour la timeline)
    const groupedEvents = [...groupMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <WeekFeedClient
        groupedEvents={groupedEvents}
        dossierMode={true}
        dossierTitre={dossierInfo?.titre ?? null}
        dayGroups={[]}
        kpis={{ totalEvents: feedEvents.length, scrutins: 0, nouveauxTextes: 0, promulgations: 0 }}
        weekNumber={0}
        year={0}
        weekStartFormatted=""
        weekEndFormatted=""
        weekRangeShort=""
        prevWeek=""
        nextWeek=""
        isCurrentOrFutureWeek={true}
      />
    );
  }

  // =========================================================================
  // MODE SEMAINE : fil hebdomadaire classique
  // =========================================================================
  const semaineParam = typeof resolvedParams.semaine === 'string' ? resolvedParams.semaine : undefined;
  const { weekStart, weekEnd, weekNumber, year } = getWeekBounds(semaineParam);

  // Elargir les bornes de +/-1 jour pour compenser les decalages de timezone
  const queryStart = new Date(weekStart.getTime() - 86400000);
  const queryEnd = new Date(weekEnd.getTime() + 86400000);
  const weekStartISO = queryStart.toISOString();
  const weekEndISO = queryEnd.toISOString();

  // Fetch en parallele
  const [actes, scrutins, newDossiers, motionActes] = await Promise.all([
    getWeekActes(supabase, weekStartISO, weekEndISO),
    getWeekScrutins(supabase, weekStartISO, weekEndISO),
    getWeekDossiers(supabase, weekStartISO, weekEndISO),
    getWeekMotionActes(supabase, weekStartISO, weekEndISO),
  ]);

  // Dédupliquer les motions par uid (la base peut contenir des doublons)
  const uniqueMotions = [...new Map(motionActes.map(a => [a.uid, a])).values()];

  // Récupérer les statut_conclusion des enfants "Décision sur une motion de censure"
  const motionUids = uniqueMotions.map(a => a.uid);
  const motionDecisionMap = await getMotionDecisionActes(supabase, motionUids);

  // Collecter tous les UIDs a resoudre depuis les actes ET les motions
  const texteUids = new Set<string>();
  const organeUids = new Set<string>();
  const scrutinUidsFromActes = new Set<string>();

  for (const a of [...actes, ...uniqueMotions]) {
    if (a.textes_associes) texteUids.add(a.textes_associes);
    if (a.texte_adopte) texteUids.add(a.texte_adopte);
    if (a.organe_ref) organeUids.add(a.organe_ref);
    if (a.vote_refs) scrutinUidsFromActes.add(a.vote_refs);
  }

  // Recuperer titres dossiers + refs enrichis en parallele
  const dossierUids = [...new Set([...actes, ...uniqueMotions].map(a => a.dossier_uid).filter(Boolean))] as string[];
  const [dossierTitles, textes, organes, scrutinsMapFromActes] = await Promise.all([
    getDossierTitles(supabase, dossierUids),
    getTextesByUids(supabase, [...texteUids]),
    getOrganesByUids(supabase, [...organeUids]),
    getScrutinsByUids(supabase, [...scrutinUidsFromActes]),
  ]);

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

  // Transformer les scrutins en FeedEvents de type DECISION
  // Garder uniquement les votes significatifs pour un citoyen
  const filteredScrutins = scrutins.filter(s => {
    const titre = (s.titre || '').toLowerCase();
    return titre.includes('ensemble') || titre.includes('motion de rejet');
  });

  // Lier les scrutins a leurs actes via actes_legislatifs.vote_refs
  const scrutinUidsForMap = filteredScrutins.map(s => s.uid);
  const scrutinActeMap = await getScrutinActeMap(supabase, scrutinUidsForMap);

  // Collecter les UIDs manquants des actes liés aux scrutins
  const missingDossierUids: string[] = [];
  const missingOrganeUids: string[] = [];
  const missingTexteUids: string[] = [];
  for (const acte of scrutinActeMap.values()) {
    if (acte.dossier_uid && !dossierTitles.has(acte.dossier_uid)) missingDossierUids.push(acte.dossier_uid);
    if (acte.organe_ref && !organes.has(acte.organe_ref)) missingOrganeUids.push(acte.organe_ref);
    if (acte.textes_associes && !textes.has(acte.textes_associes)) missingTexteUids.push(acte.textes_associes);
    if (acte.texte_adopte && !textes.has(acte.texte_adopte)) missingTexteUids.push(acte.texte_adopte);
  }

  const [extraTitles, extraOrganes, extraTextes] = await Promise.all([
    getDossierTitles(supabase, [...new Set(missingDossierUids)]),
    getOrganesByUids(supabase, [...new Set(missingOrganeUids)]),
    getTextesByUids(supabase, [...new Set(missingTexteUids)]),
  ]);
  for (const [uid, val] of extraTitles) dossierTitles.set(uid, val);
  for (const [uid, val] of extraOrganes) organes.set(uid, val);
  for (const [uid, val] of extraTextes) textes.set(uid, val);

  // Ajouter les scrutins filtrés dans scrutinsMap pour résolution des votes
  for (const s of filteredScrutins) {
    if (!scrutinsMapFromActes.has(s.uid)) {
      scrutinsMapFromActes.set(s.uid, s);
    }
  }

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

  // Transformer les nouveaux dossiers en FeedEvents DEPOT_TEXTE
  // (seulement ceux qui ne sont pas deja dans acteEvents)
  const acteDossierUids = new Set(acteEvents.filter(e => e.type === 'DEPOT_TEXTE').map(e => e.dossierUid));
  const dossierEvents: FeedEvent[] = newDossiers
    .filter(d => !acteDossierUids.has(d.uid))
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
  const allEvents = [...acteEvents, ...scrutinEvents, ...dossierEvents, ...motionEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Grouper par jour pour les KPIs (avant le groupement, pour filtrer les events hors semaine)
  const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', timeZone: 'Europe/Paris' });
  const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'Europe/Paris' });

  const dayGroupsMap = new Map<string, DayGroup>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
    const parisDate = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    dayGroupsMap.set(iso, {
      date: iso,
      dayName: dayFormatter.format(d),
      dayNumber: parisDate.getDate(),
      monthName: monthFormatter.format(d),
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

  // Navigation entre semaines
  const prevWeekDate = new Date(weekStart);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const nextWeekDate = new Date(weekStart);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  const prevWeek = formatISOWeek(prevWeekDate);
  const nextWeek = formatISOWeek(nextWeekDate);

  const isCurrentOrFutureWeek = weekEnd >= new Date();

  // Formatage des dates de la semaine
  const weekStartNoon = new Date(weekStart);
  weekStartNoon.setHours(12, 0, 0, 0);
  const weekEndNoon = new Date(weekEnd);
  weekEndNoon.setHours(12, 0, 0, 0);

  const weekStartFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(weekStartNoon);

  const weekEndFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(weekEndNoon);

  // Format court pour le pill de semaine : "10-16 fev."
  const shortMonthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'Europe/Paris' });
  const startDay = weekStartNoon.getDate();
  const endDay = weekEndNoon.getDate();
  const startMonth = shortMonthFormatter.format(weekStartNoon);
  const endMonth = shortMonthFormatter.format(weekEndNoon);
  const weekRangeShort = startMonth === endMonth
    ? `${startDay}–${endDay} ${startMonth}`
    : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;

  return (
    <WeekFeedClient
      groupedEvents={groupedEvents}
      dossierMode={false}
      dossierTitre={null}
      dayGroups={dayGroups}
      kpis={kpis}
      weekNumber={weekNumber}
      year={year}
      weekStartFormatted={weekStartFormatted}
      weekEndFormatted={weekEndFormatted}
      weekRangeShort={weekRangeShort}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      isCurrentOrFutureWeek={isCurrentOrFutureWeek}
    />
  );
}
