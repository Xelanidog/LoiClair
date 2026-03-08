"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView, type Variants, type Easing } from "framer-motion"
import {
  ArrowRight,
  Heart,
  Github,
  Shield,
  BadgeCheck,
  Sparkles,
  BarChart2,
  RefreshCw,
  Search,

  Newspaper,
  Bell,
  Mail,
  X,
  Check,
  Vote,
  FileText,
  BarChart3,
  CheckCircle2,
  ListFilter,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------
const EASE: Easing = "easeOut"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
}

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE },
  },
}

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE },
  },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// ---------------------------------------------------------------------------
// AnimatedSection — triggers fadeUp when element enters viewport
// ---------------------------------------------------------------------------
function AnimatedSection({
  children,
  className,
  variants = fadeUp,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  variants?: Variants
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}



// ---------------------------------------------------------------------------
// FeedMockup — fake browser window showing the monthly feed
// ---------------------------------------------------------------------------
const FEED_EVENTS = [
  {
    icon: FileText,
    label: "Nouveau texte",
    context: "Assemblée",
    date: "3 mar",
    color: "text-primary",
    iconBg: "bg-primary/10",
    title: "Projet de loi relatif à la transition énergétique",
    footer: "ia" as const,
  },
  {
    icon: BarChart3,
    label: "Décision",
    context: "Assemblée",
    date: "28 fév",
    color: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    title: "Budget 2026 — Article 7",
    vote: { pour: 342, contre: 210, abs: 25 },
    footer: "adopted" as const,
  },
  {
    icon: CheckCircle2,
    label: "Loi promulguée",
    context: null,
    date: "25 fév",
    color: "text-[#27AE60] dark:text-[#2ECC71]",
    iconBg: "bg-[#27AE60]/10",
    title: "Loi n° 2026-142 relative à la protection des données personnelles",
    footer: "law" as const,
  },
]

const FEED_PILLS = [
  { label: "Tous", count: 12, active: true },
  { label: "Textes", count: 5, active: false },
  { label: "Décisions", count: 4, active: false },
  { label: "Promulg.", count: 3, active: false },
]

function FeedMockup() {
  const total = 577
  return (
    <div
      className="rounded-2xl border shadow-2xl bg-card overflow-hidden"
      style={{}}
    >
      {/* Browser chrome */}
      <div className="bg-muted border-b px-4 py-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57] shrink-0" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shrink-0" />
        <span className="h-3 w-3 rounded-full bg-[#28C840] shrink-0" />
        <div className="flex-1 mx-3 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono">
          loiclair.fr/fil-du-mois
        </div>
      </div>

      <div className="p-4 space-y-0">
        {/* Filter pills */}
        <div className="flex gap-1.5 mb-3">
          {FEED_PILLS.map((pill) => (
            <span
              key={pill.label}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                pill.active
                  ? "border-foreground/30 bg-muted text-foreground"
                  : "border-border text-muted-foreground"
              )}
            >
              {pill.label}{" "}
              <span className="opacity-50 tabular-nums">{pill.count}</span>
            </span>
          ))}
        </div>

        {/* Event cards */}
        {FEED_EVENTS.map((event, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5 py-3",
              i < FEED_EVENTS.length - 1 && "border-b"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                event.iconBg
              )}
            >
              <event.icon className={cn("w-3.5 h-3.5", event.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Header */}
              <div className="flex items-baseline gap-1 text-[10px] text-muted-foreground">
                <span className={cn("font-semibold", event.color)}>
                  {event.label}
                </span>
                {event.context && (
                  <>
                    <span>·</span>
                    <span className="font-bold text-foreground">
                      {event.context}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{event.date}</span>
              </div>

              {/* Title */}
              <p className="text-xs leading-snug text-foreground line-clamp-2">
                {event.title}
              </p>

              {/* Vote bar */}
              {event.vote && (
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                    <div
                      style={{
                        width: `${(event.vote.pour / total) * 100}%`,
                        backgroundColor: "#27AE60",
                      }}
                      className="h-full"
                    />
                    <div
                      style={{
                        width: `${(event.vote.contre / total) * 100}%`,
                        backgroundColor: "#E74C3C",
                      }}
                      className="h-full"
                    />
                    <div
                      style={{
                        width: `${(event.vote.abs / total) * 100}%`,
                        backgroundColor: "#A8A29E",
                      }}
                      className="h-full"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {event.vote.pour}–{event.vote.contre}–{event.vote.abs}
                  </span>
                </div>
              )}

              {/* Footer */}
              {event.footer === "ia" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                  <Sparkles className="w-2.5 h-2.5" />
                  Résumé IA
                </span>
              )}
              {event.footer === "adopted" && (
                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#27AE60]/15 text-[#27AE60]">
                  Adopté
                </span>
              )}
              {event.footer === "law" && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Loi n° 2026-142
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DossierListMockup — fake browser window showing dossier list
// ---------------------------------------------------------------------------
const DOSSIER_FILTERS = [
  { label: "Tous", active: true },
  { label: "En cours", active: false },
  { label: "Adoptés", active: false },
  { label: "Rejetés", active: false },
]

const DOSSIER_ITEMS = [
  {
    title: "Projet de loi de finances 2026",
    chamber: "Assemblée",
    status: "En cours",
    statusColor: "bg-primary/10 text-primary",
    date: "3 mar 2026",
  },
  {
    title: "Proposition de loi relative au droit au logement",
    chamber: "Sénat",
    status: "Adopté",
    statusColor: "bg-[#27AE60]/10 text-[#27AE60]",
    date: "28 fév 2026",
  },
  {
    title: "Projet de loi sur la transition énergétique",
    chamber: "Assemblée",
    status: "En commission",
    statusColor: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
    date: "15 fév 2026",
  },
]

function DossierListMockup() {
  return (
    <div
      className="rounded-2xl border shadow-2xl bg-card overflow-hidden"
      style={{}}
    >
      {/* Browser chrome */}
      <div className="bg-muted border-b px-4 py-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57] shrink-0" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shrink-0" />
        <span className="h-3 w-3 rounded-full bg-[#28C840] shrink-0" />
        <div className="flex-1 mx-3 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono">
          loiclair.fr/dossiers-legislatifs
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Search + filter bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground">Rechercher un dossier…</span>
          </div>
          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ListFilter className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {DOSSIER_FILTERS.map((pill) => (
            <span
              key={pill.label}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                pill.active
                  ? "border-foreground/30 bg-muted text-foreground"
                  : "border-border text-muted-foreground"
              )}
            >
              {pill.label}
            </span>
          ))}
        </div>

        {/* Dossier rows */}
        {DOSSIER_ITEMS.map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 py-3",
              i < DOSSIER_ITEMS.length - 1 && "border-b"
            )}
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-medium">{item.chamber}</span>
                <span>·</span>
                <span>{item.date}</span>
              </div>
            </div>
            <span className={cn("shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full", item.statusColor)}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DashboardMockup — fake browser window showing KPI dashboard
// ---------------------------------------------------------------------------
const DASHBOARD_KPIS = [
  { label: "Députés", value: "577", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { label: "Taux de participation", value: "46%", icon: Vote, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/50" },
  { label: "Textes votés ce mois", value: "18", icon: FileText, color: "text-[#27AE60]", bg: "bg-[#27AE60]/10" },
]

const TEXTES_PAR_MOIS = [
  { label: "Oct", value: 28, max: 50 },
  { label: "Nov", value: 35, max: 50 },
  { label: "Déc", value: 22, max: 50 },
  { label: "Jan", value: 41, max: 50 },
  { label: "Fév", value: 33, max: 50 },
  { label: "Mar", value: 38, max: 50 },
]

function DashboardMockup() {
  return (
    <div
      className="rounded-2xl border shadow-2xl bg-card overflow-hidden"
      style={{}}
    >
      {/* Browser chrome */}
      <div className="bg-muted border-b px-4 py-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57] shrink-0" />
        <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shrink-0" />
        <span className="h-3 w-3 rounded-full bg-[#28C840] shrink-0" />
        <div className="flex-1 mx-3 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono">
          loiclair.fr/tableau-de-bord
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-2">
          {DASHBOARD_KPIS.map((kpi) => (
            <div key={kpi.label} className="rounded-xl bg-muted/50 p-3 space-y-1.5">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-3 h-3", kpi.color)} />
              </div>
              <p className="text-foreground tabular-nums" style={{ fontSize: "12px", fontWeight: 600 }}>{kpi.value}</p>
              <p className="text-muted-foreground" style={{ fontSize: "9px" }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Chart — Textes déposés par mois */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-foreground tracking-wide" style={{ fontSize: "9px", fontWeight: 500, textTransform: "uppercase" }}>
              Textes déposés par mois
            </p>
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2" style={{ height: "96px" }}>
            {TEXTES_PAR_MOIS.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-foreground tabular-nums" style={{ fontSize: "8px", fontWeight: 400 }}>
                  {bar.value}
                </span>
                <div className="w-full bg-muted overflow-hidden" style={{ height: "72px", borderRadius: "4px 4px 0 0" }}>
                  <div
                    className="w-full"
                    style={{
                      height: `${(bar.value / bar.max) * 100}%`,
                      backgroundColor: "hsl(174, 60%, 45%)",
                      marginTop: `${100 - (bar.value / bar.max) * 100}%`,
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "8px" }}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const TRUST_ITEMS = [
  { icon: Heart, label: "Gratuit" },
  { icon: Github, label: "Open source" },
  { icon: Shield, label: "Indépendant" },
  { icon: BadgeCheck, label: "Données officielles" },
]


const FEATURES = [
  {
    icon: RefreshCw,
    title: "Données en temps réel",
    description: "Mise à jour quotidienne depuis les sources officielles.",
  },
  {
    icon: Sparkles,
    title: "Résumés par l'IA",
    description: "Chaque texte traduit en langage courant, sans jargon.",
  },
  {
    icon: BarChart2,
    title: "Statistiques",
    description:
      "Parité, groupes politiques, votes — tout en chiffres.",
  },
  {
    icon: Search,
    title: "Trouver vos élus",
    description: "Retrouvez votre député ou sénateur en secondes.",
  },
  {
    icon: Vote,
    title: "Vote citoyen",
    description:
      "Donnez votre avis et comparez-le aux votes du Parlement.",
  },
  {
    icon: Newspaper,
    title: "Fil d'actualité",
    description: "L'essentiel de l'activité parlementaire chaque mois.",
  },
  {
    icon: Bell,
    title: "Alertes personnalisées",
    description: "Suivez un texte ou un élu, soyez alerté.",
  },
  {
    icon: Mail,
    title: "Newsletter IA",
    description:
      "Chaque semaine, l'activité parlementaire résumée par email.",
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO IMPACT — centré, plein écran                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col items-center justify-center pt-20 lg:pt-24 pb-8 relative" style={{ minHeight: "92vh" }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center w-full">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#27AE60] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#27AE60]" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Bêta privée — Gratuit · Indépendant · Neutre
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12]">
              Chaque mois, des lois
              <br />
              sont votées <span className="text-primary">en votre nom.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Savez-vous ce qui a été décidé en votre nom dernièrement&nbsp;?
            </p>
            <p className="text-sm md:text-base text-muted-foreground opacity-70 leading-relaxed max-w-lg mx-auto">
              LoiClair traduit l&apos;activité législative française en langage
              simple — pour comprendre, suivre, et participer.
            </p>

            {/* CTA */}
            <div className="pt-2">
              <Link href="/Month">
                <Button size="lg" className="rounded-full gap-2 hover:scale-105">
                  Fil d&apos;actu parlementaire
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 1b. HERO PRODUIT — "enfin lisible" + mockup                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative overflow-visible"
        style={{ background: "linear-gradient(135deg, hsl(174 60% 96%), hsl(174 40% 93%) 50%, hsl(43 50% 95%))", paddingTop: "240px", paddingBottom: "5rem", marginTop: "-120px" }}
      >
        {/* Vague blanche en haut — déborde dans le hero */}
        <svg
          className="absolute left-0 w-full pointer-events-none"
          style={{ height: "160px", top: "-1px" }}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0H1440V80C1200 130 960 30 720 80C480 130 240 30 0 80V0Z"
            fill="white"
          />
        </svg>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 items-center" style={{ gap: "4rem" }}>
            {/* Left — Texte */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <h2
                  className="font-bold tracking-tight"
                  style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)", lineHeight: 1.15 }}
                >
                  Avec LoiClair, la politique française est{" "}
                  <span className="text-primary">enfin lisible.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-lg" style={{ fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)" }}>
                  Une boîte à outils citoyenne qui transforme le jargon législatif
                  en langage clair. Des statistiques clés sur l&apos;activité
                  parlementaire, une vue simplifiée pour chaque dossier, un fil
                  d&apos;actualité pour suivre au jour le jour tout ce qui se passe
                  au Parlement&nbsp;: nouveaux textes, décisions, votes…
                </p>
              </div>
            </AnimatedSection>

            {/* Right — Trust items */}
            <AnimatedSection variants={fadeRight}>
              <div className="grid grid-cols-2 gap-4">
                {TRUST_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border bg-background/80 px-4 py-3">
                    <item.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. LES DOSSIERS LÉGISLATIFS                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 items-center" style={{ gap: "4rem" }}>
            {/* Left — Texte */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <p className="text-primary text-xs uppercase tracking-widest font-semibold">
                  Tous les textes au même endroit
                </p>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
                    lineHeight: 1.15,
                  }}
                >
                  Les dossiers législatifs,{" "}
                  <span className="text-primary">simplifiés.</span>
                </h2>
                <p
                  className="text-muted-foreground leading-relaxed max-w-lg"
                  style={{
                    fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)",
                  }}
                >
                  Un dossier législatif, c&apos;est le parcours complet d&apos;un
                  texte de loi, du dépôt au vote final. Recherchez, filtrez et
                  suivez chaque projet ou proposition de loi. Statut, chambre,
                  résumé IA — tout est là, à jour.
                </p>
                <Link href="/dossiers-legislatifs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-primary hover:text-primary px-0 text-base"
                  >
                    Voir les dossiers
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Right — Mockup */}
            <AnimatedSection variants={fadeRight} className="px-2 lg:px-0">
              <Link href="/dossiers-legislatifs" className="block hover:scale-[1.02] transition-transform">
                <DossierListMockup />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. LE FIL D'ACTU                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 items-center" style={{ gap: "6rem" }}>
            {/* Left — Mockup */}
            <AnimatedSection variants={fadeLeft} className="px-2 lg:px-0">
              <Link href="/Month" className="block hover:scale-[1.02] transition-transform">
                <FeedMockup />
              </Link>
            </AnimatedSection>

            {/* Right — Texte */}
            <AnimatedSection variants={fadeRight}>
              <div className="space-y-5">
                <p className="text-primary text-xs uppercase tracking-widest font-semibold">
                  Votre fil d&apos;actualité
                </p>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
                    lineHeight: 1.15,
                  }}
                >
                  Suivez l&apos;activité parlementaire journalière,{" "}
                  <span className="text-primary">étape par étape.</span>
                </h2>
                <p
                  className="text-muted-foreground leading-relaxed max-w-lg"
                  style={{
                    fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)",
                  }}
                >
                  Aussi simple qu&apos;un fil d&apos;actualité sur un réseau social.
                  Chaque mois, LoiClair rassemble les textes déposés, les votes
                  en séance et les lois promulguées dans un fil clair et
                  chronologique. Plus besoin de chercher.
                </p>
                <Link href="/Month">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-primary hover:text-primary px-0 text-base"
                  >
                    Explorer le fil du mois
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. LE TABLEAU DE BORD                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28 border-y">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 items-center" style={{ gap: "4rem" }}>
            {/* Left — Texte */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <p className="text-primary text-xs uppercase tracking-widest font-semibold">
                  Vue d&apos;ensemble
                </p>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
                    lineHeight: 1.15,
                  }}
                >
                  Un tableau de bord{" "}
                  <span className="text-primary">pour tout comprendre.</span>
                </h2>
                <p
                  className="text-muted-foreground leading-relaxed max-w-lg"
                  style={{
                    fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)",
                  }}
                >
                  Composition de l&apos;Assemblée, répartition des groupes, parité,
                  âge moyen — les chiffres clés du Parlement en un coup d&apos;œil.
                </p>
                <Link href="/KPIs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-primary hover:text-primary px-0 text-base"
                  >
                    Explorer le tableau de bord
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Right — Mockup */}
            <AnimatedSection variants={fadeRight} className="px-2 lg:px-0">
              <Link href="/KPIs" className="block hover:scale-[1.02] transition-transform">
                <DashboardMockup />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. AVANT / APRES                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28 bg-muted/20 border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection className="mb-12 space-y-3 max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold">
              L&apos;IA résume chaque texte de loi pour vous
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Plus besoin de décrypter le jargon juridique. Notre IA analyse et résume chaque dossier législatif en langage clair, en quelques secondes.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Avant */}
            <AnimatedSection variants={fadeLeft}>
              <div className="bg-muted/30 rounded-2xl p-8 h-full flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-destructive">Avant</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-destructive/10 text-destructive px-3 py-1 rounded-full">
                    Sources officielles
                  </span>
                </div>

                <div className="font-mono text-xs leading-relaxed space-y-1.5 select-none">
                  {[
                    { text: "Article L. 432-1 du Code civil — Vu le décret n°2024-1138", opacity: 0.9 },
                    { text: "du 4 octobre 2024 portant modification des dispositions", opacity: 0.8 },
                    { text: "relatives aux modalités d'application de l'alinéa 3", opacity: 0.65 },
                    { text: "conformément aux dispositions de l'ordonnance n° 2023-389", opacity: 0.5 },
                    { text: "du 12 mai 2023 relative à l'exercice des compétences des...", opacity: 0.4 },
                    { text: "collectivités territoriales en matière de gestion publique", opacity: 0.3 },
                    { text: "...susvisées et après avis du Conseil d'État...", opacity: 0.2 },
                    { text: "§ 4 — Les conditions cumulatives définies à l'art. 7", opacity: 0.15 },
                    { text: "doivent faire l'objet d'une appréciation au cas par cas...", opacity: 0.1 },
                    { text: "tenant compte des circonstances mentionnées à l'art. 12 bis", opacity: 0.05 },
                  ].map((line, i) => (
                    <p key={i} className="text-foreground" style={{ opacity: line.opacity }}>
                      {line.text}
                    </p>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-destructive/20 mt-auto">
                  <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <X className="h-3 w-3 text-destructive" />
                  </div>
                  <p className="text-xs font-medium text-destructive">
                    Incompréhensible pour la plupart des citoyens
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Apres */}
            <AnimatedSection variants={fadeRight}>
              <div className="bg-card rounded-2xl p-8 border-2 border-primary/20 shadow-lg h-full flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Après</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    LoiClair
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Projet de loi de finances 2026
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ce texte fixe le budget de l&apos;État pour 2026. Il détermine
                    combien l&apos;État peut dépenser, et d&apos;où vient l&apos;argent (impôts,
                    emprunts…). Chaque ministère reçoit une enveloppe.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    "Budget total : 492 milliards d'euros",
                    "Présenté par le gouvernement en septembre",
                    "Doit être voté avant le 31 décembre",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-primary/15 mt-auto">
                  <div className="h-5 w-5 rounded-full bg-[#27AE60]/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[#27AE60]" />
                  </div>
                  <p className="text-xs font-medium text-[#27AE60]">
                    Compris en 30 secondes
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>



      {/* ------------------------------------------------------------------ */}
      {/* 8. VOTRE BOITE A OUTILS                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection className="mb-12 space-y-3 max-w-2xl">
            <h2 className="text-xl md:text-2xl font-bold">
              LoiClair, votre boîte à outils citoyenne
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tout ce dont vous avez besoin pour comprendre, suivre et participer
              à ce qui se passe au Parlement.
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl border bg-card p-5 space-y-3 cursor-default"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 8. CTA FINAL                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection>
            <div className="bg-foreground text-background rounded-2xl px-8 py-14 lg:py-20 text-center space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight">
                Et si on rendait la politique lisible ?
              </h2>
              <p className="text-sm md:text-base opacity-70 max-w-xl mx-auto leading-relaxed">
                Comprendre, c&apos;est le premier pas. Suivre, c&apos;est reprendre le
                contrôle. Participer, c&apos;est changer les choses.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/Month">
                  <Button
                    size="lg"
                    className="rounded-full gap-2 bg-background text-foreground hover:bg-background hover:scale-105"
                  >
                    Explorer le fil du mois
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dossiers-legislatifs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-full border border-background/20 text-background hover:bg-background/10 hover:text-background"
                  >
                    Voir les dossiers
                  </Button>
                </Link>
              </div>

              <p className="text-xs opacity-40 pt-2">
                Bêta privée — Données officielles de l&apos;Assemblée nationale
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
