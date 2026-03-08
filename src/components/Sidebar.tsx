// src/components/Sidebar.tsx
"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import {
  Calendar,
  BarChart3,
  Users,
  ScrollText,
  BookOpen,
  BookMarked,
  ClipboardList,
  ShieldCheck,
  GitBranch,
  Layers,
  Landmark,
  Building,
  Flag,
  Scale,
  Github,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

function SidebarLink({ href, label, icon: Icon, onNavigation }: NavItem & { onNavigation?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onNavigation}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
        isActive
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      <span>{label}</span>
      {isActive && <span className="ml-auto text-primary text-[10px] leading-none tracking-[0.1em]" aria-hidden>||||||||||</span>}
    </Link>
  )
}

function SidebarSection({ label, items, onNavigation }: { label: string; items: NavItem[]; onNavigation?: () => void }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarLink key={item.href} {...item} onNavigation={onNavigation} />
        ))}
      </div>
    </div>
  )
}

function CollapsibleSection({ label, items, onNavigation }: { label: string; items: NavItem[]; onNavigation?: () => void }) {
  const pathname = usePathname()
  const hasActiveChild = items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  const [open, setOpen] = useState(hasActiveChild)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  // Hauteur initiale sans animation (avant le premier paint)
  useLayoutEffect(() => {
    if (contentRef.current && open) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Hauteur animée lors des toggles suivants
  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? contentRef.current.scrollHeight : 0)
    }
  }, [open])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 pb-2 group cursor-pointer"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
          {label}
        </p>
        <ChevronRight
          className={cn(
            "h-3 w-3 text-muted-foreground/40 transition-transform duration-200 group-hover:text-muted-foreground",
            open && "rotate-90"
          )}
        />
      </button>

      <div style={{ height, overflow: "hidden", transition: "height 220ms ease" }}>
        <div ref={contentRef}>
          <div className="space-y-0.5 pb-0.5">
            {items.map((item) => (
              <SidebarLink key={item.href} {...item} onNavigation={onNavigation} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const dashboardItems: NavItem[] = [
  { href: "/Month", label: "Fil du mois", icon: Calendar },
  { href: "/KPIs", label: "Indicateurs clés", icon: BarChart3 },
  { href: "/Composition", label: "Composition", icon: Users },
  { href: "/dossiers-legislatifs", label: "Tous les textes", icon: ScrollText },
]

const organeItems: NavItem[] = [
  { href: "/processus-legislatif", label: "Processus législatif", icon: GitBranch },
  { href: "/type-textes", label: "Types de texte", icon: Layers },
  { href: "/organes/assemblee", label: "Assemblée nationale", icon: Landmark },
  { href: "/organes/senat", label: "Sénat", icon: Building },
  { href: "/organes/gouvernement", label: "Gouvernement", icon: Flag },
  { href: "/organes/conseil-constitutionnel", label: "Conseil constitutionnel", icon: Scale },
]

const docItems: NavItem[] = [
  { href: "/documentation/guide", label: "Guide d'utilisation", icon: BookOpen },
  { href: "/documentation/glossaire", label: "Glossaire", icon: BookMarked },
  { href: "/documentation/methode", label: "Méthodologie", icon: ClipboardList },
  { href: "/documentation/conformite-ia", label: "Conformité AI Act", icon: ShieldCheck },
]

export function SidebarNavContent({ onNavigation }: { onNavigation?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" onClick={onNavigation}>
          <span className="font-bold text-lg tracking-tight">LoiClair</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1.5">
          Lois claires, République accessible
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-4 space-y-6">
        <SidebarSection label="Tableau de bord" items={dashboardItems} onNavigation={onNavigation} />
        <CollapsibleSection label="Organes législatifs" items={organeItems} onNavigation={onNavigation} />
        <CollapsibleSection label="Documentation" items={docItems} onNavigation={onNavigation} />
      </nav>

      {/* Bottom card */}
      <div className="px-4 pb-5">
        <a
          href="https://github.com/Xelanidog/LoiClair/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-muted p-4 hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Github className="h-4 w-4 text-background" />
            </div>
            <p className="text-sm font-medium">Contribuer</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Signaler un bug ou proposer une amélioration sur GitHub.
          </p>
        </a>
      </div>
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72">
      <ScrollArea className="h-full">
        <SidebarNavContent />
      </ScrollArea>
    </aside>
  )
}
