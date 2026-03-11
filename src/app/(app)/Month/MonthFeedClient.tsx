"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  FileSearch,
  FileCheck2,
  BarChart3,
  ArrowLeftRight,
  Handshake,
  AlertTriangle,
  Megaphone,
  Gavel,
  Scale,
  CheckCircle2,
  PartyPopper,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CalendarX,
  CalendarCheck,
  Activity,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusBadgeClass } from "@/lib/statusMapping";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type {
  FeedEvent,
  FeedEventType,
  GroupedFeedEvent,
  MonthKpis,
  ScrutinItem,
} from "./page";

// ── Config 11 types + fallback ──────────────────────────────

const EVENT_CONFIG: Record<
  FeedEventType,
  { icon: typeof FileText; label: string; color: string; iconBg: string }
> = {
  DEPOT_TEXTE: { icon: FileText, label: "Nouveau texte", color: "text-primary", iconBg: "bg-primary/10" },
  DEPOT_RAPPORT: { icon: FileSearch, label: "Rapport", color: "text-primary dark:text-primary", iconBg: "bg-primary/10" },
  DECISION: { icon: BarChart3, label: "Décision", color: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/50" },
  NAVETTE: { icon: ArrowLeftRight, label: "Navette", color: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/50" },
  CMP_CONVOCATION: { icon: Handshake, label: "Convocation d'une Commission Mixte Paritaire", color: "text-[#F39C12]", iconBg: "bg-[#F39C12]/10" },
  CMP_RAPPORT: { icon: FileSearch, label: "Rapport", color: "text-primary dark:text-primary", iconBg: "bg-primary/10" },
  MOTION_CENSURE: { icon: AlertTriangle, label: "Motion de censure", color: "text-[#E74C3C]", iconBg: "bg-[#E74C3C]/10" },
  DECL_GOUVERNEMENT: { icon: Megaphone, label: "Déclaration gouv.", color: "text-[#F39C12]", iconBg: "bg-[#F39C12]/10" },
  MOTION_VOTE: { icon: Gavel, label: "Vote motion", color: "text-[#E74C3C]", iconBg: "bg-[#E74C3C]/10" },
  CC_SAISINE: { icon: Scale, label: "Cons. const.", color: "text-[#F39C12] dark:text-[#F1C40F]", iconBg: "bg-[#F39C12]/10" },
  PROMULGATION: { icon: CheckCircle2, label: "Loi promulguée", color: "text-[#27AE60] dark:text-[#2ECC71]", iconBg: "bg-[#27AE60]/10" },
  DECRET: { icon: FileCheck2, label: "Décret d'application", color: "text-[#B45309]", iconBg: "bg-[#B45309]/10" },
  AUTRE: { icon: Activity, label: "Autre", color: "text-muted-foreground", iconBg: "bg-muted" },
};

const FILTER_PILLS: { value: string; label: string; icon: typeof Activity; color: string }[] = [
  { value: "tous", label: "Tous", icon: Activity, color: "text-primary" },
  { value: "DEPOT_TEXTE", label: "Textes", icon: FileText, color: "text-primary" },
  { value: "DECISION", label: "Décisions", icon: BarChart3, color: "text-violet-600 dark:text-violet-400" },
  { value: "DEPOT_RAPPORT", label: "Rapports", icon: FileSearch, color: "text-primary" },
  { value: "NAVETTE", label: "Navettes", icon: ArrowLeftRight, color: "text-violet-600 dark:text-violet-400" },
  { value: "CMP", label: "CMP", icon: Handshake, color: "text-[#F39C12]" },
  { value: "CC_SAISINE", label: "Cons. const.", icon: Scale, color: "text-[#F39C12] dark:text-[#F1C40F]" },
  { value: "PROMULGATION", label: "Promulgations", icon: CheckCircle2, color: "text-[#27AE60] dark:text-[#2ECC71]" },
  { value: "DECRET", label: "Décrets", icon: FileCheck2, color: "text-[#B45309]" },
  { value: "MOTION", label: "Motions", icon: AlertTriangle, color: "text-[#E74C3C]" },
];

function matchesFilter(type: FeedEventType, filter: string): boolean {
  if (filter === "tous") return true;
  if (filter === "DEPOT_RAPPORT") return type === "DEPOT_RAPPORT" || type === "CMP_RAPPORT";
  if (filter === "CMP") return type === "CMP_CONVOCATION";
  if (filter === "MOTION") return type === "MOTION_CENSURE";
  return type === filter;
}

function institutionName(codeType: string | null, fallback: string | null): string | null {
  if (codeType === "ASSEMBLEE") return "Assemblée";
  if (codeType === "SENAT") return "Sénat";
  if (codeType === "CMP") return "Commission mixte paritaire";
  if (codeType === "CONSTITU") return "Conseil constitutionnel";
  if (codeType === "GOUVERNEMENT") return "Gouvernement";
  return fallback;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

// ── VoteBar ─────────────────────────────────────────────────

type VoteData = { votePour?: number | null; voteContre?: number | null; voteAbstentions?: number | null; voteVotants?: number | null; voteNonVotants?: number | null; voteSuffragesRequis?: number | null };
function VoteBar({ event }: { event: VoteData }) {
  if (event.votePour == null) return null;
  const T = 577;
  const nv = event.voteNonVotants ?? 0;
  const abs = Math.max(T - (event.voteVotants ?? 0) - nv, 0);
  const majPct = (event.voteSuffragesRequis ?? 0) > 0 ? ((event.voteSuffragesRequis ?? 0) / T) * 100 : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="relative flex-1 h-1.5 rounded-full overflow-hidden isolate" style={{ display: "flex", backgroundColor: "var(--color-muted)" }}>
            <div style={{ width: `${((event.votePour ?? 0) / T) * 100}%`, backgroundColor: "#27AE60", minWidth: (event.votePour ?? 0) > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${((event.voteContre ?? 0) / T) * 100}%`, backgroundColor: "#E74C3C", minWidth: (event.voteContre ?? 0) > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${((event.voteAbstentions ?? 0) / T) * 100}%`, backgroundColor: "#A8A29E", minWidth: (event.voteAbstentions ?? 0) > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${(nv / T) * 100}%`, backgroundColor: "#F39C12", minWidth: nv > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${(abs / T) * 100}%`, backgroundColor: "#F0EDEA" }} className="h-full dark:hidden" />
            <div style={{ width: `${(abs / T) * 100}%`, backgroundColor: "#44403C" }} className="h-full hidden dark:block" />
            {majPct > 0 && <div className="absolute top-0 h-full w-px bg-foreground/60" style={{ left: `${majPct}%` }} />}
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {event.votePour}–{event.voteContre}–{event.voteAbstentions}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#27AE60" }} />Pour : {event.votePour}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#E74C3C" }} />Contre : {event.voteContre}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#A8A29E" }} />Abstentions : {event.voteAbstentions}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#F39C12" }} />Non-votants : {nv}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0 bg-[#F0EDEA] dark:bg-[#44403C]" />Absents : {abs}</div>
          {(event.voteSuffragesRequis ?? 0) > 0 && <div className="pt-1 border-t mt-1 text-muted-foreground">Majorité requise : {event.voteSuffragesRequis} voix</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Status badge ────────────────────────────────────────────

function StatusBadge({ statut }: { statut: string | null }) {
  if (!statut) return null;
  return (
    <span className={cn(
      "inline-block text-[11px] font-medium px-2 py-1 rounded-md leading-relaxed",
      getStatusBadgeClass(statut)
    )} style={{ maxWidth: '66%' }}>
      {statut}
    </span>
  );
}

// ── VoteBlock (type + objet + badge + barre) ────────────────

function VoteBlock({ scrutin }: { scrutin: ScrutinItem }) {
  const parts = [
    scrutin.typeVoteLibelle ? scrutin.typeVoteLibelle.charAt(0).toUpperCase() + scrutin.typeVoteLibelle.slice(1) : null,
    scrutin.typeMajorite,
  ].filter(Boolean);
  const typeLabel = parts.length > 0 ? parts.join(' · ') : null;
  return (
    <div className="space-y-1">
      {typeLabel && <p className="text-xs text-muted-foreground">{typeLabel}</p>}
      {scrutin.votePour != null && <VoteBar event={scrutin} />}
      <StatusBadge statut={scrutin.statutConclusion} />
    </div>
  );
}

function ccSaisineLabel(codeActe: string | null): string | null {
  switch (codeActe) {
    case 'CC-SAISIE-AN': return '60 députés ou plus ont saisi le Conseil constitutionnel.';
    case 'CC-SAISIE-SN': return '60 sénateurs ou plus ont saisi le Conseil constitutionnel.';
    case 'CC-SAISIE-PM': return 'Le Premier ministre a saisi le Conseil constitutionnel.';
    case 'CC-SAISIE-DROIT': return 'Saisine automatique (loi organique ou loi de finances).';
    default: return null;
  }
}

// ── Type-specific card body ─────────────────────────────────

function EventBody({ group }: { group: GroupedFeedEvent }) {
  const { type, events, dossierUid } = group;
  const e = events[0];
  const multi = events.length > 1;

  switch (type) {
    case "DEPOT_TEXTE":
      return null; // contenu déjà dans CardTitle

    case "DEPOT_RAPPORT":
    case "CMP_RAPPORT":
      return null; // tout dans CardTitle + RapportFooterLinks

    case "DECISION":
    case "MOTION_CENSURE": {
      const scrutin = e.scrutins[0] ?? null;
      if (!scrutin) {
        return e.statutConclusion
          ? <div className="mt-1.5"><StatusBadge statut={e.statutConclusion} /></div>
          : null;
      }
      return <div className="mt-1.5 space-y-1.5"><VoteBlock scrutin={scrutin} /></div>;
    }

    case "NAVETTE":
      return null; // contenu dans CardTitle

    case "CMP_CONVOCATION":
      return null; // contenu dans CardTitle

    case "DECL_GOUVERNEMENT":
      return null;

    case "CC_SAISINE": {
      const label = ccSaisineLabel(e.codeActe);
      return label ? <p className="text-xs text-muted-foreground mt-1">{label}</p> : null;
    }

    case "PROMULGATION": {
      const loiCode = e.codeLoi ?? (() => {
        const m = e.texteUid?.match(/^LOI(\d{4})(\d+)$/);
        return m ? `${m[1]}-${parseInt(m[2], 10)}` : null;
      })();
      return (
        <div className="flex flex-col items-center gap-2 mt-3 mb-1">
          <div className="w-16 h-16 rounded-full bg-[#27AE60]/10 flex items-center justify-center">
            <PartyPopper className="w-8 h-8 text-[#27AE60]" />
          </div>
          {loiCode && <span className="text-sm font-semibold text-[#27AE60]">Loi n° {loiCode}</span>}
        </div>
      );
    }

    case "DECRET":
      return null; // contenu géré dans CardTitle

    default:
      return null;
  }
}

// ── Résumé IA link helper ────────────────────────────────────

function ResumeIALink({ dossierUid, texteUid, texteUrlAccessible }: { dossierUid: string; texteUid?: string | null; texteUrlAccessible?: boolean | null }) {
  if (texteUrlAccessible === null) {
    // Pas de texte associé → lien dossier seul, sans "Non encore publié"
    return (
      <Link
        href={`/dossiers-legislatifs/${dossierUid}/resume-ia`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline mt-1"
      >
        <FileText className="w-3 h-3" />
        Dossier complet
      </Link>
    );
  }
  if (texteUrlAccessible === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs mt-1 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[#F39C12] dark:text-[#F1C40F]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C] shrink-0" />
          Non encore publié
        </span>
        <span className="text-muted-foreground">·</span>
        <Link
          href={`/dossiers-legislatifs/${dossierUid}/resume-ia`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
        >
          <FileText className="w-3 h-3" />
          Dossier complet
        </Link>
      </span>
    );
  }
  return (
    <Link
      href={`/dossiers-legislatifs/${dossierUid}/resume-ia${texteUid ? `?texte=${texteUid}` : ""}`}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
    >
      <Sparkles className="w-3 h-3" />
      Résumé IA
    </Link>
  );
}

// ── Social icons (partagé entre CardFooter et RapportFooterLinks) ───────────

function SocialIcons() {
  return (
    <div style={{ display: "flex", flexShrink: 0, width: "35%", justifyContent: "space-around", alignItems: "center" }}>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-[#27AE60] hover:bg-muted/50 transition-colors" aria-label="J'approuve">
        <ThumbsUp className="w-3.5 h-3.5" />
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-[#E74C3C] hover:bg-muted/50 transition-colors" aria-label="Je désapprouve">
        <ThumbsDown className="w-3.5 h-3.5" />
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-primary hover:bg-muted/50 transition-colors" aria-label="Sauvegarder">
        <Bookmark className="w-3.5 h-3.5" />
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-primary hover:bg-muted/50 transition-colors" aria-label="Partager">
        <Share2 className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
}

// ── Card footer (standard) ───────────────────────────────────

function CardFooter({ dossierUid, texteUid, showResumeIA = true, texteUrlAccessible, learnMoreHref }: { dossierUid?: string | null; texteUid?: string | null; showResumeIA?: boolean; texteUrlAccessible?: boolean | null; learnMoreHref?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 14, marginTop: 12, width: "100%" }}>
      <div style={{ flexShrink: 0, flexGrow: 1 }}>
        {learnMoreHref ? (
          <Link href={learnMoreHref} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline mt-1">
            <Info className="w-3 h-3" />
            En savoir plus
          </Link>
        ) : showResumeIA && dossierUid ? (
          <ResumeIALink dossierUid={dossierUid} texteUid={texteUid} texteUrlAccessible={texteUrlAccessible} />
        ) : null}
      </div>
      <SocialIcons />
    </div>
  );
}

// ── Footer liens Résumé IA pour rapports ────────────────────

function RapportFooterLinks({ group }: { group: GroupedFeedEvent }) {
  const { type, events, dossierUid } = group;
  const e = events[0];
  const multi = events.length > 1;

  if (!dossierUid) return null;

  // CMP groupé même jour → Assemblée | Sénat | Texte adopté
  if (type === "CMP_RAPPORT" && multi) {
    const an = events.find(ev => ev.organeCodeType === "ASSEMBLEE");
    const sn = events.find(ev => ev.organeCodeType === "SENAT");
    const texteAdopteUid = (an ?? sn)?.texteAdopteUid ?? null;
    return (
      <div style={{ display: "flex", alignItems: "center", paddingTop: 14, marginTop: 12, width: "100%" }}>
        <span className="inline-flex items-center gap-1.5 text-xs text-primary flex-wrap" style={{ flexGrow: 1 }}>
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>Résumé IA :</span>
          {an?.texteUid && (
            <Link href={`/dossiers-legislatifs/${dossierUid}/resume-ia?texte=${an.texteUid}`} className="hover:underline">
              Assemblée
            </Link>
          )}
          {an?.texteUid && sn?.texteUid && <span className="text-muted-foreground">|</span>}
          {sn?.texteUid && (
            <Link href={`/dossiers-legislatifs/${dossierUid}/resume-ia?texte=${sn.texteUid}`} className="hover:underline">
              Sénat
            </Link>
          )}
          {texteAdopteUid && <>
            <span className="text-muted-foreground">|</span>
            <Link href={`/dossiers-legislatifs/${dossierUid}/resume-ia?texte=${texteAdopteUid}`} className="hover:underline text-muted-foreground">
              Texte adopté
            </Link>
          </>}
        </span>
        <SocialIcons />
      </div>
    );
  }

  // DEPOT_RAPPORT ou CMP_RAPPORT single
  const isCmp = type === "CMP_RAPPORT";
  const hasSecondLink = !!e.texteAdopteUid;
  const tomes = !isCmp && e.texteHasTomes;
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 14, marginTop: 12, width: "100%" }}>
      <span className="inline-flex items-center gap-1.5 text-xs text-primary flex-wrap" style={{ flexGrow: 1 }}>
        <Sparkles className="w-3 h-3 shrink-0" />
        {hasSecondLink ? <span>Résumé IA :</span> : null}
        {e.texteUid ? (
          <Link href={`/dossiers-legislatifs/${dossierUid}/resume-ia?texte=${e.texteUid}`} className="hover:underline">
            {hasSecondLink ? <>Rapport{tomes && <span className="text-muted-foreground"> (+ tomes)</span>}</> : <>Résumé IA{tomes && <span className="text-muted-foreground"> (+ tomes)</span>}</>}
          </Link>
        ) : (
          <span className="text-muted-foreground">{hasSecondLink ? "Rapport" : "Résumé IA"}</span>
        )}
        {hasSecondLink && <>
          <span className="text-muted-foreground">|</span>
          <Link href={`/dossiers-legislatifs/${dossierUid}/resume-ia?texte=${e.texteAdopteUid}`} className="hover:underline text-muted-foreground">
            {isCmp ? "Texte adopté" : "Texte modifié"}
          </Link>
        </>}
      </span>
      <SocialIcons />
    </div>
  );
}

// ── Card title helper ────────────────────────────────────────

function CardTitle({ group, e }: { group: GroupedFeedEvent; e: FeedEvent }) {
  const t = group.type;
  // DEPOT_TEXTE : organe · libelleActe + titre du texte
  if (t === "DEPOT_TEXTE") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        {e.organeName && <span className="text-muted-foreground">{e.organeName} · </span>}
        {e.libelleActe && <span className="text-muted-foreground">{e.libelleActe}</span>}
        <span className="block">{e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}</span>
      </p>
    );
  }
  // MOTION_CENSURE : titre du dossier (plus lisible que le titre du texte)
  if (t === "MOTION_CENSURE") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        {group.dossierTitre || e.texteTitre || e.texteDenomination || e.titre}
      </p>
    );
  }
  // DECRET : ligne 1 muted (référence loi parente), ligne 2 titre complet du décret
  if (t === "DECRET") {
    const loiRef = e.texteDenomination ? `Pour la ${e.texteDenomination}` : null;
    const loiTitre = e.texteTitre ?? null;
    const line1 = [loiRef, loiTitre].filter(Boolean).join(' ');
    const line2 = e.texteAdopteTitre || e.titreLoi || e.dossierTitre || null;
    return (
      <div className="mb-0.5">
        {line1 && <p className="text-xs text-muted-foreground">{line1}</p>}
        {line2 && <p className="text-sm leading-snug">{line2}</p>}
      </div>
    );
  }
  // PROMULGATION : titre officiel de la loi (capitalisé) ou titre du dossier
  if (t === "PROMULGATION") {
    const titre = e.titreLoi
      ? e.titreLoi.charAt(0).toUpperCase() + e.titreLoi.slice(1)
      : (group.dossierTitre || e.titre);
    return <p className="text-sm leading-snug mb-0.5">{titre}</p>;
  }
  // NAVETTE : direction en ligne 1, juste le titre ici
  if (t === "NAVETTE") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        <span>{e.texteTitre || group.dossierTitre || e.titre}</span>
      </p>
    );
  }
  // DEPOT_RAPPORT / CMP_RAPPORT : single → titre du rapport, multi → titre du dossier
  if (t === "DEPOT_RAPPORT" || t === "CMP_RAPPORT") {
    const isSingle = group.events.length === 1;
    const titre = isSingle
      ? (e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre)
      : (group.dossierTitre || e.titre);

    // Ligne rapporteur(s)
    let rapporteurLine: React.ReactNode = null;
    if (isSingle && e.rapporteurName) {
      rapporteurLine = (
        <p className="text-xs text-muted-foreground mt-2">
          <span>Rapporteur(s) : </span>
          <span className="font-bold text-foreground">{e.rapporteurName}</span>
          {e.rapporteurGroupe && <span>/{e.rapporteurGroupe}</span>}
          {e.rapporteurIsMultiple && <span> (et collègues)</span>}
        </p>
      );
    } else if (!isSingle && t === "CMP_RAPPORT") {
      const an = group.events.find(ev => ev.organeCodeType === "ASSEMBLEE");
      const sn = group.events.find(ev => ev.organeCodeType === "SENAT");
      if (an?.rapporteurName || sn?.rapporteurName) {
        rapporteurLine = (
          <p className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3">
            {an?.rapporteurName && (
              <span>
                Assemblée : <span className="font-bold text-foreground">{an.rapporteurName}</span>
                {an.rapporteurGroupe && <span>/{an.rapporteurGroupe}</span>}
                {an.rapporteurIsMultiple && <span> (et collègues)</span>}
              </span>
            )}
            {sn?.rapporteurName && (
              <span>
                Sénat : <span className="font-bold text-foreground">{sn.rapporteurName}</span>
                {sn.rapporteurGroupe && <span>/{sn.rapporteurGroupe}</span>}
                {sn.rapporteurIsMultiple && <span> (et collègues)</span>}
              </span>
            )}
          </p>
        );
      }
    }

    return (
      <>
        <p className="text-sm leading-snug mb-0.5">{titre}</p>
        {rapporteurLine}
      </>
    );
  }
  // DECISION : single → titre du scrutin nettoyé ; multi → titre du texte/dossier
  if (t === "DECISION") {
    const isMulti = e.scrutins.length > 1;
    const scrutinTitre = !isMulti && e.scrutinTitre
      ? e.scrutinTitre.replace(/^sur\s+/i, '').replace(/^(.)/, c => c.toUpperCase())
      : null;
    return (
      <p className="text-sm leading-snug mb-0.5">
        {scrutinTitre || e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}
      </p>
    );
  }
  // CMP_CONVOCATION / CC_SAISINE : libelleActe déjà dans le header, juste le titre
  if (t === "CMP_CONVOCATION" || t === "CC_SAISINE") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        {e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}
      </p>
    );
  }
  // Défaut : dossierTitre ou titre
  return (
    <p className="text-sm leading-snug mb-0.5">
      {group.dossierTitre || e.titre}
    </p>
  );
}

// ── Context info helper ─────────────────────────────────────

function getContextInfo(type: FeedEventType, e: FeedEvent, multi: boolean, events: FeedEvent[]) {
  if (type === "DEPOT_TEXTE") {
    if (!e.auteur) return null;
    return <>
      <span className="font-bold text-foreground shrink-0">
        { e.auteurChambre === 'AN' ? 'Dep. ' : e.auteurChambre === 'SENAT' ? 'Sén. ' : e.auteurChambre === 'GOUV' ? 'Min. ' : '' }
        {e.auteur}
      </span>
      {e.groupeAbrege && <span className="font-normal shrink-0">/{e.groupeAbrege}</span>}
    </>;
  }
  if (type === "NAVETTE") {
    const direction = e.organeCodeType === "SENAT" ? "Assemblée → Sénat"
      : e.organeCodeType === "ASSEMBLEE" ? "Sénat → Assemblée"
      : e.organeName;
    return direction ? <span className="font-bold text-foreground shrink-0">{direction}</span> : null;
  }
  if (type === "DECISION") {
    if (multi) {
      const insts = [...new Set(events.map(ev => institutionName(ev.organeCodeType, ev.organeName)).filter((v): v is string => v !== null))];
      return insts.length > 0 ? <span className="font-bold text-foreground shrink-0">{insts.join(' + ')}</span> : null;
    }
    const inst = institutionName(e.organeCodeType, e.organeName);
    return inst ? <span className="font-bold text-foreground shrink-0">{inst}</span> : null;
  }
  if (type === "DEPOT_RAPPORT") {
    const chambre = e.organeCodeType === "COMSENAT" ? "Sénat" : "Assemblée";
    return <>
      <span className="font-bold text-foreground shrink-0">{chambre}</span>
      {e.organeName && <span className="font-normal shrink-0">/{e.organeName}</span>}
    </>;
  }
  if (type === "CMP_RAPPORT") {
    return <span className="font-bold text-foreground shrink-0">Commission mixte paritaire</span>;
  }
  if (type === "MOTION_CENSURE") {
    return <span className="font-bold text-foreground shrink-0">Assemblée</span>;
  }
  if (type === "CMP_CONVOCATION") return null;
  if (type === "DECRET") {
    return <span className="font-bold text-foreground shrink-0">Gouvernement</span>;
  }
  if (type === "CC_SAISINE") {
    const inst = institutionName(e.organeCodeType, e.organeName);
    return inst ? <span className="shrink-0">/{inst}</span> : null;
  }
  return e.organeName ? <span className="truncate">{e.organeName}</span> : null;
}

// ── Debug accordion ─────────────────────────────────────────

function DebugAccordion({ group }: { group: GroupedFeedEvent }) {
  const acteUids = group.events.map(e => e.id.replace(/^(acte|scrutin)-/, ''));
  const texteUids = [...new Set(group.events.map(e => e.texteUid).filter(Boolean))];
  const texteAdopteUids = [...new Set(group.events.map(e => e.texteAdopteUid).filter(Boolean))];
  const scrutinUids = [...new Set(group.events.map(e => e.scrutinUid).filter(Boolean))];
  const codeActes = [...new Set(group.events.map(e => e.codeActe).filter(Boolean))];

  return (
    <details className="mt-2 text-[10px] text-muted-foreground border border-dashed border-muted-foreground/30 rounded px-2 py-1">
      <summary className="cursor-pointer select-none font-mono opacity-50 hover:opacity-100">🐛 debug</summary>
      <div className="mt-1 space-y-0.5 font-mono">
        <div><span className="opacity-50">dossier: </span>{group.dossierUid ?? '—'}</div>
        <div><span className="opacity-50">actes:   </span>{acteUids.join(', ') || '—'}</div>
        {codeActes.length > 0 && <div><span className="opacity-50">codes:   </span>{codeActes.join(', ')}</div>}
        {texteUids.length > 0 && <div><span className="opacity-50">textes:  </span>{texteUids.join(', ')}</div>}
        {texteAdopteUids.length > 0 && <div><span className="opacity-50">adopté:  </span>{texteAdopteUids.join(', ')}</div>}
        {scrutinUids.length > 0 && <div><span className="opacity-50">scrutins:</span>{scrutinUids.join(', ')}</div>}
      </div>
    </details>
  );
}

// ── Grouped event card (unifié style X) ─────────────────────

function GroupedEventCard({ group, index }: { group: GroupedFeedEvent; index: number }) {
  const config = EVENT_CONFIG[group.type];
  const Icon = config.icon;
  const e = group.events[0];
  const multi = group.events.length > 1;
  const shortDate = formatShortDate(group.date);
  const context = getContextInfo(group.type, e, multi, group.events);
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="flex gap-3 px-4 sm:px-1 py-3 border-b hover:bg-muted/30 transition-colors cursor-default"
    >
      {/* Avatar */}
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5", config.iconBg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Ligne 1 : label · contexte · date */}
        <div className="flex items-baseline gap-1 text-xs text-muted-foreground mb-0.5 overflow-hidden">
          <span className={cn("font-semibold shrink-0", config.color)}>{group.type === "CC_SAISINE" && e.libelleActe ? e.libelleActe : config.label}</span>
          {group.type !== "CC_SAISINE" && <span className="shrink-0">·</span>}
          {context && <span className="truncate min-w-0">{context}</span>}
          {context && <span className="shrink-0">·</span>}
          <span className="shrink-0">{shortDate}</span>
          {multi && (
            <span className="text-[10px] ml-1 px-1.5 py-px rounded-full bg-muted text-muted-foreground shrink-0">
              ×{group.events.length}
            </span>
          )}
        </div>

        {/* Ligne 2 : titre contextuel */}
        <CardTitle group={group} e={e} />

        {/* Texte adopté pour DEPOT_TEXTE (si différent) */}
        {group.type === "DEPOT_TEXTE" && e.texteAdopteUid && e.texteAdopteUid !== e.texteUid && (
          <p className="text-sm leading-snug mb-0.5">
            {e.texteAdopteDenomination && <span className="text-muted-foreground">{e.texteAdopteDenomination} — </span>}
            <span>{e.texteAdopteTitre || "Texte adopté"}</span>
          </p>
        )}

        {/* Contenu spécifique au type (VoteBar, StatusBadge, etc.) */}
        <EventBody group={group} />

        {/* Footer : Résumé IA + icônes */}
        {(group.type === "DEPOT_RAPPORT" || group.type === "CMP_RAPPORT") ? (
          <RapportFooterLinks group={group} />
        ) : (
          <CardFooter
            dossierUid={group.dossierUid}
            texteUid={group.type === "DECRET" ? e.texteAdopteUid : e.texteUid}
            texteUrlAccessible={group.type === "DECRET" ? e.texteAdopteUrlAccessible : e.texteUrlAccessible}
            showResumeIA={!multi && group.type !== "CMP_CONVOCATION" && group.type !== "CC_SAISINE" && (group.type !== "PROMULGATION" || e.hasContenLegifrance)}
            learnMoreHref={
              group.type === "CMP_CONVOCATION" ? "/documentation/guide#processus-législatif" :
              group.type === "CC_SAISINE" ? "/documentation/guide#les-organes-du-parlement" :
              undefined
            }
          />
        )}

        <DebugAccordion group={group} />
      </div>
    </motion.article>
  );
}

// ── Main component ──────────────────────────────────────────

interface MonthFeedClientProps {
  groupedEvents: GroupedFeedEvent[];
  dossierMode: boolean;
  dossierTitre: string | null;
  dossierUid?: string | null;
  kpis: MonthKpis;
  year: number;
  monthFormatted: string;
  monthRangeShort: string;
  prevMonth: string;
  nextMonth: string;
  isCurrentOrFutureMonth: boolean;
}

export function MonthFeedClient({
  groupedEvents,
  dossierMode,
  dossierTitre,
  dossierUid,
  kpis,
  monthFormatted,
  monthRangeShort,
  prevMonth,
  nextMonth,
  isCurrentOrFutureMonth,
}: MonthFeedClientProps) {
  const [activeFilter, setActiveFilter] = useState("tous");
  const filtered = groupedEvents.filter(g => matchesFilter(g.type, activeFilter));

  // Count grouped events per filter
  const filterCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pill of FILTER_PILLS) {
      map[pill.value] = pill.value === "tous"
        ? groupedEvents.length
        : groupedEvents.filter(g => matchesFilter(g.type, pill.value)).length;
    }
    return map;
  }, [groupedEvents]);

  // ── Dossier mode ──
  if (dossierMode) {
    return (
      <TooltipProvider>
        <div className="max-w-xl -mx-6 sm:mx-auto sm:px-4 py-6">
          <div className="mb-5 px-4 sm:px-0">
            <Link
              href={`/dossiers-legislatifs/${dossierUid}/resume-ia`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
            >
              <ArrowLeft className="w-3 h-3" />Retour au dossier
            </Link>
            <h1 className="text-2xl font-bold">
              {dossierTitre || "Dossier législatif"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Timeline complète · {groupedEvents.length} étape{groupedEvents.length > 1 ? "s" : ""}
            </p>
          </div>

          <FilterPills activeFilter={activeFilter} onFilter={setActiveFilter} counts={filterCounts} />

          {filtered.length === 0 ? (
            <NoFilterResults onReset={() => setActiveFilter("tous")} />
          ) : (
            <div>
              {filtered.map((g, i) => (
                <GroupedEventCard key={g.key} group={g} index={i} />
              ))}
            </div>
          )}

          <Footer />
        </div>
      </TooltipProvider>
    );
  }

  // ── Month mode ──
  return (
    <TooltipProvider>
      <div className="max-w-xl -mx-6 sm:mx-auto sm:px-4 py-6">
        {/* Header */}
        <div className="mb-5 px-4 sm:px-0">
          <h1 className="text-2xl font-bold">Fil d&#39;actualité</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{monthFormatted}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-5 px-4 sm:px-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/Month?mois=${prevMonth}`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Mois préc.</span>
              <span className="sm:hidden">Préc.</span>
            </Link>
          </Button>
          <span className="text-xs font-medium text-muted-foreground capitalize">{monthRangeShort}</span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            disabled={isCurrentOrFutureMonth}
            className={isCurrentOrFutureMonth ? "pointer-events-none opacity-40" : ""}
          >
            <Link href={`/Month?mois=${nextMonth}`}>
              <span className="hidden sm:inline">Mois suiv.</span>
              <span className="sm:hidden">Suiv.</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Raccourci mois en cours (visible uniquement quand on consulte un mois passé) */}
        {!isCurrentOrFutureMonth && (
          <div className="flex justify-center mb-4 px-4 sm:px-0">
            <Button variant="ghost" size="sm" asChild className="text-primary">
              <Link href="/Month">
                <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
                Revenir au mois en cours
              </Link>
            </Button>
          </div>
        )}

        <FilterPills activeFilter={activeFilter} onFilter={setActiveFilter} counts={filterCounts} />

        {groupedEvents.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <NoFilterResults onReset={() => setActiveFilter("tous")} />
        ) : (
          <div>
            {filtered.map((g, i) => (
              <GroupedEventCard key={g.key} group={g} index={i} />
            ))}
          </div>
        )}

        {/* Navigation vers le mois précédent en bas de la liste */}
        {filtered.length > 0 && (
          <div className="flex justify-center py-8">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/Month?mois=${prevMonth}`}>
                <ChevronLeft className="w-4 h-4 mr-1.5" />
                Voir le mois précédent
              </Link>
            </Button>
          </div>
        )}

        <Footer />
      </div>
    </TooltipProvider>
  );
}

// ── Shared small components ─────────────────────────────────

function FilterPills({ activeFilter, onFilter, counts }: { activeFilter: string; onFilter: (v: string) => void; counts?: Record<string, number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setHint(el.scrollWidth - el.scrollLeft - el.clientWidth > 8);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);

  return (
    <div className="px-4 sm:px-0 mb-4">
      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto pb-1"
        style={hint ? { WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 2rem), transparent)', maskImage: 'linear-gradient(to right, black calc(100% - 2rem), transparent)' } : undefined}
      >
        {FILTER_PILLS.map(pill => {
          const count = counts?.[pill.value] ?? 0;
          const isActive = activeFilter === pill.value;
          const PillIcon = pill.icon;
          return (
            <button
              key={pill.value}
              onClick={() => onFilter(pill.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 shrink-0 transition-colors text-sm",
                isActive
                  ? "border-foreground/30 bg-muted text-foreground font-semibold"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <PillIcon className={cn("w-3.5 h-3.5", pill.color)} />
              <span>{pill.label}</span>
              {counts && count > 0 && (
                <span className="text-xs tabular-nums opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NoFilterResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground text-sm">Aucun événement de ce type.</p>
      <button onClick={onReset} className="mt-2 text-sm text-primary hover:underline">
        Voir tous les événements
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <CalendarX className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <h2 className="text-base font-semibold mb-1">Mois calme au Parlement</h2>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Aucun événement législatif enregistré. Essayez un autre mois.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center text-[11px] text-muted-foreground mt-10 pb-4">
      Source :{" "}
      <a href="https://data.assemblee-nationale.fr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        data.assemblee-nationale.fr
      </a>
    </p>
  );
}
