"use client";

import { useState } from "react";
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
  WeekKpis,
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
  CMP_RAPPORT: { icon: Handshake, label: "Rapport CMP", color: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/50" },
  MOTION_CENSURE: { icon: AlertTriangle, label: "Motion de censure", color: "text-red-600 dark:text-red-400", iconBg: "bg-red-100 dark:bg-red-900/50" },
  DECL_GOUVERNEMENT: { icon: Megaphone, label: "Déclaration gouv.", color: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/50" },
  MOTION_VOTE: { icon: Gavel, label: "Vote motion", color: "text-red-600 dark:text-red-400", iconBg: "bg-red-100 dark:bg-red-900/50" },
  CC_SAISINE: { icon: Scale, label: "Cons. const.", color: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/50" },
  PROMULGATION: { icon: CheckCircle2, label: "Loi promulguée", color: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-900/50" },
  AUTRE: { icon: Activity, label: "Autre", color: "text-muted-foreground", iconBg: "bg-muted" },
};

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "DEPOT_TEXTE", label: "Dépôts" },
  { value: "DECISION", label: "Décisions" },
  { value: "DEPOT_RAPPORT", label: "Rapports" },
  { value: "NAVETTE", label: "Navettes" },
  { value: "CMP", label: "CMP" },
  { value: "CC_SAISINE", label: "Cons. const." },
  { value: "PROMULGATION", label: "Promulgations" },
  { value: "MOTION", label: "Motions" },
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
      if (multi) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {events.map(ev => (
              <div key={ev.id}>
                <div className="flex items-baseline gap-1 text-xs text-muted-foreground overflow-hidden">
                  <span className="shrink-0">·</span>
                  {ev.texteProvenance && <span className="font-bold text-foreground shrink-0">{ev.texteProvenance}</span>}
                  {ev.organeName && <span className="font-normal truncate">/{ev.organeName}</span>}
                </div>
                <p className="text-sm leading-snug ml-3 mt-0.5">
                  <span className="text-muted-foreground">{ev.organeCodeType === "COMSENAT" ? "Sénat" : "Assemblée"} · </span>
                  {ev.libelleActe && <span className="text-muted-foreground">{ev.libelleActe}. </span>}
                  <span>{ev.texteTitre || ev.texteDenomination || ev.titre}</span>
                  {dossierUid && <>{" "}<ResumeIALink dossierUid={dossierUid} texteUid={ev.texteUid} /></>}
                </p>
              </div>
            ))}
          </div>
        );
      }
      return null; // contenu dans CardTitle, Résumé IA dans footer

    case "DECISION":
      if (multi) {
        return (
          <div className="space-y-2" style={{ marginTop: 6 }}>
            {events.map(ev => (
              <div key={ev.id} className="space-y-1">
                <StatusBadge statut={ev.statutConclusion} />
                {ev.votePour != null && <VoteBar event={ev} />}
                {dossierUid && <ResumeIALink dossierUid={dossierUid} texteUid={ev.texteUid} />}
              </div>
            ))}
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

    case "CMP_RAPPORT":
      if (multi) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {events.map(ev => (
              <div key={ev.id}>
                <div className="flex items-baseline gap-1 text-xs text-muted-foreground overflow-hidden">
                  <span className="shrink-0">·</span>
                  {ev.texteProvenance && <span className="font-bold text-foreground shrink-0">{ev.texteProvenance}</span>}
                  {ev.organeName && <span className="font-normal truncate">/{ev.organeName}</span>}
                </div>
                <p className="text-sm leading-snug ml-3 mt-0.5">
                  <span className="text-muted-foreground">{ev.organeCodeType === "COMSENAT" ? "Sénat" : "Assemblée"} · </span>
                  {ev.libelleActe && <span className="text-muted-foreground">{ev.libelleActe}. </span>}
                  <span>{ev.texteTitre || ev.texteDenomination || ev.titre}</span>
                  {dossierUid && <>{" "}<ResumeIALink dossierUid={dossierUid} texteUid={ev.texteUid} /></>}
                </p>
              </div>
            ))}
          </div>
        );
      }
      return null;

    case "MOTION_CENSURE":
      if (multi) {
        return (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="space-y-1">
                {ev.scrutinTitre && <p className="text-xs text-muted-foreground">{ev.scrutinTitre}</p>}
                <StatusBadge statut={ev.statutConclusion} />
                <VoteBar event={ev} />
                {ev.dossierUid && <ResumeIALink dossierUid={ev.dossierUid} texteUid={ev.texteUid} />}
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

function ResumeIALink({ dossierUid, texteUid }: { dossierUid: string; texteUid?: string | null }) {
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

// ── Card footer (social icons) ──────────────────────────────

function CardFooter({ dossierUid, texteUid, showResumeIA = true }: { dossierUid?: string | null; texteUid?: string | null; showResumeIA?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", paddingTop: 14, marginTop: 12, width: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        {showResumeIA && dossierUid ? (
          <ResumeIALink dossierUid={dossierUid} texteUid={texteUid} />
        ) : <span />}
      </div>
      <div style={{ display: "flex", flexGrow: 1, flexBasis: 0, justifyContent: "space-around", alignItems: "center" }}>
        <button type="button" className="text-muted-foreground/30 hover:text-green-500 transition-colors" aria-label="J'approuve">
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="text-muted-foreground/30 hover:text-red-500 transition-colors" aria-label="Je désapprouve">
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="text-muted-foreground/30 hover:text-blue-500 transition-colors" aria-label="Sauvegarder">
          <Bookmark className="w-3.5 h-3.5" />
        </button>
        <button type="button" className="text-muted-foreground/30 hover:text-blue-500 transition-colors" aria-label="Partager">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
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
  // NAVETTE : même format que DEPOT_TEXTE (organeName · libelleActe titre)
  if (t === "NAVETTE") {
    return (
      <p className="text-sm leading-snug mb-0.5">
        {e.organeName && <span className="text-muted-foreground">{e.organeName} · </span>}
        {e.libelleActe && <span className="text-muted-foreground">{e.libelleActe}. </span>}
        <span>{e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}</span>
      </p>
    );
  }
  // DEPOT_RAPPORT : single → chambre · libelleActe titre, multi → dossierTitre
  if (t === "DEPOT_RAPPORT") {
    if (group.events.length > 1) {
      return (
        <p className="text-sm leading-snug mb-0.5">
          {group.dossierTitre || e.titre}
        </p>
      );
    }
    const chambre = e.organeCodeType === "COMSENAT" ? "Sénat" : "Assemblée";
    return (
      <p className="text-sm leading-snug mb-0.5">
        <span className="text-muted-foreground">{chambre} · </span>
        {e.libelleActe && <span className="text-muted-foreground">{e.libelleActe}. </span>}
        <span>{e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}</span>
      </p>
    );
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
  // CMP_RAPPORT : même format que DEPOT_RAPPORT
  if (t === "CMP_RAPPORT") {
    if (group.events.length > 1) {
      return (
        <p className="text-sm leading-snug mb-0.5">
          {group.dossierTitre || e.titre}
        </p>
      );
    }
    const chambre = e.organeCodeType === "COMSENAT" ? "Sénat" : "Assemblée";
    return (
      <p className="text-sm leading-snug mb-0.5">
        <span className="text-muted-foreground">{chambre} · </span>
        {e.libelleActe && <span className="text-muted-foreground">{e.libelleActe}. </span>}
        <span>{e.texteTitre || e.texteDenomination || group.dossierTitre || e.titre}</span>
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

// ── Grouped event card (unifié style X) ─────────────────────

function GroupedEventCard({ group, index }: { group: GroupedFeedEvent; index: number }) {
  const config = EVENT_CONFIG[group.type];
  const Icon = config.icon;
  const e = group.events[0];
  const multi = group.events.length > 1;
  const shortDate = formatShortDate(group.date);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="flex gap-3 px-1 py-3 border-b hover:bg-muted/30 transition-colors cursor-default"
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
          {group.type !== "CC_SAISINE" && <span className="shrink-0">·</span>}
          {(group.type === "DEPOT_TEXTE" || group.type === "NAVETTE") && e.auteur ? (
            <>
              <span className="font-bold text-foreground shrink-0">{e.auteur}</span>
              {e.groupeAbrege && <span className="font-normal shrink-0">/{e.groupeAbrege}</span>}
            </>
          ) : group.type === "DECISION" ? (
            (() => { const inst = institutionName(e.organeCodeType, e.organeName); return inst ? <span className="shrink-0">/{inst}</span> : null; })()
          ) : (group.type === "DEPOT_RAPPORT" || group.type === "CMP_RAPPORT") && !multi && e.texteProvenance ? (
            <>
              <span className="font-bold text-foreground shrink-0">{e.texteProvenance}</span>
              {e.organeName && <span className="font-normal truncate">/{e.organeName}</span>}
            </>
          ) : (group.type === "DEPOT_RAPPORT" || group.type === "CMP_RAPPORT") && multi ? (
            null
          ) : group.type === "CMP_CONVOCATION" ? (
            null
          ) : group.type === "CC_SAISINE" ? (
            (() => { const inst = institutionName(e.organeCodeType, e.organeName); return inst ? <span className="shrink-0">/{inst}</span> : null; })()
          ) : (
            e.organeName && <span className="truncate">{e.organeName}</span>
          )}
          {((group.type === "DEPOT_TEXTE" || group.type === "NAVETTE") ? e.auteur : group.type === "DECISION" ? institutionName(e.organeCodeType, e.organeName) : (group.type === "DEPOT_RAPPORT" || group.type === "CMP_RAPPORT") ? (!multi && e.texteProvenance) : group.type === "CMP_CONVOCATION" ? false : group.type === "CC_SAISINE" ? institutionName(e.organeCodeType, e.organeName) : e.organeName) && <span className="shrink-0">·</span>}
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

        {/* Footer : Résumé IA (single) + icônes */}
        <CardFooter
          dossierUid={group.dossierUid}
          texteUid={e.texteUid}
          showResumeIA={!multi && group.type !== "CC_SAISINE" && group.type !== "CMP_CONVOCATION"}
        />
      </div>
    </motion.article>
  );
}

// ── Main component ──────────────────────────────────────────

interface WeekFeedClientProps {
  groupedEvents: GroupedFeedEvent[];
  dossierMode: boolean;
  dossierTitre: string | null;
  dayGroups: { date: string; events: unknown[] }[];
  kpis: WeekKpis;
  weekNumber: number;
  year: number;
  weekStartFormatted: string;
  weekEndFormatted: string;
  weekRangeShort: string;
  prevWeek: string;
  nextWeek: string;
  isCurrentOrFutureWeek: boolean;
}

export function WeekFeedClient({
  groupedEvents,
  dossierMode,
  dossierTitre,
  kpis,
  weekNumber,
  weekStartFormatted,
  weekEndFormatted,
  weekRangeShort,
  prevWeek,
  nextWeek,
  isCurrentOrFutureWeek,
}: WeekFeedClientProps) {
  const [activeFilter, setActiveFilter] = useState("tous");
  const filtered = groupedEvents.filter(g => matchesFilter(g.type, activeFilter));

  // ── Dossier mode ──
  if (dossierMode) {
    return (
      <TooltipProvider>
        <div className="max-w-xl mx-auto px-4 py-6">
          <div className="mb-5">
            <Link href="/Week" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2">
              <ArrowLeft className="w-3 h-3" />Retour au fil
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {dossierTitre || "Dossier législatif"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Timeline complète · {groupedEvents.length} étape{groupedEvents.length > 1 ? "s" : ""}
            </p>
          </div>

          <FilterBar activeFilter={activeFilter} onFilter={setActiveFilter} />

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

  // ── Week mode ──
  return (
    <TooltipProvider>
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fil de la Semaine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{weekStartFormatted} — {weekEndFormatted}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-5">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/Week?semaine=${prevWeek}`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Précédente</span>
              <span className="sm:hidden">Préc.</span>
            </Link>
          </Button>
          <span className="text-xs font-medium text-muted-foreground">S{weekNumber} · {weekRangeShort}</span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            disabled={isCurrentOrFutureWeek}
            className={isCurrentOrFutureWeek ? "pointer-events-none opacity-40" : ""}
          >
            <Link href={`/Week?semaine=${nextWeek}`}>
              <span className="hidden sm:inline">Suivante</span>
              <span className="sm:hidden">Suiv.</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* KPI pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {[
            { icon: Activity, value: kpis.totalEvents, label: "événements", color: "text-primary" },
            { icon: BarChart3, value: kpis.scrutins, label: kpis.scrutins > 1 ? "scrutins" : "scrutin", color: "text-fuchsia-600 dark:text-fuchsia-400" },
            { icon: FileText, value: kpis.nouveauxTextes, label: "textes", color: "text-blue-600 dark:text-blue-400" },
            { icon: CheckCircle2, value: kpis.promulgations, label: kpis.promulgations > 1 ? "lois" : "loi", color: "text-green-600 dark:text-green-400" },
          ].map(kpi => (
            <div key={kpi.label} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 shrink-0">
              <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
              <span className="text-sm font-semibold tabular-nums"><AnimatedNumber value={kpi.value} duration={1.2} /></span>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
          ))}
        </div>

        <FilterBar activeFilter={activeFilter} onFilter={setActiveFilter} />

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

        <Footer />
      </div>
    </TooltipProvider>
  );
}

// ── Shared small components ─────────────────────────────────

function FilterBar({ activeFilter, onFilter }: { activeFilter: string; onFilter: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-1 border-b">
      {FILTER_TABS.map(tab => (
        <button
          key={tab.value}
          onClick={() => onFilter(tab.value)}
          className={cn(
            "px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors relative",
            activeFilter === tab.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {activeFilter === tab.value && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
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
      <h2 className="text-base font-semibold mb-1">Semaine calme au Parlement</h2>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Aucun événement législatif enregistré. Essayez une autre semaine.
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
