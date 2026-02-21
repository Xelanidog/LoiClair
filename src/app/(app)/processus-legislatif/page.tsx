// src/app/processus-legislatif/page.tsx
// Page pédagogique sur le processus législatif en France
// Utilise Shadcn pour les composants (Accordion, Card)

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProcessusLegislatif() {
  return (
    // Conteneur principal : largeur raisonnable + centrage automatique
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Titre principal de la page */}
      <h1 className="text-3xl font-bold mb-8 text-center">
        Le Processus Législatif en France
      </h1>

      {/* Introduction courte */}
      <p className="text-lg text-muted-foreground mb-12 text-center">
        Comprendre comment naissent les lois : des organes impliqués au parcours complet d'un texte législatif.
      </p>

      {/* SECTION 1 : Les principaux organes */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Les Principaux Organes et Leurs Rôles</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assemblee">
              <AccordionTrigger>Assemblée Nationale</AccordionTrigger>
              <AccordionContent>
                <p>L'Assemblée Nationale est la chambre basse du Parlement, composée de 577 députés élus au suffrage universel direct pour 5 ans. Son rôle principal est de voter les lois, contrôler le Gouvernement et débattre des politiques publiques. Elle a le dernier mot en cas de désaccord avec le Sénat sur la plupart des lois.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="senat">
              <AccordionTrigger>Sénat</AccordionTrigger>
              <AccordionContent>
                <p>Le Sénat est la chambre haute, avec 348 sénateurs élus au suffrage indirect pour 6 ans. Il représente les territoires (régions, départements). Il examine les lois après l'Assemblée, propose des amendements, et assure un équilibre entre les intérêts nationaux et locaux. Il ne peut pas être dissous.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gouvernement">
              <AccordionTrigger>Gouvernement</AccordionTrigger>
              <AccordionContent>
                <p>Dirigé par le Premier Ministre, le Gouvernement initie la majorité des projets de loi (environ 90%). Il exécute les lois, gère l'administration, et peut engager sa responsabilité sur un texte (article 49-3). Il est responsable devant l'Assemblée Nationale.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="president">
              <AccordionTrigger>Président de la République</AccordionTrigger>
              <AccordionContent>
                <p>Le Président promulgue les lois adoptées par le Parlement. Il peut demander une seconde délibération ou saisir le Conseil Constitutionnel. Il nomme le Premier Ministre et peut dissoudre l'Assemblée Nationale.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conseil-constitutionnel">
              <AccordionTrigger>Conseil Constitutionnel</AccordionTrigger>
              <AccordionContent>
                <p>Composé de 9 membres, il vérifie la constitutionnalité des lois avant promulgation (saisi par le Président, Premier Ministre, présidents des assemblées ou 60 parlementaires). Il protège les droits fondamentaux et l'équilibre des pouvoirs.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>


      {/* SECTION 3 : Timeline verticale - centrée sur la page */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold text-center">
            Le parcours d'une loi
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Conteneur de la timeline : centré et limité pour que tout reste aligné */}
          <div className="relative max-w-3xl mx-auto">


            {/* Les étapes : centrées autour de la ligne */}
            <div className="space-y-16 relative">
              {[
                {
                  number: 1,
                  title: "Dépôt",
                  description: "Initiative gouvernementale ou parlementaire",
                  details: "Le texte est déposé soit par le Gouvernement (projet), soit par un parlementaire (proposition)."
                },
                {
                  number: 2,
                  title: "Commission",
                  description: "Analyse approfondie et amendements",
                  details: "Étude détaillée, auditions, rapporteur nommé, modifications proposées."
                },
                {
                  number: 3,
                  title: "Séance publique",
                  description: "Débat et vote en hémicycle",
                  details: "Discussion article par article, puis vote sur l'ensemble."
                },
                {
                  number: 4,
                  title: "Navette & CMP",
                  description: "Harmonisation entre Assemblée et Sénat",
                  details: "Allers-retours ou compromis en Commission Mixte Paritaire."
                },
                {
                  number: 5,
                  title: "Vote final",
                  description: "Dernier mot à l'Assemblée",
                  details: "L'Assemblée tranche définitivement (sauf cas particuliers)."
                },
                {
                  number: 6,
                  title: "Contrôle constitutionnel",
                  description: "Optionnel – Conseil constitutionnel",
                  details: "Vérification de conformité à la Constitution."
                },
                {
                  number: 7,
                  title: "Promulgation",
                  description: "Signature et publication",
                  details: "Le Président signe et publie au Journal Officiel."
                },
              ].map((step) => (
                <div key={step.number} className="relative flex gap-6 md:gap-10 justify-center">
                  {/* À gauche : "Étape X" + nom court */}
                  <div className="flex-shrink-0 w-32 md:w-40 text-right pt-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Étape {step.number}
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
            Durée moyenne : 6 à 12 mois • Procédures accélérées possibles (article 49-3, urgence…)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}