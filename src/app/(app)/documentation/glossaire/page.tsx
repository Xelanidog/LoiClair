import { supabase } from '@/lib/supabase'
import { DEFINITIONS } from '@/lib/definitions'

type GlossaireEntry = { term: string; definition: string }
type Category = { label: string; entries: GlossaireEntry[] }

function deduplicate(values: (string | null)[]): string[] {
  return [...new Set(values.filter(Boolean) as string[])].sort()
}

function toEntry(term: string): GlossaireEntry {
  return { term, definition: DEFINITIONS[term] ?? 'Définition à venir.' }
}

export default async function GlossairePage() {
  const [statutsRes, proceduresRes, actesRes, provenanceRes] = await Promise.all([
    supabase.from('dossiers_legislatifs').select('statut_final'),
    supabase.from('dossiers_legislatifs').select('procedure_libelle'),
    supabase.from('actes_legislatifs').select('libelle_acte'),
    supabase.from('textes').select('provenance'),
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
    {
      label: 'Provenance des textes',
      entries: deduplicate(
        (provenanceRes.data ?? []).map(r => r.provenance)
      ).map(toEntry),
    },
  ].filter(c => c.entries.length > 0)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">Glossaire</h1>
        <p className="text-muted-foreground">
          Les termes du vocabulaire législatif utilisés sur LoiClair, expliqués simplement.
        </p>
      </div>

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
