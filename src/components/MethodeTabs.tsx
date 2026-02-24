"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import MarkdownContent from '@/components/MarkdownContent'

export interface MethoSection {
  id: string
  label: string
  content: string
}

export default function MethodeTabs({ sections }: { sections: MethoSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash && sections.find(s => s.id === hash)) setActiveId(hash)
  }, [sections])

  const handleChange = (id: string) => {
    setActiveId(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        La méthodologie sera disponible après la prochaine session de développement.
      </p>
    )
  }

  const active = sections.find(s => s.id === activeId) ?? sections[0]

  return (
    <>
      <style>{`
        .methode-select { display: block; }
        .methode-sidebar { display: none; }
        @media (min-width: 768px) {
          .methode-select { display: none; }
          .methode-sidebar { display: block; }
          .methode-layout { flex-direction: row; gap: 2.5rem; }
          .methode-nav { width: 14rem; flex-shrink: 0; align-self: flex-start; }
        }
      `}</style>
      <div className="methode-layout flex flex-col gap-6">
        <nav className="methode-nav">
          {/* Mobile */}
          <select
            value={activeId}
            onChange={e => handleChange(e.target.value)}
            className="methode-select w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          {/* Desktop */}
          <div className="methode-sidebar sticky top-8 space-y-0.5">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => handleChange(s.id)}
                className={cn(
                  "w-full text-left text-sm px-3 py-2 rounded-md transition-colors border-l-2",
                  activeId === s.id
                    ? "border-primary text-foreground font-medium bg-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <MarkdownContent content={active.content} />
        </div>
      </div>
    </>
  )
}
