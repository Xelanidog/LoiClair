import fs from 'fs/promises'
import path from 'path'
import MethodeTabs from '@/components/MethodeTabs'
import type { MethoSection } from '@/components/MethodeTabs'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseSections(markdown: string): MethoSection[] {
  const lines = markdown.split('\n')
  const sections: MethoSection[] = []
  let currentLabel = ''
  let currentLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLabel) {
        sections.push({
          id: slugify(currentLabel),
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
      id: slugify(currentLabel),
      label: currentLabel,
      content: currentLines.join('\n').trim(),
    })
  }

  return sections
}

export default async function MethodePage() {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'src/content/methode.md'),
    'utf-8'
  )
  const sections = parseSections(raw)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Méthodologie</h1>
      <p className="text-muted-foreground text-center mb-10">
        Comment sont calculés les indicateurs, d&apos;où viennent les données et quelles sont leurs limites.
      </p>
      <MethodeTabs sections={sections} />
    </div>
  )
}
