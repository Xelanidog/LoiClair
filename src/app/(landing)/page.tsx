"use client"

import { useRef, useEffect, useState } from "react"
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
  BookOpen,
  MessageSquare,
  Layers,
  Newspaper,
  Bell,
  Mail,
  X,
  Check,
  Vote,
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
// AnimatedCounter — counts up from 0 to target when in view
// ---------------------------------------------------------------------------
function AnimatedCounter({
  target,
  suffix = "%",
  duration = 1500,
}: {
  target: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ProductMockup — fake browser window
// ---------------------------------------------------------------------------
function ProductMockup() {
  return (
    <div
      className="rounded-2xl border shadow-2xl bg-card overflow-hidden"
      style={{ transform: "rotate(2deg)" }}
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

      {/* Card content */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Dossier législatif
          </p>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground leading-snug">
              Projet de loi de finances 2026
            </h3>
            <span className="shrink-0 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              En cours
            </span>
          </div>
        </div>

        {/* AI summary block */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <p className="text-[10px] font-semibold uppercase tracking-wide">
              Résumé IA
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ce texte fixe le budget de l&apos;État pour 2026, répartit les dépenses
            par ministère et définit les recettes fiscales prévues pour l&apos;année.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Étape 3/6 — Commission des finances</span>
            <span className="font-medium text-primary">50%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-[10px] text-muted-foreground">
            Mis à jour aujourd&apos;hui
          </p>
          <button className="text-[10px] font-medium text-primary flex items-center gap-1">
            Lire le résumé
            <ArrowRight className="h-3 w-3" />
          </button>
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

const STATS = [
  {
    value: 54,
    label: "d'abstention aux législatives 2022",
    source: "Source : Ministère de l'Intérieur",
  },
  {
    value: 74,
    label: "des Français estiment les politiques corrompus",
    source: "Source : CEVIPOF 2025",
  },
  {
    value: 16,
    label: "des inscrits n'ont voté à aucun tour",
    source: "Source : Analyse post-électorale 2022",
  },
]

const OBSTACLES = [
  {
    number: "01",
    icon: BookOpen,
    title: "Dispersion des sources",
    description:
      "Assemblée, Sénat, Légifrance, JO… tout est éparpillé, introuvable pour le citoyen ordinaire.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Langage très technique",
    description:
      "Écrit pour des juristes, pas pour le citoyen moyen. Comprendre devient un effort.",
  },
  {
    number: "03",
    icon: Layers,
    title: "Volume écrasant",
    description:
      "Des dizaines de textes votés chaque mois. Impossible de tout suivre, on finit par abandonner.",
  },
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
      <section className="min-h-screen flex flex-col items-center justify-center pt-20 lg:pt-24 pb-8">
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

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/Month">
                <Button size="lg" className="rounded-full gap-2 hover:scale-105">
                  Découvrir le fil du mois
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dossiers-legislatifs">
                <Button variant="outline" size="lg" className="rounded-full">
                  Voir les dossiers
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 1b. HERO PRODUIT — "enfin lisible" + mockup                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Tagline produit */}
            <AnimatedSection variants={fadeLeft}>
              <div className="space-y-5">
                <h2
                  className="font-bold tracking-tight"
                  style={{ fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3rem)", lineHeight: 1.15 }}
                >
                  La politique française,{" "}
                  <span className="text-primary">enfin lisible.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-lg" style={{ fontSize: "clamp(1.125rem, 1.2vw + 0.5rem, 1.25rem)" }}>
                  Un tableau de bord citoyen qui transforme le jargon
                  législatif en langage clair. Chaque texte résumé, chaque
                  vote expliqué.
                </p>
                <Link href="/Month">
                  <Button variant="ghost" size="lg" className="gap-2 text-primary hover:text-primary px-0 text-base">
                    Explorer le tableau de bord
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Right — Mockup */}
            <AnimatedSection variants={fadeRight}>
              <ProductMockup />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TRUST BAND                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-0">
            {TRUST_ITEMS.map((item, index) => (
              <div key={item.label} className="flex items-center">
                <div className="flex items-center gap-2 px-6">
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                {index < TRUST_ITEMS.length - 1 && (
                  <div className="hidden md:block w-px h-5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. LE CONSTAT                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection className="mb-12 space-y-2">
            <p className="text-primary text-xs uppercase tracking-widest font-semibold">
              Le constat
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Une crise de confiance
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="rounded-2xl border divide-y md:divide-y-0 md:divide-x md:grid md:grid-cols-3 overflow-hidden">
              {STATS.map((stat) => (
                <div key={stat.value} className="p-8 lg:p-10 space-y-2">
                  <p className="text-5xl md:text-6xl font-black text-primary tabular-nums">
                    <AnimatedCounter target={stat.value} />
                  </p>
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {stat.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.source}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. LES VRAIS FREINS                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection className="mb-12 space-y-2">
            <p className="text-primary text-xs uppercase tracking-widest font-semibold">
              Pourquoi c&apos;est difficile
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Les vrais freins
            </h2>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-3 gap-5"
          >
            {OBSTACLES.map((item) => (
              <motion.div
                key={item.number}
                variants={fadeUp}
                className="rounded-2xl border bg-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold text-primary/30 font-mono">
                    {item.number}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. AVANT / APRES                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection className="mb-12 space-y-2 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              Comprendre la loi, avant et après LoiClair
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Avant */}
            <AnimatedSection variants={fadeLeft}>
              <div className="bg-muted/30 rounded-2xl p-8 h-full flex flex-col gap-5">
                <div>
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
                <div>
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
      {/* 6. VOTRE BOITE A OUTILS                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AnimatedSection className="mb-12 space-y-3 text-center max-w-2xl mx-auto">
            <p className="text-primary text-xs uppercase tracking-widest font-semibold">
              La solution
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
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
      {/* 7. CTA FINAL                                                        */}
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
