import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, ExternalLink, Bot } from 'lucide-react';

export const metadata = {
  title: 'Conformité AI Act — LoiClair',
  description: 'Comment LoiClair se conforme au règlement européen sur l\'intelligence artificielle (AI Act, règlement UE 2024/1689).',
};

const SOURCES = [
  {
    label: 'Texte officiel — Règlement (UE) 2024/1689',
    href: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=OJ:L_202401689',
  },
  {
    label: 'Article 50 — Obligations de transparence (artificialintelligenceact.eu)',
    href: 'https://artificialintelligenceact.eu/article/50/',
  },
  {
    label: 'Commission européenne — Entrée en vigueur de l\'AI Act',
    href: 'https://commission.europa.eu/news-and-media/news/ai-act-enters-force-2024-08-01_en',
  },
  {
    label: 'Obligations des déployeurs — Village Justice',
    href: 'https://www.village-justice.com/articles/act-les-obligations-des-deployeurs-systemes-intelligence-artificielle,50917.html',
  },
  {
    label: 'Résumé de haut niveau de l\'AI Act',
    href: 'https://artificialintelligenceact.eu/high-level-summary/',
  },
];

const TIMELINE = [
  {
    date: 'Août 2024',
    label: 'Entrée en vigueur',
    detail: 'Le règlement UE 2024/1689 est publié au Journal Officiel et entre en vigueur.',
    done: true,
  },
  {
    date: 'Février 2025',
    label: 'Interdiction des risques inacceptables',
    detail: 'Interdiction des systèmes d\'IA présentant un risque inacceptable (manipulation, scoring social, etc.).',
    done: true,
  },
  {
    date: 'Août 2025',
    label: 'Règles sur les modèles d\'IA généraux',
    detail: 'Obligations de transparence et droits d\'auteur pour les fournisseurs de modèles d\'IA à usage général (ex. xAI, OpenAI).',
    done: true,
  },
  {
    date: 'Août 2026',
    label: 'Application complète — Article 50',
    detail: 'Obligations de transparence pleinement applicables aux déployeurs comme LoiClair.',
    done: false,
  },
];

export default function ConformiteIAPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Conformité AI Act</h1>
        </div>
        <p className="text-muted-foreground">
          Le règlement européen sur l&apos;intelligence artificielle (Règlement UE 2024/1689, dit &quot;AI Act&quot;) impose des règles claires
          sur l&apos;usage de l&apos;IA. Cette page explique ce que cette loi implique pour LoiClair et comment nous nous y conformons.
        </p>
      </div>

      {/* Résumé visuel rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4 pb-4 flex flex-col gap-1">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-semibold text-sm mt-1">Déployeur</p>
            <p className="text-xs text-muted-foreground">LoiClair utilise un modèle existant, ne le crée pas.</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4 pb-4 flex flex-col gap-1">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="font-semibold text-sm mt-1">Risque limité</p>
            <p className="text-xs text-muted-foreground">Information neutre, pas d&apos;influence électorale.</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-4 pb-4 flex flex-col gap-1">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <p className="font-semibold text-sm mt-1">Échéance : août 2026</p>
            <p className="text-xs text-muted-foreground">Application complète de l&apos;Article 50.</p>
          </CardContent>
        </Card>
      </div>

      {/* Accordéons */}
      <Accordion type="multiple" defaultValue={['role', 'risque', 'obligations', 'conformite']} className="space-y-3">

        <AccordionItem value="aiact" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Qu&apos;est-ce que l&apos;AI Act ?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
            <p>
              L&apos;AI Act (Règlement UE 2024/1689) est le premier règlement mondial encadrant l&apos;intelligence artificielle.
              Adopté par le Parlement européen, il est entré en vigueur le <strong>1er août 2024</strong> et s&apos;applique
              à toute organisation — européenne ou non — qui déploie ou fournit des systèmes d&apos;IA à des utilisateurs en Europe.
            </p>
            <p>
              Son principe clé : classer les systèmes d&apos;IA par niveau de risque et imposer des obligations proportionnées.
              Plus le risque est élevé, plus les contraintes sont strictes.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="role" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Quel est le rôle de LoiClair ?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
            <p>L&apos;AI Act distingue deux types d&apos;acteurs :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="rounded-lg border p-3">
                <p className="font-semibold text-foreground mb-1">Fournisseur</p>
                <p>Crée, entraîne et commercialise le modèle d&apos;IA. Exemple : <strong>xAI</strong> (qui développe Grok).</p>
              </div>
              <div className="rounded-lg border p-3 border-primary/40 bg-primary/5">
                <p className="font-semibold text-foreground mb-1">Déployeur ← LoiClair</p>
                <p>Utilise un modèle existant dans son propre service, sous sa propre responsabilité.</p>
              </div>
            </div>
            <p className="mt-2">
              LoiClair est un <strong>déployeur</strong> : nous utilisons le modèle Grok (xAI) via une API pour générer des résumés.
              Nous ne l&apos;entraînons pas et n&apos;en sommes pas propriétaires.
              Les obligations de xAI (documentation technique, droits d&apos;auteur sur les données d&apos;entraînement) sont distinctes des nôtres.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="risque" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Quelle catégorie de risque ?
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
            <p>L&apos;AI Act classe les systèmes d&apos;IA en quatre niveaux :</p>
            <div className="space-y-2 mt-2">
              {[
                { level: 'Risque inacceptable', badge: 'Interdit', color: 'destructive', desc: 'Manipulation comportementale, scoring social, reconnaissance faciale en masse. Non applicable à LoiClair.', applicable: false },
                { level: 'Haut risque', badge: 'Obligations lourdes', color: 'outline', desc: 'IA influençant les élections, la justice pénale, l\'emploi. Non applicable : LoiClair informe sans orienter de vote.', applicable: false },
                { level: 'Risque limité', badge: 'Obligations de transparence', color: 'secondary', desc: 'IA générant du texte pour informer le public. C\'est la catégorie de LoiClair.', applicable: true },
                { level: 'Risque minimal', badge: 'Aucune obligation', color: 'secondary', desc: 'Filtres anti-spam, jeux vidéo, etc.', applicable: false },
              ].map(({ level, badge, color, desc, applicable }) => (
                <div key={level} className={`rounded-lg border p-3 flex gap-3 ${applicable ? 'border-primary/40 bg-primary/5' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{level}</span>
                      <Badge variant={color as 'destructive' | 'outline' | 'secondary'}>{badge}</Badge>
                      {applicable && <Badge variant="default" className="text-xs">LoiClair</Badge>}
                    </div>
                    <p className="text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="obligations" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Quelles obligations s&apos;appliquent ? (Article 50)
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
            <p>
              L&apos;<strong>Article 50</strong> de l&apos;AI Act porte sur la transparence. Il s&apos;applique à tout déployeur
              d&apos;un système d&apos;IA qui génère du <strong>texte destiné à informer le public</strong> sur des sujets
              d&apos;intérêt général — ce qui inclut les résumés législatifs de LoiClair.
            </p>
            <div className="space-y-2 mt-2">
              {[
                { title: 'Signalement visible', desc: 'Indiquer clairement à l\'utilisateur que le contenu a été généré par une IA (lisible par un humain).' },
                { title: 'Marquage machine-readable', desc: 'Marquer le contenu généré dans un format détectable par d\'autres systèmes. LoiClair implémente des balises <meta> dans le <head> de chaque page résumé (ai-generated, ai-model, ai-provider).' },
                { title: 'Ne pas induire en erreur', desc: 'Le contenu IA ne doit pas être présenté comme une analyse humaine ou officielle.' },
              ].map(({ title, desc, todo }) => (
                <div key={title} className="flex gap-3 p-3 rounded-lg border">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{title} {todo && <Badge variant="outline" className="text-xs ml-1">À venir (2026)</Badge>}</p>
                    <p className="text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3 p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs">
                Ces obligations deviennent pleinement applicables en <strong>août 2026</strong>.
                LoiClair anticipe ces exigences dès maintenant par bonne pratique.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="conformite" className="border rounded-lg px-4">
          <AccordionTrigger className="text-base font-semibold hover:no-underline">
            Comment LoiClair se conforme
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
            <div className="space-y-2">
              {[
                {
                  title: 'Labellisation visible sur chaque résumé',
                  desc: 'Chaque résumé IA affiche la mention "Contenu généré par intelligence artificielle" avec un lien vers cette page.',
                },
                {
                  title: 'Publication du prompt système',
                  desc: 'Les instructions exactes données à l\'IA (le "prompt") sont publiées sur chaque page de résumé. Tout citoyen peut lire comment l\'IA a été guidée.',
                },
                {
                  title: 'Publication de tous les paramètres techniques',
                  desc: 'Le modèle utilisé, la température, le nombre de tokens maximum et la limite de caractères en entrée sont affichés publiquement et se mettent à jour automatiquement.',
                },
                {
                  title: 'Neutralité explicite dans le prompt',
                  desc: 'Le prompt contient l\'instruction "Sois neutre, accessible et concis." La structure en 3 sections (contexte, changements, impact) est purement descriptive — jamais évaluative.',
                },
                {
                  title: 'Température basse pour fidélité au texte',
                  desc: 'La température du modèle est volontairement basse pour limiter les libertés créatives et rester au plus près du contenu législatif source.',
                },
                {
                  title: 'Source officielle toujours accessible',
                  desc: 'Chaque résumé est accompagné d\'un lien direct vers le texte officiel publié sur les sites institutionnels (Assemblée Nationale, Sénat, Gouvernement).',
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3 p-3 rounded-lg border">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{title}</p>
                    <p className="text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Timeline */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-5">Calendrier de l&apos;AI Act</h2>
        <div className="space-y-0">
          {TIMELINE.map(({ date, label, detail, done }, index) => (
            <div key={date} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1
                  ${done ? 'bg-green-500 border-green-500' : 'bg-background border-primary'}`}>
                  {done && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                {index < TIMELINE.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="pb-7">
                <p className="text-xs text-muted-foreground">{date}</p>
                <p className="font-semibold text-sm">{label} {done && <Badge variant="secondary" className="text-xs ml-1">Effectif</Badge>}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="mt-10 border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">Sources et textes de référence</h2>
        <div className="space-y-2">
          {SOURCES.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
