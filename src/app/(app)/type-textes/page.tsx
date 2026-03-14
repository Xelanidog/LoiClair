// src/app/(app)/type-textes/page.tsx
// Page pédagogique sur les types de textes législatifs en France
// Utilise Shadcn pour les composants (Accordion, Card)

import { getTranslations } from "next-intl/server"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function TypeTextes() {
  const t = await getTranslations("textTypes")

  return (
    // Conteneur principal : largeur raisonnable + centrage automatique
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-3">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageDesc")}
        </p>
      </div>

      {/* Types de textes */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>{t("pageTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="projet-loi">
              <AccordionTrigger>{t("projetLoi.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("projetLoi.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="proposition-loi">
              <AccordionTrigger>{t("propositionLoi.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("propositionLoi.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="proposition-loi-organique">
              <AccordionTrigger>{t("propositionLoiOrganique.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("propositionLoiOrganique.content")}</p>
                <p className="mt-3 text-sm font-medium">{t("propositionLoiOrganique.reinforcedLabel")}</p>
                <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                  <li>{t("propositionLoiOrganique.reinforced1")}</li>
                  <li>{t("propositionLoiOrganique.reinforced2")}</li>
                  <li>{t("propositionLoiOrganique.reinforced3")}</li>
                  <li>{t("propositionLoiOrganique.reinforced4")}</li>
                </ul>
                <p className="mt-3 text-sm">{t("propositionLoiOrganique.examples")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rapport">
              <AccordionTrigger>{t("rapport.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("rapport.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="resolution">
              <AccordionTrigger>{t("resolution.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("resolution.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="autres">
              <AccordionTrigger>{t("autres.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>
                  - {t("autres.avis")}<br />
                  - {t("autres.etudeImpact")}<br />
                  - {t("autres.accordInternational")}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
