import { supabase } from '@/lib/supabase'

// Définitions statiques — le terme dynamique est la clé, la définition est la valeur.
const DEFINITIONS: Record<string, string> = {
  // Statuts des dossiers
  'Promulguée': 'Le texte a été signé par le Président de la République et publié au Journal officiel. Il a force de loi.',
  'En cours d\'examen': 'Le texte est encore en discussion au Parlement. Il n\'a pas encore été adopté définitivement.',
  'Adopté par l\'Assemblée nationale': 'L\'Assemblée nationale a voté le texte, mais le Sénat doit encore se prononcer.',
  'Adopté par le Sénat': 'Le Sénat a voté le texte, mais l\'Assemblée nationale doit encore se prononcer.',
  'Adopté par le Parlement': 'Les deux chambres ont voté le texte dans les mêmes termes. Il attend la promulgation.',
  'Rejeté': 'Le texte a été rejeté par l\'une des chambres ou les deux.',
  'Caduque': 'La procédure est arrivée à son terme sans adoption (fin de législature, retrait du gouvernement, etc.).',

  // Procédures
  'Proposition de loi ordinaire': 'Texte déposé par un ou plusieurs parlementaires (député ou sénateur), et non par le gouvernement.',
  'Projet de loi ordinaire': 'Texte préparé et déposé par le gouvernement, soumis ensuite au vote du Parlement.',
  'Projet ou proposition de loi constitutionnelle': 'Texte visant à modifier la Constitution.',
  'Projet ou proposition de loi organique': 'Texte qui précise les modalités d\'application de la Constitution.',
  'Projet de loi de finances': 'Budget annuel de l\'État, voté chaque automne.',
  'Projet de loi de finances rectificative': 'Modification du budget en cours d\'année.',
  'Projet ou proposition de loi de financement de la sécurité sociale': 'Budget annuel de la Sécurité sociale.',
  'Projet de ratification des traités et conventions': 'Autorisation parlementaire pour que le Président ratifie un traité international.',
  'Résolution': 'Texte exprimant une position du Parlement, sans valeur législative contraignante.',
}

type GlossaireEntry = { term: string; definition: string }
type Category = { label: string; entries: GlossaireEntry[] }

function deduplicate(values: (string | null)[]): string[] {
  return [...new Set(values.filter(Boolean) as string[])].sort()
}

function toEntry(term: string): GlossaireEntry {
  return { term, definition: DEFINITIONS[term] ?? 'Définition à venir.' }
}

export default async function GlossairePage() {
  const [statutsRes, proceduresRes, actesRes] = await Promise.all([
    supabase.from('dossiers_legislatifs').select('statut_final'),
    supabase.from('dossiers_legislatifs').select('procedure_libelle'),
    supabase.from('actes_legislatifs').select('libelle_acte'),
  ])

  const categories: Category[] = [
    {
      label: 'Statuts',
      entries: deduplicate(
        (statutsRes.data ?? []).map(r => r.statut_final)
      ).map(toEntry),
    },
    {
      label: 'Types de procédures',
      entries: deduplicate(
        (proceduresRes.data ?? []).map(r => r.procedure_libelle)
      ).map(toEntry),
    },
    {
      label: 'Étapes législatives',
      entries: deduplicate(
        (actesRes.data ?? []).map(r => r.libelle_acte)
      ).map(toEntry),
    },
  ].filter(c => c.entries.length > 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Glossaire</h1>
      <p className="text-lg text-muted-foreground mb-12 text-center">
        Les termes du vocabulaire législatif utilisés sur LoiClair, expliqués simplement.
      </p>

      <div className="space-y-12">
        {categories.map(({ label, entries }) => (
          <section key={label}>
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">{label}</h2>
            <dl className="space-y-4">
              {entries.map(({ term, definition }) => (
                <div key={term}>
                  <dt className="font-medium text-sm">{term}</dt>
                  <dd className="text-sm text-muted-foreground mt-0.5">{definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
