// src/app/processus-legislatif/page.tsx
// Page pédagogique sur le processus législatif en France
// Utilise Shadcn pour les composants (Accordion, Card)

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProcessusLegislatif() {
  return (
    // Conteneur principal : largeur raisonnable + centrage automatique
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">Le Processus Législatif en France</h1>
        <p className="text-muted-foreground">
          Comprendre comment naissent les lois : des organes impliqués au parcours complet d'un texte législatif.
        </p>
      </div>



      {/* SECTION 2 : Types de textes */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Les Différents Types de Textes Législatifs</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="projet-loi">
              <AccordionTrigger>Projet de Loi</AccordionTrigger>
              <AccordionContent>
                <p>Initié par le Gouvernement. Exemples : budgets (PLF), réformes sociales. Il suit la procédure législative complète.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="proposition-loi">
              <AccordionTrigger>Proposition de Loi</AccordionTrigger>
              <AccordionContent>
                <p>Initiée par un parlementaire (député ou sénateur). Souvent sur des sujets spécifiques, comme des lois locales ou thématiques.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="proposition-loi-organique">
              <AccordionTrigger>Proposition de Loi Organique</AccordionTrigger>
              <AccordionContent>
                <p>Variante très spécifique visant à modifier ou compléter les lois organiques (textes qui précisent l'application de la Constitution).</p>
                <p className="mt-3 text-sm font-medium">Procédure renforcée :</p>
                <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                  <li>Majorité absolue dans chaque assemblée (289 voix à l'Assemblée, 174 au Sénat)</li>
                  <li>Sénat a un pouvoir égal (pas de dernier mot exclusif)</li>
                  <li>Contrôle obligatoire du Conseil Constitutionnel</li>
                  <li>Délai de 15 jours avant examen en séance</li>
                </ul>
                <p className="mt-3 text-sm">Exemples : règlement des assemblées, statut des parlementaires.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rapport">
              <AccordionTrigger>Rapport</AccordionTrigger>
              <AccordionContent>
                <p>Document d'analyse produit par une commission parlementaire ou un rapporteur.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="resolution">
              <AccordionTrigger>Résolution</AccordionTrigger>
              <AccordionContent>
                <p>Texte non contraignant exprimant une position (ex : résolution européenne).</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="autres">
              <AccordionTrigger>Autres (Avis, Étude d'Impact...)</AccordionTrigger>
              <AccordionContent>
                <p>- Avis : Opinion d'une commission<br />
                - Étude d'Impact : Analyse des effets<br />
                - Accord International : Ratification de traités</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      
    </div>
  );
}