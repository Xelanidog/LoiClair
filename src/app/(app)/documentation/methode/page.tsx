import fs from 'fs/promises'
import path from 'path'
import { getLocale, getTranslations } from 'next-intl/server'
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
  const locale = await getLocale()
  const t = await getTranslations('docs')

  let raw: string
  try {
    raw = await fs.readFile(
      path.join(process.cwd(), `src/content/${locale}/methode.md`),
      'utf-8'
    )
  } catch {
    raw = await fs.readFile(
      path.join(process.cwd(), 'src/content/fr/methode.md'),
      'utf-8'
    )
  }

  const sections = parseSections(raw)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">{t('methodeTitle')}</h1>
        <p className="text-muted-foreground">
          {t('methodeDesc')}
        </p>
      </div>
      <MethodeTabs sections={sections} />
    </div>
  )
}
