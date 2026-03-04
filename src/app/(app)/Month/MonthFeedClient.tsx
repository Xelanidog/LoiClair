"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  FileSearch,
  BarChart3,
  ArrowLeftRight,
  Handshake,
  AlertTriangle,
  Megaphone,
  Gavel,
  Scale,
  CheckCircle2,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
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
} from "./page";

// ── Config 11 types + fallback ──────────────────────────────

const EVENT_CONFIG: Record<
  FeedEventType,
  { icon: typeof FileText; label: string; color: string; iconBg: string }
> = {
  DEPOT_TEXTE: { icon: FileText, label: "Nouveau texte", color: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/50" },
  DEPOT_RAPPORT: { icon: FileSearch, label: "Rapport", color: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/50" },
  DECISION: { icon: BarChart3, label: "Décision", color: "text-fuchsia-600 dark:text-fuchsia-400", iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/50" },
  NAVETTE: { icon: ArrowLeftRight, label: "Navette", color: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/50" },
  CMP_CONVOCATION: { icon: Handshake, label: "CMP", color: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/50" },
  CMP_RAPPORT: { icon: FileSearch, label: "Rapport", color: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/50" },
  MOTION_CENSURE: { icon: AlertTriangle, label: "Motion de censure", color: "text-red-600 dark:text-red-400", iconBg: "bg-red-100 dark:bg-red-900/50" },
  DECL_GOUVERNEMENT: { icon: Megaphone, label: "Déclaration gouv.", color: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/50" },
  MOTION_VOTE: { icon: Gavel, label: "Vote motion", color: "text-red-600 dark:text-red-400", iconBg: "bg-red-100 dark:bg-red-900/50" },
  CC_SAISINE: { icon: Scale, label: "Cons. const.", color: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/50" },
  PROMULGATION: { icon: CheckCircle2, label: "Loi promulguée", color: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-900/50" },
  AUTRE: { icon: Activity, label: "Autre", color: "text-muted-foreground", iconBg: "bg-muted" },
};

const FILTER_PILLS: { value: string; label: string; icon: typeof Activity; color: string }[] = [
  { value: "tous", label: "Tous", icon: Activity, color: "text-primary" },
  { value: "DEPOT_TEXTE", label: "Textes", icon: FileText, color: "text-blue-600 dark:text-blue-400" },
  { value: "DECISION", label: "Décisions", icon: BarChart3, color: "text-fuchsia-600 dark:text-fuchsia-400" },
  { value: "DEPOT_RAPPORT", label: "Rapports", icon: FileSearch, color: "text-teal-600 dark:text-teal-400" },
  { value: "NAVETTE", label: "Navettes", icon: ArrowLeftRight, color: "text-indigo-600 dark:text-indigo-400" },
  { value: "CMP", label: "CMP", icon: Handshake, color: "text-purple-600 dark:text-purple-400" },
  { value: "CC_SAISINE", label: "Cons. const.", icon: Scale, color: "text-orange-600 dark:text-orange-400" },
  { value: "PROMULGATION", label: "Promulgations", icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  { value: "MOTION", label: "Motions", icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
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

function VoteBar({ event }: { event: FeedEvent }) {
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
            <div style={{ width: `${((event.votePour ?? 0) / T) * 100}%`, backgroundColor: "#22c55e", minWidth: (event.votePour ?? 0) > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${((event.voteContre ?? 0) / T) * 100}%`, backgroundColor: "#ef4444", minWidth: (event.voteContre ?? 0) > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${((event.voteAbstentions ?? 0) / T) * 100}%`, backgroundColor: "#9ca3af", minWidth: (event.voteAbstentions ?? 0) > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${(nv / T) * 100}%`, backgroundColor: "#fb923c", minWidth: nv > 0 ? "2px" : "0" }} className="h-full" />
            <div style={{ width: `${(abs / T) * 100}%`, backgroundColor: "#e5e7eb" }} className="h-full dark:hidden" />
            <div style={{ width: `${(abs / T) * 100}%`, backgroundColor: "#374151" }} className="h-full hidden dark:block" />
            {majPct > 0 && <div className="absolute top-0 h-full w-px bg-foreground/60" style={{ left: `${majPct}%` }} />}
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {event.votePour}–{event.voteContre}–{event.voteAbstentions}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#22c55e" }} />Pour : {event.votePour}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#ef4444" }} />Contre : {event.voteContre}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#9ca3af" }} />Abstentions : {event.voteAbstentions}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#fb923c" }} />Non-votants : {nv}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0 bg-gray-200 dark:bg-gray-700" />Absents : {abs}</div>
          {(event.voteSuffragesRequis ?? 0) > 0 && <div className="pt-1 border-t mt-1 text-muted-foreground">Majorité requise : {event.voteSuffragesRequis} voix</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Status badge ────────────────────────────────────────────

function StatusBadge({ statut }: { statut: string | null }) {
  if (!statut) return null;
  const l = statut.toLowerCase();
  const rejected = l.includes("rejet") || l.includes("pas adopté");
  const adopted = !rejected && l.includes("adopt");

  return (
    <span className={cn(
      "inline-block text-[11px] font-medium px-2 py-1 rounded-md leading-relaxed",
      adopted ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
        : rejected ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
        : "bg-muted text-muted-foreground"
    )} style={{ maxWidth: '66%' }}>
      {statut}
    </span>
  );
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
      if (multi) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {events.map(ev => {
              const inst = institutionName(ev.organeCodeType, ev.organeName);
              return (
                <div key={ev.id}>
                  <div className="flex items-baseline gap-1 text-xs text-muted-foreground overflow-hidden">
                    <span className="shrink-0">·</span>
                    {inst && <span className="font-bold text-foreground shrink-0">{inst}</span>}
                  </div>
                  <div className="ml-3 mt-0.5 space-y-1">
                    <StatusBadge statut={ev.statutConclusion} />
                    {ev.votePour != null && <VoteBar event={ev} />}
                    {dossierUid && <ResumeIALink dossierUid={dossierUid} texteUid={ev.texteUid} texteUrlAccessible={ev.texteUrlAccessible} />}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      return (
        <div className="space-y-1.5" style={{ marginTop: 6 }}>
          <StatusBadge statut={e.statutConclusion} />
          {e.votePour != null && <VoteBar event={e} />}
        </div>
      );

    case "NAVETTE":
      return null; // contenu dans CardTitle

    case "CMP_CONVOCATION":
      return null; // contenu dans CardTitle

    case "MOTION_CENSURE":
      if (multi) {
        return (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="space-y-1">
                {ev.scrutinTitre && <p className="text-xs text-muted-foreground">{ev.scrutinTitre}</p>}
                <StatusBadge statut={ev.statutConclusion} />
                <VoteBar event={ev} />
                {ev.dossierUid && <ResumeIALink dossierUid={ev.dossierUid} texteUid={ev.texteUid} texteUrlAccessible={ev.texteUrlAccessible} />}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="space-y-1">
          {e.scrutinTitre && <p className="text-xs text-muted-foreground">{e.scrutinTitre}</p>}
          <StatusBadge statut={e.statutConclusion} />
          <VoteBar event={e} />
        </div>
      );

    case "DECL_GOUVERNEMENT":
      return null;

    case "CC_SAISINE":
      return null;

    case "PROMULGATION":
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Publiée au Journal officiel</span>
        </div>
      );

    default:
      return null;
  }
}

// ── Résumé IA link helper ────────────────────────────────────

function ResumeIALink({ dossierUid, texteUid, texteUrlAccessible }: { dossierUid: string; texteUid?: string | null; texteUrlAccessible?: boolean | null }) {
  if (texteUrlAccessible === false || texteUrlAccessible === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs mt-1 flex-wrap">
        <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
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
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-green-500 hover:bg-muted/50 transition-colors" aria-label="J'approuve">
        <ThumbsUp className="w-3.5 h-3.5" />
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-red-500 hover:bg-muted/50 transition-colors" aria-label="Je désapprouve">
        <ThumbsDown className="w-3.5 h-3.5" />
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-blue-500 hover:bg-muted/50 transition-colors" aria-label="Sauvegarder">
        <Bookmark className="w-3.5 h-3.5" />
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-full text-muted-foreground/30 hover:text-blue-500 hover:bg-muted/50 transition-colors" aria-label="Partager">
        <Share2 className="w-3.5 h-3.5" />
      </motion.button>
    </div>
  );
}

// ── Card footer (standard) ───────────────────────────────────

function CardFooter({ dossierUid, texteUid, showResumeIA = true, texteUrlAccessible }: { dossierUid?: string | null; texteUid?: string | null; showResumeIA?: boolean; texteUrlAccessible?: boolean | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 14, marginTop: 12, width: "100%" }}>
      <div style={{ flexShrink: 0, flexGrow: 1 }}>
        {showResumeIA && dossierUid ? (
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
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 14, marginTop: 12, width: "100%" }}>
      <span className="inline-flex items-center gap-1.5 text-xs text-primary flex-wrap" style={{ flexGrow: 1 }}>
        <Sparkles className="w-3 h-3 shrink-0" />
        <span>Résumé IA :</span>
        {e.texteUid ? (
          <Link href={`/dossiers-legislatifs/${dossierUid}/resume-ia?texte=${e.texteUid}`} className="hover:underline">
            Rapport{!isCmp && e.texteHasTomes && <span className="text-muted-foreground"> (+ tomes)</span>}
          </Link>
        ) : (
          <span className="text-muted-foreground">Rapport</span>
        )}
        {e.texteAdopteUid && <>
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
        {e.libelleActe && <span className="text-muted-foreground">{e.libelleActe} </span>}
        <span>{e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}</span>
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
  // PROMULGATION : dossierTitre + badge JO
  if (t === "PROMULGATION") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        {group.dossierTitre || e.titre}
      </p>
    );
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
    const titre = group.events.length > 1
      ? (group.dossierTitre || e.titre)
      : (e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre);
    return <p className="text-sm leading-snug mb-0.5">{titre}</p>;
  }
  // DECISION : juste le titre du texte
  if (t === "DECISION") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        {e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}
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

function getContextInfo(type: FeedEventType, e: FeedEvent, multi: boolean) {
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
    if (multi) return null;
    const inst = institutionName(e.organeCodeType, e.organeName);
    return inst ? <span className="shrink-0">/{inst}</span> : null;
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
  if (type === "CMP_CONVOCATION") return null;
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
  const context = getContextInfo(group.type, e, multi);

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
          <span className={cn("font-semibold shrink-0", config.color)}>{(group.type === "CMP_CONVOCATION" || group.type === "CC_SAISINE") && e.libelleActe ? e.libelleActe : config.label}</span>
          {group.type !== "CC_SAISINE" && !(group.type === "DECISION" && !multi) && <span className="shrink-0">·</span>}
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
            texteUid={e.texteUid}
            showResumeIA={!multi && group.type !== "CC_SAISINE" && group.type !== "CMP_CONVOCATION"}
            texteUrlAccessible={e.texteUrlAccessible}
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
            <Link href="/Month" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2">
              <ArrowLeft className="w-3 h-3" />Retour au fil
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
          <h1 className="text-2xl font-bold">Fil du Mois</h1>
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
