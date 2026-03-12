import fs from 'fs/promises'
import path from 'path'
import ChangelogAccordion, { type ChangelogSection } from '@/components/ChangelogAccordion'

export const metadata = {
  title: 'Notes de version — LoiClair',
  description: 'Historique des évolutions de LoiClair, le tableau de bord citoyen de l\'activité législative française.',
}

function parseChangelog(markdown: string): ChangelogSection[] {
  const lines = markdown.split('\n')
  const sections: ChangelogSection[] = []
  let currentLabel = ''
  let currentLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLabel) {
        sections.push({
          id: currentLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          label: currentLabel,
          content: currentLines.join('\n').trim(),
        })
      }
      currentLabel = line.slice(3).trim()
      currentLines = []
    } else {
      if (currentLabel) currentLines.push(line)
    }
  }

  if (currentLabel) {
    sections.push({
      id: currentLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      label: currentLabel,
      content: currentLines.join('\n').trim(),
    })
  }

  return sections
}

export default async function ChangelogPage() {
  const content = await fs.readFile(
    path.join(process.cwd(), 'CHANGELOG.md'),
    'utf-8'
  )
  const sections = parseChangelog(content)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">Notes de version</h1>
        <p className="text-muted-foreground">
          Toutes les évolutions de LoiClair, expliquées simplement.
        </p>
      </div>
      <ChangelogAccordion sections={sections} />
    </div>
  )
}
