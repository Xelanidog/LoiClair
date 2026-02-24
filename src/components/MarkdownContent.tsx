"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="
      [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-8
      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:mt-8
      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6
      [&_p]:mb-4 [&_p]:leading-7 [&_p]:text-foreground/90
      [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
      [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
      [&_li]:leading-7
      [&_strong]:font-semibold
      [&_em]:italic [&_em]:text-muted-foreground
      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
      [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
      [&_hr]:border-border [&_hr]:my-6
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>{content}</ReactMarkdown>
    </div>
  )
}
