// src/app/(app)/about/page.tsx

// =============================================================================
// PAGE À PROPOS - Version finale simplifiée (sans accordéons suite feedback)
// Changements clés :
// - Suppression totale des accordéons → tout texte statique et visible d'un coup
// - Contenu des sections déplacé en paragraphes/listes directes sous headings
// - Largeur max-w-3xl centrée pour texte ultra-lisible (desktop/mobile)
// - Liens officiels complets (Assemblée, Sénat, Conseil constitutionnel + open data)
// - IA mentionnée partout : dev site, données, résumés
// - Section feedback/contribution conservée
// Design : 100% texte, minimaliste, scan rapide (objectif : compréhension en 30s)
// Optimisations globales : Statique pur (0 JS interactif), Shadcn light, Tailwind responsive
// =============================================================================

import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AboutPage() {
  const t = await getTranslations("about")

  return (
    <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
        </div>

        {/* Section 1 : Le constat */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">
            {t("constat.heading")}
          </h2>

          <div className="rounded-2xl border divide-y md:divide-y-0 md:divide-x md:grid md:grid-cols-3 overflow-hidden mb-8">
            <div className="p-8 space-y-2">
              <p className="text-5xl font-black text-primary tabular-nums">{t("constat.stat1Value")}</p>
              <p className="text-sm font-medium leading-snug">{t("constat.stat1Label")}</p>
              <p className="text-xs text-muted-foreground">{t("constat.stat1Source")}</p>
            </div>
            <div className="p-8 space-y-2">
              <p className="text-5xl font-black text-primary tabular-nums">{t("constat.stat2Value")}</p>
              <p className="text-sm font-medium leading-snug">{t("constat.stat2Label")}</p>
              <p className="text-xs text-muted-foreground">{t("constat.stat2Source")}</p>
            </div>
            <div className="p-8 space-y-2">
              <p className="text-5xl font-black text-primary tabular-nums">{t("constat.stat3Value")}</p>
              <p className="text-sm font-medium leading-snug">{t("constat.stat3Label")}</p>
              <p className="text-xs text-muted-foreground">{t("constat.stat3Source")}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">{t("constat.problem1Title")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("constat.problem1Desc")}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">{t("constat.problem2Title")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("constat.problem2Desc")}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">{t("constat.problem3Title")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("constat.problem3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 : Qu'est-ce que LoiClair ? (texte direct) */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">{t("whatIs.heading")}</h2>
          <p className="text-base leading-relaxed mb-6">
            {t("whatIs.para1")}
          </p>
          <p className="text-base leading-relaxed">
            {t("whatIs.para2")}
          </p>
        </section>

        {/* Section 3 : Construction technique (texte direct, badges pour tech) */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">{t("howBuilt.heading")}</h2>
          <p className="text-base leading-relaxed mb-4">
            {t("howBuilt.para1")} <strong>{t("howBuilt.para1Strong")}</strong>{t("howBuilt.para1Suffix")}
          </p>
          <p className="text-base leading-relaxed mb-6">
            {t("howBuilt.techIntro")}
          </p>
          {/* Liste badges : légère mise en avant sans alourdir */}
          <ul className="list-disc pl-6 mb-8 space-y-2 text-base">
            <li>
              <Badge variant="secondary" className="mr-2">Next.js</Badge> + <Badge variant="secondary" className="mr-2">React</Badge> + <Badge variant="secondary" className="mr-2">TypeScript</Badge> : {t("howBuilt.tech1Desc")}
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Tailwind CSS</Badge> + <Badge variant="secondary" className="mr-2">shadcn/ui</Badge> : {t("howBuilt.tech2Desc")}
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Supabase</Badge> : {t("howBuilt.tech3Desc")}
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Vercel</Badge> : {t("howBuilt.tech4Desc")}
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">GitHub Actions</Badge> + <Badge variant="secondary" className="mr-2">Python</Badge> : {t("howBuilt.tech5Desc")}
            </li>
            <li>
              {t("howBuilt.tech6Prefix")} <Badge variant="secondary" className="mr-2">xAI / Grok</Badge> {t("howBuilt.tech6Mid")} <Badge variant="secondary" className="mr-2">Claude Code</Badge> {t("howBuilt.tech6Suffix")}
            </li>
          </ul>
        </section>

        {/* Section 4 : Sources (liste textuelle complète, liens directs) */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">{t("sources.heading")}</h2>
          <p className="text-base leading-relaxed mb-6">
            {t("sources.intro")}
          </p>
          {/* Liste simple : liens prioritaires en gras */}
          <ul className="list-disc pl-6 space-y-4 text-base">
            <li>
              <Link href="https://data.assemblee-nationale.fr/" className="text-primary hover:underline font-medium">
                {t("sources.source1Label")}
              </Link> — {t("sources.source1Desc")}
            </li>
            <li>
              <Link href="https://www.assemblee-nationale.fr/" className="text-primary hover:underline font-medium">
                {t("sources.source2Label")}
              </Link> — {t("sources.source2Desc")}
            </li>
            <li>
              <Link href="https://www.senat.fr/" className="text-primary hover:underline font-medium">
                {t("sources.source3Label")}
              </Link> — {t("sources.source3Desc")}
            </li>
            <li>
              <Link href="https://data.senat.fr/" className="text-primary hover:underline font-medium">
                {t("sources.source4Label")}
              </Link> — {t("sources.source4Desc")} <Badge variant="outline" className="ml-2 text-xs">{t("sources.source4Soon")}</Badge>
            </li>
            <li>
              <Link href="https://www.legifrance.gouv.fr/" className="text-primary hover:underline font-medium">
                {t("sources.source5Label")}
              </Link> — {t("sources.source5Desc")}
            </li>
            <li>
              <Link href="https://www.assemblee-nationale.fr/dyn/taux-application-lois" className="text-primary hover:underline font-medium">
                {t("sources.source6Label")}
              </Link> — {t("sources.source6Desc")}
            </li>
            <li>
              <Link href="https://www.conseil-constitutionnel.fr/" className="text-primary hover:underline font-medium">
                {t("sources.source7Label")}
              </Link> — {t("sources.source7Desc")} <Badge variant="outline" className="ml-2 text-xs">{t("sources.source7Soon")}</Badge>
            </li>
          </ul>
        </section>

        {/* Section 5 : Feedback & Contribution (boutons directs) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t("feedback.heading")}</h2>
          <p className="text-base leading-relaxed mb-6">
            {t("feedback.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Button variant="default" asChild>
              <a href="mailto:loiclair.fr@gmail.com">{t("feedback.contactBtn")}</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://github.com/Xelanidog/LoiClair/issues">{t("feedback.githubBtn")}</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("feedback.license")} —{" "}
            <Link href="https://github.com/Xelanidog/LoiClair" className="text-primary hover:underline">
              {t("feedback.sourceCode")}
            </Link>
          </p>
        </section>

        {/* Bouton retour : Centré, espacé */}
        <div className="text-center mt-16">
          <Button variant="outline" asChild>
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
  )
}
