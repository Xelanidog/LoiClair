import fs from 'fs/promises'
import path from 'path'
import MarkdownContent from '@/components/MarkdownContent'

export default async function GuidePage() {
  const content = await fs.readFile(
    path.join(process.cwd(), 'src/content/guide.md'),
    'utf-8'
  )

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">Guide d&apos;utilisation</h1>
        <p className="text-muted-foreground">
          Comment lire et utiliser les tableaux de bord, indicateurs et dossiers législatifs de LoiClair.
        </p>
      </div>
      <MarkdownContent content={content} />
    </div>
  )
}
