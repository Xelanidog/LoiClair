// app/pourquoi/page.tsx
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Lightbulb, Users } from "lucide-react";

export default function IntroPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero / Introduction */}
      <section className="pt-16 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Pourquoi LoiClair ?
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            La démocratie française est belle…  
            mais beaucoup trop compliquée à suivre au quotidien.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-5">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full text-base font-medium hover:bg-gray-800 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              Découvrir LoiClair
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <span className="text-gray-500 text-sm">
              Gratuit · Indépendant · Neutre
            </span>
          </div>
        </div>
      </section>

      {/* Notre ambition */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Notre ambition
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-5">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rendre lisible</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Transformer les textes juridiques en langage clair et honnête.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-5">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tableau de bord citoyen</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Devenir la référence visuelle simple et à jour de l’actualité législative.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Encourager la participation</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Quand on comprend, on s’implique. Notre but : plus de citoyens actifs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Le constat – chiffres bien lisibles */}
      <section className="py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Le constat
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-5xl md:text-6xl font-black text-gray-800 mb-3">54%</div>
              <p className="text-base font-medium mb-1 text-gray-800">d’abstention</p>
              <p className="text-sm text-gray-600 mb-1">
                législatives 2022 (2ᵉ tour) – record
              </p>
              <p className="text-xs text-gray-500">
                Ministère de l’Intérieur 2022
              </p>
            </div>

            <div className="text-center bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-5xl md:text-6xl font-black text-gray-800 mb-3">74%</div>
              <p className="text-base font-medium mb-1 text-gray-800">des Français</p>
              <p className="text-sm text-gray-600 mb-1">
                considèrent les politiques corrompus
              </p>
              <p className="text-xs text-gray-500">
                Baromètre CEVIPOF 2025
              </p>
            </div>

            <div className="text-center bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-5xl md:text-6xl font-black text-gray-800 mb-3">16%</div>
              <p className="text-base font-medium mb-1 text-gray-800">des inscrits</p>
              <p className="text-sm text-gray-600 mb-1">
                n’ont voté à aucun tour en 2022
              </p>
              <p className="text-xs text-gray-500">
                Analyse post-électorale 2022
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Les vrais obstacles – TOUS les 3 conservés */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Les vrais obstacles
          </h2>

          <div className="space-y-10">
            <div className="flex gap-6 items-start">
              <div className="text-5xl font-black text-gray-300 flex-shrink-0">01</div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Dispersion des sources</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Assemblée, Sénat, Légifrance, JO… tout est éparpillé.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="text-5xl font-black text-gray-300 flex-shrink-0">02</div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Langage très technique</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Écrit pour des juristes, pas pour le citoyen moyen.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="text-5xl font-black text-gray-300 flex-shrink-0">03</div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Crise de confiance</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Quand on ne comprend rien, on finit par ne plus croire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Et si on rendait la politique lisible ?
          </h2>

          <p className="text-base md:text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
            LoiClair : simplifier, vulgariser, et redonner envie de participer.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 bg-white text-gray-900 rounded-full text-base font-medium hover:bg-gray-100 transition-all duration-300"
          >
            Voir le tableau de bord
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}