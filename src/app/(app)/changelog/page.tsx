import fs from 'fs/promises'
import path from 'path'
import ChangelogAccordion, { type ChangelogSection } from '@/components/ChangelogAccordion'
import { getLocale, getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('changelog')
  return {
    title: `${t('pageTitle')} — LoiClair`,
    description: t('pageDescription'),
  }
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
  const locale = await getLocale()
  const t = await getTranslations('changelog')

  const filename = locale === 'en' ? 'CHANGELOG-en.md' : 'CHANGELOG.md'
  const content = await fs.readFile(
    path.join(process.cwd(), filename),
    'utf-8'
  )
  const sections = parseChangelog(content)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>
      <ChangelogAccordion sections={sections} />
    </div>
  )
}
