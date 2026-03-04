import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles, BarChart2, Search, Vote, BookOpen, MessageSquare, TrendingDown, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LastUpdateBadge } from "@/components/LastUpdateBadge";

const features = [
  { icon: RefreshCw, title: "Données en temps réel", desc: "Mise à jour quotidienne depuis les données officielles de l'Assemblée nationale." },
  { icon: Sparkles, title: "Résumés par l'IA", desc: "Chaque texte législatif traduit en langage courant, sans jargon juridique." },
  { icon: BarChart2, title: "Statistiques parlementaires", desc: "Qui vote quoi, parité, présence en séance — tout en chiffres." },
  { icon: Search, title: "Trouver vos élus", desc: "Retrouvez et contactez votre député, sénateur ou ministre en secondes." },
  { icon: Vote, title: "Votez comme un parlementaire", desc: "Donnez votre avis et comparez vos votes à ceux du Parlement." },
  { icon: Newspaper, title: "Fil d'actualité", desc: "Chaque mois, l'essentiel de l'activité parlementaire résumé en un coup d'œil." },
];

const stats = [
  { stat: "54%", label: "d'abstention", sub: "législatives 2022 (2ᵉ tour)", source: "Ministère de l'Intérieur" },
  { stat: "74%", label: "des Français", sub: "considèrent les politiques corrompus", source: "Baromètre CEVIPOF 2025" },
  { stat: "16%", label: "des inscrits", sub: "n'ont voté à aucun tour en 2022", source: "Analyse post-électorale 2022" },
];

const obstacles = [
  { icon: BookOpen, num: "01", title: "Dispersion des sources", desc: "Assemblée, Sénat, Légifrance, JO… tout est éparpillé, introuvable pour le citoyen ordinaire." },
  { icon: MessageSquare, num: "02", title: "Langage très technique", desc: "Écrit pour des juristes, pas pour le citoyen moyen. Comprendre devient un effort." },
  { icon: TrendingDown, num: "03", title: "Crise de confiance", desc: "Quand on ne comprend rien, on finit par ne plus croire. Et on arrête de voter." },
];

export default async function PourquoiPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">

        {/* Hero */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground bg-muted/40 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Bêta privée — Gratuit · Indépendant · Neutre
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Chaque mois, des lois sont<br />
            votées{" "}
            <span className="text-primary">en votre nom.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            LoiClair traduit l'activité législative française en langage humain.
          </p>
          <div className="flex flex-col items-center gap-3 pt-2">
            <Link href="/Month">
              <Button size="lg" className="rounded-full gap-2 hover:scale-105 hover:shadow-lg transition-all">
                Explorer l&apos;actualité parlementaire
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <LastUpdateBadge />
          </div>
          
        </section>

        {/* Features */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-center">Ce que vous pouvez faire</h2>
          <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-y-0 md:divide-x border rounded-xl overflow-hidden">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 p-6 bg-muted/20 hover:bg-muted/50 transition-colors">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Constat */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-center">Le constat</h2>
          <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
            {stats.map(({ stat, label, sub, source }) => (
              <div key={stat} className="bg-background flex flex-col items-center justify-center text-center p-10 space-y-2">
                <div className="text-6xl md:text-7xl font-black tracking-tighter">{stat}</div>
                <p className="font-semibold text-base">{label}</p>
                <p className="text-muted-foreground text-sm">{sub}</p>
                <p className="text-muted-foreground text-xs opacity-50">{source}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Obstacles — timeline verticale */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-center">Les vrais obstacles</h2>
          <div className="max-w-2xl mx-auto">
            {obstacles.map(({ icon: Icon, num, title, desc }, index) => (
              <div key={num} className="flex gap-6 items-start">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  {index < obstacles.length - 1 && (
                    <div className="w-px flex-1 bg-border my-1 min-h-[40px]" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-10">
                  <p className="text-xs text-muted-foreground mb-1">{num}</p>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="rounded-xl bg-foreground text-background px-10 py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold">Et si on rendait la politique lisible ?</h2>
          <p className="text-sm max-w-md mx-auto opacity-70">
            LoiClair : simplifier, vulgariser, et redonner envie de participer.
          </p>
          <Link href="/dossiers-legislatifs">
            <Button variant="secondary" size="lg" className="rounded-full gap-2 mt-2">
              Voir les dossiers législatifs
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

    </div>
  );
}