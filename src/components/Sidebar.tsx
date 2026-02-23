// src/components/Sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LucideIcon } from "lucide-react"

function SidebarLink({ href, label, onNavigation }: { href: string; label: string; onNavigation?: () => void }) {
  const pathname = usePathname()
  return (
    <Link href={href} onClick={onNavigation}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start text-xs h-8 px-4",
          pathname === href && "bg-accent text-accent-foreground"
        )}
      >
        {label}
      </Button>
    </Link>
  )
}

function SidebarSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-3 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-0.5 pl-5">{children}</div>
    </div>
  )
}

export function SidebarNavContent({ onNavigation }: { onNavigation?: () => void }) {
  return (
    <>
      <div className="p-5 pb-6">
        <Link href="/" onClick={onNavigation} className="font-bold text-xl tracking-tight">
          LoiClair
        </Link>
        <p className="text-xs text-muted-foreground mt-1">
          Lois claires, République accessible
        </p>
      </div>

      <nav className="px-3 py-6 space-y-7">
        <SidebarSection icon={BarChart3} title="Tableau de bord">
          <SidebarLink href="/KPIs" label="Indicateurs clés" onNavigation={onNavigation} />
          <SidebarLink href="/Composition" label="Composition" onNavigation={onNavigation} />
          <SidebarLink href="/dossiers-legislatifs" label="Tous les textes" onNavigation={onNavigation} />
        </SidebarSection>

        <SidebarSection icon={Building2} title="Organes législatifs">
          <SidebarLink href="/processus-legislatif" label="Processus législatif" onNavigation={onNavigation} />
          <SidebarLink href="/type-textes" label="Les types de texte" onNavigation={onNavigation} />
          <SidebarLink href="/organes/assemblee" label="L'Assemblée nationale" onNavigation={onNavigation} />
          <SidebarLink href="/organes/senat" label="Le Sénat" onNavigation={onNavigation} />
          <SidebarLink href="/organes/gouvernement" label="Gouvernement & Président" onNavigation={onNavigation} />
          <SidebarLink href="/organes/conseil-constitutionnel" label="Conseil constitutionnel" onNavigation={onNavigation} />
        </SidebarSection>
      </nav>
    </>
  )
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72">
      <ScrollArea className="h-[calc(100vh-180px)]">
        <SidebarNavContent />
      </ScrollArea>
    </aside>
  )
}
