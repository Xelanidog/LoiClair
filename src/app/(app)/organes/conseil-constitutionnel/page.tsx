// src/app/(app)/organes/conseil-constitutionnel/page.tsx
// Page pédagogique statique — Conseil constitutionnel

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Conseil constitutionnel — LoiClair",
  description:
    "Rôle, composition et missions du Conseil constitutionnel, gardien de la Constitution française et des droits fondamentaux.",
}

export default function ConseilConstitutionnelPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6" style={{ maxWidth: '64rem' }}>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-bold mb-3"
          style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)", lineHeight: 1.25 }}
        >
          Conseil constitutionnel
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Le Conseil constitutionnel veille à la conformité des lois avec la
          Constitution. Il est le garant des droits et libertés fondamentales.
        </p>
      </div>

      <div className="space-y-6">
        {/* Composition */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}>
              Composition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Le Conseil constitutionnel est composé de{" "}
              <strong>9 membres nommés pour 9 ans</strong>, avec un mandat non
              renouvelable. Le Conseil est renouvelé par tiers tous les
              3 ans : les mandats étant décalés, 3 sièges arrivent à
              échéance tous les 3 ans, et chaque autorité nomme alors un
              nouveau membre pour 9 ans.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(128, 128, 128, 0.3)' }}>
              <li>
                <strong>3 membres</strong> nommés par le Président de la
                République
              </li>
              <li>
                <strong>3 membres</strong> nommés par le président de
                l'Assemblée nationale
              </li>
              <li>
                <strong>3 membres</strong> nommés par le président du Sénat
              </li>
            </ul>
            <p className="text-muted-foreground">
              Les anciens présidents de la République en sont membres de droit
              à vie (article 56 de la Constitution).
            </p>
          </CardContent>
        </Card>

        {/* Missions */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}>
              Missions principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span
                  className="text-primary font-bold shrink-0"
                  style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                >
                  01
                </span>
                <div>
                  <p className="font-medium text-sm">
                    Contrôle de constitutionnalité des lois
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Avant la promulgation d'une loi (contrôle a priori) ou
                    après, à la demande d'un justiciable via la QPC (contrôle a
                    posteriori).
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span
                  className="text-primary font-bold shrink-0"
                  style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                >
                  02
                </span>
                <div>
                  <p className="font-medium text-sm">
                    Contrôle des élections
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Il surveille la régularité des élections présidentielles,
                    législatives et sénatoriales, ainsi que des référendums,
                    et proclame les résultats officiels.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span
                  className="text-primary font-bold shrink-0"
                  style={{ fontSize: "1.1rem", lineHeight: 1.5 }}
                >
                  03
                </span>
                <div>
                  <p className="font-medium text-sm">
                    Consultation — Article 16
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Il est obligatoirement consulté lorsque le Président de la
                    République souhaite mettre en œuvre l'article 16, qui lui
                    confère des pouvoirs exceptionnels en cas de crise grave.
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* QPC */}
        <Card style={{ backgroundColor: 'oklch(0.55 0.28 320 / 0.05)', borderColor: 'oklch(0.55 0.28 320 / 0.3)' }}>
          <CardHeader>
            <CardTitle style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}>
              La Question Prioritaire de Constitutionnalité (QPC)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed space-y-3">
            <p>
              Depuis la réforme constitutionnelle de{" "}
              <strong>2008</strong>, tout justiciable peut saisir le Conseil
              constitutionnel d'une{" "}
              <strong>
                Question Prioritaire de Constitutionnalité (QPC)
              </strong>{" "}
              s'il estime qu'une disposition législative porte atteinte aux
              droits et libertés que la Constitution garantit.
            </p>
            <p className="text-muted-foreground">
              La QPC a ouvert le contrôle de constitutionnalité à tous les
              citoyens — plus seulement aux parlementaires ou au chef de l'État.
              C'est un outil essentiel de protection des libertés individuelles.
            </p>
          </CardContent>
        </Card>

        {/* Lien vers le processus législatif */}
        <div className="pt-2">
          <Link
            href="/processus-legislatif"
            className="text-sm font-medium hover:underline"
            style={{ color: 'oklch(0.55 0.28 320)' }}
          >
            En savoir plus sur le processus législatif →
          </Link>
        </div>
      </div>
    </div>
  )
}
