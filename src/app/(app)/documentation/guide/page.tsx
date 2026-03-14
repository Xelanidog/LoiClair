import fs from 'fs/promises'
import path from 'path'
import { getLocale, getTranslations } from 'next-intl/server'
import MarkdownContent from '@/components/MarkdownContent'

export default async function GuidePage() {
  const locale = await getLocale()
  const t = await getTranslations('docs')

  let content: string
  try {
    content = await fs.readFile(
      path.join(process.cwd(), `src/content/${locale}/guide.md`),
      'utf-8'
    )
  } catch {
    content = await fs.readFile(
      path.join(process.cwd(), 'src/content/fr/guide.md'),
      'utf-8'
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-3">{t('guideTitle')}</h1>
        <p className="text-muted-foreground">
          {t('guideDesc')}
        </p>
      </div>
      <MarkdownContent content={content} />
    </div>
  )
}
