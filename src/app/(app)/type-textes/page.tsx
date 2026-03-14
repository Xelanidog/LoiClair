// src/app/(app)/type-textes/page.tsx
// Page pédagogique sur les types de textes législatifs en France

import { getTranslations } from "next-intl/server"
import { Landmark, Building2 } from "lucide-react"

export default async function TypeTextes() {
  const t = await getTranslations("textTypes")

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-3">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageDesc")}
        </p>
      </div>

      {/* Textes parlementaires */}
      <section className="mb-10">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          <Landmark className="h-3.5 w-3.5" />
          {t("sectionParlementaire")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{t("sectionParlementaireDesc")}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("propositionLoi.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("propositionLoi.content")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("propositionLoiOrganique.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("propositionLoiOrganique.content")}</p>
            <p className="mt-2 text-sm font-medium">{t("propositionLoiOrganique.reinforcedLabel")}</p>
            <ul className="list-disc pl-5 text-sm mt-1 space-y-1 text-muted-foreground">
              <li>{t("propositionLoiOrganique.reinforced1")}</li>
              <li>{t("propositionLoiOrganique.reinforced2")}</li>
              <li>{t("propositionLoiOrganique.reinforced3")}</li>
              <li>{t("propositionLoiOrganique.reinforced4")}</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">{t("propositionLoiOrganique.examples")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("amendement.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("amendement.content")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("rapport.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("rapport.content")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("resolution.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("resolution.content")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("autres.trigger")}</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>– {t("autres.avis")}</li>
              <li>– {t("autres.etudeImpact")}</li>
              <li>– {t("autres.accordInternational")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Textes gouvernementaux */}
      <section className="mb-8">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          <Building2 className="h-3.5 w-3.5" />
          {t("sectionGouvernemental")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{t("sectionGouvernementalDesc")}</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("projetLoi.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("projetLoi.content")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("ordonnance.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("ordonnance.content")}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold mb-1">{t("decret.trigger")}</h3>
            <p className="text-sm text-muted-foreground">{t("decret.content")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
