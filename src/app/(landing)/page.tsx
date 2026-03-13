"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView, type Variants, type Easing } from "framer-motion"
import { useTranslations } from "next-intl"
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
function FeedMockup() {
  const t = useTranslations("landing")
  const total = 577

  const FEED_EVENTS = [
    {
      icon: FileText,
      label: t("feedLabelNewText"),
      context: t("feedContext"),
      date: t("feedDate1"),
      color: "text-primary",
      iconBg: "bg-primary/10",
      title: t("feedTitle1"),
      footer: "ia" as const,
    },
    {
      icon: BarChart3,
      label: t("feedLabelDecision"),
      context: t("feedContext"),
      date: t("feedDate2"),
      color: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-100 dark:bg-violet-900/50",
      title: t("feedTitle2"),
      vote: { pour: 342, contre: 210, abs: 25 },
      footer: "adopted" as const,
    },
    {
      icon: CheckCircle2,
      label: t("feedLabelEnacted"),
      context: null,
      date: t("feedDate3"),
      color: "text-[#27AE60] dark:text-[#2ECC71]",
      iconBg: "bg-[#27AE60]/10",
      title: t("feedTitle3"),
      footer: "law" as const,
    },
  ]

  const FEED_PILLS = [
    { label: t("feedPillAll"), count: 12, active: true },
    { label: t("feedPillTexts"), count: 5, active: false },
    { label: t("feedPillDecisions"), count: 4, active: false },
    { label: t("feedPillEnacted"), count: 3, active: false },
  ]

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
                  {t("feedFooterIa")}
                </span>
              )}
              {event.footer === "adopted" && (
                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#27AE60]/15 text-[#27AE60]">
                  {t("feedFooterAdopted")}
                </span>
              )}
              {event.footer === "law" && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {t("feedFooterLaw")}
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
function DossierListMockup() {
  const t = useTranslations("landing")

  const DOSSIER_FILTERS = [
    { label: t("dossierFilterAll"), active: true },
    { label: t("dossierFilterOngoing"), active: false },
    { label: t("dossierFilterAdopted"), active: false },
    { label: t("dossierFilterRejected"), active: false },
  ]

  const DOSSIER_ITEMS = [
    {
      title: t("dossierItem1Title"),
      chamber: t("dossierItem1Chamber"),
      status: t("dossierItem1Status"),
      statusColor: "bg-primary/10 text-primary",
      date: t("dossierItem1Date"),
    },
    {
      title: t("dossierItem2Title"),
      chamber: t("dossierItem2Chamber"),
      status: t("dossierItem2Status"),
      statusColor: "bg-[#27AE60]/10 text-[#27AE60]",
      date: t("dossierItem2Date"),
    },
    {
      title: t("dossierItem3Title"),
      chamber: t("dossierItem3Chamber"),
      status: t("dossierItem3Status"),
      statusColor: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
      date: t("dossierItem3Date"),
    },
  ]

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
            <span className="text-[10px] text-muted-foreground">{t("dossierSearch")}</span>
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
function DashboardMockup() {
  const t = useTranslations("landing")

  const DASHBOARD_KPIS = [
    { label: t("dashboardKpi1Label"), value: "577", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: t("dashboardKpi2Label"), value: "46%", icon: Vote, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/50" },
    { label: t("dashboardKpi3Label"), value: "18", icon: FileText, color: "text-[#27AE60]", bg: "bg-[#27AE60]/10" },
  ]

  const TEXTES_PAR_MOIS = [
    { label: t("dashboardMonthOct"), value: 28, max: 50 },
    { label: t("dashboardMonthNov"), value: 35, max: 50 },
    { label: t("dashboardMonthDec"), value: 22, max: 50 },
    { label: t("dashboardMonthJan"), value: 41, max: 50 },
    { label: t("dashboardMonthFeb"), value: 33, max: 50 },
    { label: t("dashboardMonthMar"), value: 38, max: 50 },
  ]

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

        {/* Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-foreground tracking-wide" style={{ fontSize: "9px", fontWeight: 500, textTransform: "uppercase" }}>
              {t("dashboardChartTitle")}
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
// Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const t = useTranslations("landing")

  const TRUST_ITEMS = [
    { icon: Heart, label: t("trustFree") },
    { icon: Github, label: t("trustOpenSource") },
    { icon: Shield, label: t("trustIndependent") },
    { icon: BadgeCheck, label: t("trustOfficialData") },
  ]

  const FEATURES = [
    {
      icon: RefreshCw,
      title: t("feature1Title"),
      description: t("feature1Description"),
    },
    {
      icon: Sparkles,
      title: t("feature2Title"),
      description: t("feature2Description"),
    },
    {
      icon: BarChart2,
      title: t("feature3Title"),
      description: t("feature3Description"),
    },
    {
      icon: Search,
      title: t("feature4Title"),
      description: t("feature4Description"),
    },
    {
      icon: Vote,
      title: t("feature5Title"),
      description: t("feature5Description"),
    },
    {
      icon: Newspaper,
      title: t("feature6Title"),
      description: t("feature6Description"),
    },
    {
      icon: Bell,
      title: t("feature7Title"),
      description: t("feature7Description"),
    },
    {
      icon: Mail,
      title: t("feature8Title"),
      description: t("feature8Description"),
    },
  ]

  const BEFORE_LINES: { key: string; opacity: number }[] = [
    { key: "beforeLine1", opacity: 0.9 },
    { key: "beforeLine2", opacity: 0.8 },
    { key: "beforeLine3", opacity: 0.65 },
    { key: "beforeLine4", opacity: 0.5 },
    { key: "beforeLine5", opacity: 0.4 },
    { key: "beforeLine6", opacity: 0.3 },
    { key: "beforeLine7", opacity: 0.2 },
    { key: "beforeLine8", opacity: 0.15 },
    { key: "beforeLine9", opacity: 0.1 },
    { key: "beforeLine10", opacity: 0.05 },
  ]

  return (
    <div className="overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HERO IMPACT — centré, plein écran                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex flex-col items-center justify-center pt-20 lg:pt-24 pb-8 relative min-h-[65vh] lg:min-h-[92vh]">
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
                {t("heroBadge")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12]">
              {t.rich("heroTitle", {
                highlight: (chunks) => (
                  <>
                    <br />
                    <span className="text-primary">{chunks}</span>
                  </>
                ),
              })}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {t("heroSubtitle")}
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto" style={{ opacity: 0.7 }}>
              {t("heroDescription")}
            </p>

            {/* CTA */}
            <div className="pt-2">
              <Link href="/Month">
                <Button size="lg" className="rounded-full gap-2 hover:scale-105">
                  {t("heroCta")}
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
        style={{ background: "var(--landing-hero2-bg)", paddingTop: "240px", paddingBottom: "5rem", marginTop: "-120px" }}
      >
        {/* Vagues animées SMIL — animations internes au SVG, pas de CSS transform */}
        <svg
          className="absolute left-0 w-full pointer-events-none"
          style={{ height: "160px", top: "-1px" }}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vague arrière-plan — plus lente, sens inverse, semi-transparente */}
          <g style={{ opacity: 0.5 }}>
            <path
              d="M0 0H2880V90C2580 130 2340 50 2100 90C1860 130 1620 50 1380 90C1140 130 900 50 660 90C420 130 180 50 0 90V0Z"
              style={{ fill: "var(--background)" }}
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              from="-1440 0"
              to="0 0"
              dur="28s"
              repeatCount="indefinite"
            />
          </g>
          {/* Vague principale — premier plan */}
          <g>
            <path
              d="M0 0H2880V80C2640 130 2400 30 2160 80C1920 130 1680 30 1440 80C1200 130 960 30 720 80C480 130 240 30 0 80V0Z"
              style={{ fill: "var(--background)" }}
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to="-1440 0"
              dur="20s"
              repeatCount="indefinite"
            />
          </g>
        </svg>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-16">
            {/* Left — Texte */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <h2
                  className="font-bold tracking-tight"
                  style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)", lineHeight: 1.15 }}
                >
                  {t.rich("hero2Title", {
                    highlight: (chunks) => (
                      <span className="text-primary">{chunks}</span>
                    ),
                  })}
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-lg" style={{ fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)" }}>
                  {t("hero2Description")}
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
          <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-16">
            {/* Left — Texte */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <p className="text-primary text-xs uppercase tracking-widest font-semibold">
                  {t("dossierOverline")}
                </p>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
                    lineHeight: 1.15,
                  }}
                >
                  {t.rich("dossierSectionTitle", {
                    highlight: (chunks) => (
                      <span className="text-primary">{chunks}</span>
                    ),
                  })}
                </h2>
                <p
                  className="text-muted-foreground leading-relaxed max-w-lg"
                  style={{
                    fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)",
                  }}
                >
                  {t("dossierDescription")}
                </p>
                <Link href="/dossiers-legislatifs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-primary hover:text-primary px-0 text-base"
                  >
                    {t("dossierCta")}
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
          <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-24">
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
                  {t("feedOverline")}
                </p>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
                    lineHeight: 1.15,
                  }}
                >
                  {t.rich("feedSectionTitle", {
                    highlight: (chunks) => (
                      <span className="text-primary">{chunks}</span>
                    ),
                  })}
                </h2>
                <p
                  className="text-muted-foreground leading-relaxed max-w-lg"
                  style={{
                    fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)",
                  }}
                >
                  {t("feedDescription")}
                </p>
                <Link href="/Month">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-primary hover:text-primary px-0 text-base"
                  >
                    {t("feedCta")}
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
          <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-16">
            {/* Left — Texte */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <p className="text-primary text-xs uppercase tracking-widest font-semibold">
                  {t("dashboardOverline")}
                </p>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
                    lineHeight: 1.15,
                  }}
                >
                  {t.rich("dashboardSectionTitle", {
                    highlight: (chunks) => (
                      <span className="text-primary">{chunks}</span>
                    ),
                  })}
                </h2>
                <p
                  className="text-muted-foreground leading-relaxed max-w-lg"
                  style={{
                    fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)",
                  }}
                >
                  {t("dashboardDescription")}
                </p>
                <Link href="/KPIs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-primary hover:text-primary px-0 text-base"
                  >
                    {t("dashboardCta")}
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
              {t("beforeAfterTitle")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("beforeAfterDescription")}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Avant */}
            <AnimatedSection variants={fadeLeft}>
              <div className="bg-muted/30 rounded-2xl p-8 h-full flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-destructive">{t("beforeLabel")}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-destructive/10 text-destructive px-3 py-1 rounded-full">
                    {t("beforeSourcesBadge")}
                  </span>
                </div>

                <div className="font-mono text-xs leading-relaxed space-y-1.5 select-none">
                  {BEFORE_LINES.map((line, i) => (
                    <p key={i} className="text-foreground" style={{ opacity: line.opacity }}>
                      {t(line.key as Parameters<typeof t>[0])}
                    </p>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-destructive/20 mt-auto">
                  <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <X className="h-3 w-3 text-destructive" />
                  </div>
                  <p className="text-xs font-medium text-destructive">
                    {t("beforeCaption")}
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Apres */}
            <AnimatedSection variants={fadeRight}>
              <div className="bg-card rounded-2xl p-8 border-2 border-primary/20 shadow-lg h-full flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">{t("afterLabel")}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    LoiClair
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("afterTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("afterDescription")}
                  </p>
                </div>

                <div className="space-y-2">
                  {(["afterBullet1", "afterBullet2", "afterBullet3"] as const).map((key) => (
                    <div key={key} className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">{t(key)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-primary/15 mt-auto">
                  <div className="h-5 w-5 rounded-full bg-[#27AE60]/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[#27AE60]" />
                  </div>
                  <p className="text-xs font-medium text-[#27AE60]">
                    {t("afterCaption")}
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
              {t("featuresTitle")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("featuresDescription")}
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={idx}
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
      {/* 9. CTA FINAL                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection>
            <div className="bg-foreground text-background rounded-2xl px-8 py-14 lg:py-20 text-center space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold max-w-2xl mx-auto leading-tight">
                {t("ctaTitle")}
              </h2>
              <p className="text-sm md:text-base max-w-xl mx-auto leading-relaxed" style={{ opacity: 0.7 }}>
                {t("ctaDescription")}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/Month">
                  <Button
                    size="lg"
                    className="rounded-full gap-2 bg-background text-foreground hover:bg-background hover:scale-105"
                  >
                    {t("ctaPrimary")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dossiers-legislatifs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-full border border-background/20 text-background hover:bg-background/10 hover:text-background"
                  >
                    {t("ctaSecondary")}
                  </Button>
                </Link>
              </div>

              <p className="text-xs pt-2" style={{ opacity: 0.4 }}>
                {t("ctaFootnote")}
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
