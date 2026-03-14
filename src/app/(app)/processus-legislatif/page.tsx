// src/app/(app)/processus-legislatif/page.tsx
// Page pédagogique sur le processus législatif en France
// Utilise Shadcn pour les composants (Accordion, Card)

import { getTranslations } from "next-intl/server"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProcessusLegislatif() {
  const t = await getTranslations("process")

  const steps = [
    {
      number: 1,
      title: t("parcours.step1Title"),
      description: t("parcours.step1Desc"),
      details: t("parcours.step1Details"),
    },
    {
      number: 2,
      title: t("parcours.step2Title"),
      description: t("parcours.step2Desc"),
      details: t("parcours.step2Details"),
    },
    {
      number: 3,
      title: t("parcours.step3Title"),
      description: t("parcours.step3Desc"),
      details: t("parcours.step3Details"),
    },
    {
      number: 4,
      title: t("parcours.step4Title"),
      description: t("parcours.step4Desc"),
      details: t("parcours.step4Details"),
    },
    {
      number: 5,
      title: t("parcours.step5Title"),
      description: t("parcours.step5Desc"),
      details: t("parcours.step5Details"),
    },
    {
      number: 6,
      title: t("parcours.step6Title"),
      description: t("parcours.step6Desc"),
      details: t("parcours.step6Details"),
    },
    {
      number: 7,
      title: t("parcours.step7Title"),
      description: t("parcours.step7Desc"),
      details: t("parcours.step7Details"),
    },
  ]

  return (
    // Conteneur principal : largeur raisonnable + centrage automatique
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-3">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">
          {t("pageDesc")}
        </p>
      </div>

      {/* SECTION 1 : Les principaux organes */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>{t("organes.heading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assemblee">
              <AccordionTrigger>{t("organes.assemblee.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("organes.assemblee.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="senat">
              <AccordionTrigger>{t("organes.senat.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("organes.senat.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gouvernement">
              <AccordionTrigger>{t("organes.gouvernement.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("organes.gouvernement.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="president">
              <AccordionTrigger>{t("organes.president.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("organes.president.content")}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conseil-constitutionnel">
              <AccordionTrigger>{t("organes.conseil.trigger")}</AccordionTrigger>
              <AccordionContent>
                <p>{t("organes.conseil.content")}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>


      {/* SECTION 3 : Timeline verticale - centrée sur la page */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-center">
            {t("parcours.heading")}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Conteneur de la timeline : centré et limité pour que tout reste aligné */}
          <div className="relative max-w-3xl mx-auto">

            {/* Les étapes : centrées autour de la ligne */}
            <div className="space-y-16 relative">
              {steps.map((step) => (
                <div key={step.number} className="relative flex gap-6 md:gap-10 justify-center">
                  {/* À gauche : "Étape X" + nom court */}
                  <div className="flex-shrink-0 w-32 md:w-40 text-right pt-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      {t("parcours.stepLabel", { number: step.number })}
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {step.title}
                    </div>
                  </div>

                  {/* Cercle avec numéro : centré exactement sur la ligne verticale */}
                  <div className="flex-shrink-0 z-10">
                    <div className="w-10 h-10 rounded-full bg-background border-2 border-foreground flex items-center justify-center shadow-sm">
                      <span className="text-foreground font-semibold text-lg">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Contenu à droite */}
                  <div className="flex-1 pt-2">
                    <h3 className="text-lg font-medium text-foreground">{step.description}</h3>
                    <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note finale */}
          <p className="text-center text-sm text-muted-foreground mt-12">
            {t("parcours.finalNote")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
