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

        {/* Section 1 : Qu'est-ce que LoiClair ? (texte direct) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Qu'est-ce que LoiClair ?</h2>
          <p className="text-base leading-relaxed mb-6">
            LoiClair est un site web qui rend le droit et la politique française vraiment accessibles à tous. Nous permettons à chacun de traduire et simplifier les textes de loi, amendements, débats parlementaires et processus institutionnels en explications simples, concrètes et imagées, grâce a l'intelligence artificielle. Nous produisons aussi des statistiques directement depuis les données officielles des institutions.
          </p>
          <p className="text-base leading-relaxed">
            Notre but : répondre aux vraies questions des citoyens (« Mais en vrai qui décide ? », « Est-ce que ça va changer ma vie ? ») en expliquant les étapes réelles (souvent très différentes de la théorie), les acteurs impliqués et les impacts quotidiens.
          </p>
        </section>

        {/* Section 2 : Construction technique (texte direct, badges pour tech) */}
        <section className="mb-12">
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
              <Badge variant="secondary" className="mr-2">Next.js</Badge> + <Badge variant="secondary" className="mr-2">React</Badge> + <Badge variant="secondary" className="mr-2">TypeScript</Badge> : interface moderne et rapide.
            </li>
            <li>
              <Badge variant="secondary" className="mr-2">Shadcn/ui</Badge> + <Badge variant="secondary" className="mr-2">Tailwind CSS</Badge> : design minimaliste, 100% responsive (desktop → mobile)
            </li>
            <li>
              IA avancée : Xai avec prompts optimisés pour les resumés, Claude Code pour le développement.
            </li>
          </ul>
        </section>

        {/* Section 3 : Sources (liste textuelle complète, liens directs) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Nos Sources Officielles</h2>
          <p className="text-base leading-relaxed mb-6">
            Toutes les infos viennent directement des institutions, sans modification ni interprétation partisane. Mise à jour automatique via API/open data.
          </p>
          {/* Liste simple : liens prioritaires en gras */}
          <ul className="list-disc pl-6 space-y-4 text-base">
            <li>
              <Link href="https://www.assemblee-nationale.fr/" className="text-primary hover:underline font-medium">
                Assemblée nationale
              </Link> — Site principal + open data (députés, amendements, votes)
            </li>
            <li>
              <Link href="https://www.senat.fr/" className="text-primary hover:underline font-medium">
                Sénat
              </Link> — Débats, textes, sénateurs
            </li>
            <li>
              <Link href="https://www.conseil-constitutionnel.fr/" className="text-primary hover:underline font-medium">
                Conseil constitutionnel
              </Link> — Contrôle des lois, décisions
            </li>
            <li>
              <Link href="https://www.legifrance.gouv.fr/" className="text-primary hover:underline font-medium">
                Légifrance
              </Link> — Lois promulguées, codes, Journal Officiel
            </li>
            <li>
              <Link href="https://data.assemblee-nationale.fr/" className="text-primary hover:underline">
                Open Data Assemblée
              </Link> — Projets de loi détaillés
            </li>
            <li>
              <Link href="https://data.senat.fr/" className="text-primary hover:underline">
                Open Data Sénat
              </Link> — Questions, scrutins
            </li>
          </ul>
        </section>

        {/* Section 4 : Feedback & Contribution (boutons directs) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Donnez votre feedback et contribuez !</h2>
          <p className="text-base leading-relaxed mb-6">
            LoiClair vit grâce à vous. Dites-nous ce qui manque, ce qui est confus, ou proposez des lois à vulgariser en priorité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Button variant="default" asChild>
              <a href="mailto:loiclair.fr@gmail.com">Envoyer feedback</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:loiclair.fr@gmail.com">Proposer contribution</a>
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