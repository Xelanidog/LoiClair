import fs from 'fs/promises'
import path from 'path'
import MarkdownContent from '@/components/MarkdownContent'

export default async function GuidePage() {
  const content = await fs.readFile(
    path.join(process.cwd(), 'src/content/guide.md'),
    'utf-8'
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Guide d&apos;utilisation</h1>
      <MarkdownContent content={content} />
    </div>
  )
}
