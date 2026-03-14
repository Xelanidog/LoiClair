import fs from 'fs/promises'
import path from 'path'
import { getLocale, getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('changelog')
  return {
    title: `${t('pageTitle')} — LoiClair`,
    description: t('pageDescription'),
  }
}

interface ChangelogEntry {
  version: string
  categories: { label: string; type: string; items: string[] }[]
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  'Ajouté':    { bg: 'rgba(34,197,94,0.15)',  text: 'rgb(34,197,94)' },
  'Added':     { bg: 'rgba(34,197,94,0.15)',  text: 'rgb(34,197,94)' },
  'Modifié':   { bg: 'rgba(59,130,246,0.15)', text: 'rgb(59,130,246)' },
  'Changed':   { bg: 'rgba(59,130,246,0.15)', text: 'rgb(59,130,246)' },
  'Corrigé':   { bg: 'rgba(251,191,36,0.15)', text: 'rgb(251,191,36)' },
  'Fixed':     { bg: 'rgba(251,191,36,0.15)', text: 'rgb(251,191,36)' },
  'Supprimé':  { bg: 'rgba(156,163,175,0.15)', text: 'rgb(156,163,175)' },
  'Removed':   { bg: 'rgba(156,163,175,0.15)', text: 'rgb(156,163,175)' },
}

function parseChangelog(markdown: string): ChangelogEntry[] {
  const lines = markdown.split('\n')
  const entries: ChangelogEntry[] = []
  let currentEntry: ChangelogEntry | null = null
  let currentCategory: { label: string; type: string; items: string[] } | null = null

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentCategory && currentEntry) currentEntry.categories.push(currentCategory)
      if (currentEntry) entries.push(currentEntry)
      currentEntry = { version: line.slice(3).trim(), categories: [] }
      currentCategory = null
    } else if (line.startsWith('### ')) {
      if (currentCategory && currentEntry) currentEntry.categories.push(currentCategory)
      const label = line.slice(4).trim()
      currentCategory = { label, type: label, items: [] }
    } else if (line.startsWith('- ') && currentCategory) {
      currentCategory.items.push(line.slice(2).trim())
    }
  }
  if (currentCategory && currentEntry) currentEntry.categories.push(currentCategory)
  if (currentEntry) entries.push(currentEntry)

  return entries
}

/** Strip markdown bold/links for plain display */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
}

export default async function ChangelogPage() {
  const locale = await getLocale()
  const t = await getTranslations('changelog')

  const filename = locale === 'en' ? 'CHANGELOG-en.md' : 'CHANGELOG.md'
  const content = await fs.readFile(path.join(process.cwd(), filename), 'utf-8')
  const entries = parseChangelog(content)

  return (
    <div style={{ padding: "1.5rem", maxWidth: "48rem" }}>
      <h1 className="text-xl font-bold mb-1">{t('pageTitle')}</h1>
      <p className="text-sm text-muted-foreground mb-10">{t('pageDescription')}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        {entries.map((entry, i) => (
          <article key={i}>
            {/* Week header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "var(--accent)",
                  color: "var(--foreground)",
                }}
              >
                {entry.version}
              </span>
            </div>

            {/* Categories */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {entry.categories.map((cat, j) => {
                const style = CATEGORY_STYLES[cat.label] || CATEGORY_STYLES['Removed']
                return (
                  <div key={j}>
                    {/* Category pill */}
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: style.bg,
                        color: style.text,
                        marginBottom: "0.5rem",
                      }}
                    >
                      {cat.label}
                    </span>

                    {/* Items */}
                    <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {cat.items.map((item, k) => (
                        <li key={k} style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                          {cleanMarkdown(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Separator */}
            {i < entries.length - 1 && (
              <hr style={{ border: "none", borderTop: "1px solid var(--border)", marginTop: "2rem" }} />
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
