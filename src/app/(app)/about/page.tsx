// src/app/a-propos/page.tsx

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

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">À propos de LoiClair</h1>
        </div>

        {/* Section 1 : Le constat */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">
            Pourquoi si peu de participation aux décisions du pays ?
          </h2>

          <div className="rounded-2xl border divide-y md:divide-y-0 md:divide-x md:grid md:grid-cols-3 overflow-hidden mb-8">
            <div className="p-8 space-y-2">
              <p className="text-5xl font-black text-primary tabular-nums">54%</p>
              <p className="text-sm font-medium leading-snug">d&apos;abstention aux législatives 2022</p>
              <p className="text-xs text-muted-foreground">Source : Ministère de l&apos;Intérieur</p>
            </div>
            <div className="p-8 space-y-2">
              <p className="text-5xl font-black text-primary tabular-nums">74%</p>
              <p className="text-sm font-medium leading-snug">des Français estiment les politiques corrompus</p>
              <p className="text-xs text-muted-foreground">Source : CEVIPOF 2025</p>
            </div>
            <div className="p-8 space-y-2">
              <p className="text-5xl font-black text-primary tabular-nums">16%</p>
              <p className="text-sm font-medium leading-snug">des inscrits n&apos;ont voté à aucun tour</p>
              <p className="text-xs text-muted-foreground">Source : Analyse post-électorale 2022</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">Dispersion des sources</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Assemblée, Sénat, Légifrance, JO… tout est éparpillé, introuvable pour le citoyen ordinaire.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">Langage très technique</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Écrit pour des juristes, pas pour le citoyen moyen. Comprendre devient un effort.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 space-y-3">
              <p className="font-semibold">Volume écrasant</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Des dizaines de textes votés chaque mois. Impossible de tout suivre, on finit par abandonner.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 : Qu'est-ce que LoiClair ? (texte direct) */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">Qu'est-ce que LoiClair ?</h2>
          <p className="text-base leading-relaxed mb-6">
            LoiClair est un site web qui rend le droit et la politique française vraiment accessibles à tous. Nous permettons à chacun de traduire et simplifier les textes de loi, amendements, débats parlementaires et processus institutionnels en explications simples, concrètes et imagées, grâce a l'intelligence artificielle. Nous produisons aussi des statistiques directement depuis les données officielles des institutions.
          </p>
          <p className="text-base leading-relaxed">
            Notre but : répondre aux vraies questions des citoyens (« Mais en vrai qui décide ? », « Est-ce que ça va changer ma vie ? ») en expliquant les étapes réelles (souvent très différentes de la théorie), les acteurs impliqués et les impacts quotidiens.
          </p>
        </section>

        {/* Section 3 : Construction technique (texte direct, badges pour tech) */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">Comment le site a été construit</h2>
          <p className="text-base leading-relaxed mb-4">
          LoiClair est un projet independant rendu possible grâce à l'utilisation <strong> de l’IA</strong> : depuis l’écriture du code jusqu’à l'analyse et la mise en forme des données brutes, en passant par les résumés intelligents des textes de loi et des débats parlementaires.
          </p>
          <p className="text-base leading-relaxed mb-6">
            Technologies utilisées :
          </p>
          {/* Liste badges : légère mise en avant sans alourdir */}
          <ul className="list-disc pl-6 mb-8 space-y-2 text-base">
            <li>
              <Badge variant="secondary" className="mr-2">Next.js</Badge> + <Badge variant="secondary" className="mr-2">React</Badge> + <Badge variant="secondary" className="mr-2">TypeScript</Badge> : interface moderne et rapide
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Tailwind CSS</Badge> + <Badge variant="secondary" className="mr-2">shadcn/ui</Badge> : design minimaliste, 100% responsive (desktop → mobile)
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Supabase</Badge> : base de données PostgreSQL hébergée pour stocker toutes les données législatives
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Vercel</Badge> : hébergement et déploiement automatique à chaque mise à jour du code
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">GitHub Actions</Badge> + <Badge variant="secondary" className="mr-2">Python</Badge> : import quotidien automatique des données depuis les sources officielles
            </li>
            <li>
              IA avancée : <Badge variant="secondary" className="mr-2">xAI / Grok</Badge> pour les résumés de lois, <Badge variant="secondary" className="mr-2">Claude Code</Badge> pour le développement
            </li>
          </ul>
        </section>

        {/* Section 4 : Sources (liste textuelle complète, liens directs) */}
        <section className="pb-12 mb-12 border-b">
          <h2 className="text-2xl font-semibold mb-6">Nos Sources Officielles</h2>
          <p className="text-base leading-relaxed mb-6">
            Toutes les infos viennent directement des institutions, sans modification ni interprétation partisane. Mise à jour automatique via API/open data.
          </p>
          {/* Liste simple : liens prioritaires en gras */}
          <ul className="list-disc pl-6 space-y-4 text-base">
            <li>
              <Link href="https://data.assemblee-nationale.fr/" className="text-primary hover:underline font-medium">
                Open Data Assemblée nationale
              </Link> — Dossiers législatifs, députés, amendements, scrutins, comptes rendus
            </li>
            <li>
              <Link href="https://www.assemblee-nationale.fr/" className="text-primary hover:underline font-medium">
                Assemblée nationale
              </Link> — Textes et documents officiels
            </li>
            <li>
              <Link href="https://www.senat.fr/" className="text-primary hover:underline font-medium">
                Sénat
              </Link> — Textes et documents officiels
            </li>
            <li>
              <Link href="https://data.senat.fr/" className="text-primary hover:underline font-medium">
                Open Data Sénat
              </Link> — Questions, scrutins, sénateurs <Badge variant="outline" className="ml-2 text-xs">Bientôt</Badge>
            </li>
            <li>
              <Link href="https://www.legifrance.gouv.fr/" className="text-primary hover:underline font-medium">
                Légifrance
              </Link> — Textes intégraux des lois, versions consolidées des codes, décrets d&apos;application (via API PISTE / DILA)
            </li>
            <li>
              <Link href="https://www.assemblee-nationale.fr/dyn/taux-application-lois" className="text-primary hover:underline font-medium">
                Baromètre de l&apos;application des lois
              </Link> — Suivi de l&apos;application des lois promulguées : taux d&apos;application, mesures attendues, décrets publiés (Assemblée nationale)
            </li>
            <li>
              <Link href="https://www.conseil-constitutionnel.fr/" className="text-primary hover:underline font-medium">
                Conseil constitutionnel
              </Link> — Contrôle des lois, décisions <Badge variant="outline" className="ml-2 text-xs">Bientôt</Badge>
            </li>
          </ul>
        </section>

        {/* Section 5 : Feedback & Contribution (boutons directs) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Donnez votre feedback et contribuez !</h2>
          <p className="text-base leading-relaxed mb-6">
            LoiClair vit grâce à vous. Feedback, idées de fonctionnalités, lois à vulgariser en priorité, signalement d'erreurs — toute contribution est la bienvenue, technique ou non.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Button variant="default" asChild>
              <a href="mailto:loiclair.fr@gmail.com">Contactez l'équipe LoiClair</a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://github.com/Xelanidog/LoiClair/issues">Contribuer au code sur GitHub</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Projet open source sous licence AGPL v3 —{" "}
            <Link href="https://github.com/Xelanidog/LoiClair" className="text-primary hover:underline">
              Code source sur GitHub
            </Link>
          </p>
        </section>

        {/* Bouton retour : Centré, espacé */}
        <div className="text-center mt-16">
          <Button variant="outline" asChild>
            <Link href="/">← Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
  )
}