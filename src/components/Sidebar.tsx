// src/components/Sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LucideIcon } from "lucide-react"

function SidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  return (
    <Link href={href}>
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

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-72">
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-5 pb-6">
          <Link href="/" className="font-bold text-xl tracking-tight">
            LoiClair
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Lois claires, République accessible
          </p>
        </div>

        <nav className="px-3 py-6 space-y-7">
          <SidebarSection icon={BarChart3} title="Tableau de bord">
            <SidebarLink href="/KPIs" label="Indicateurs clés" />
            <SidebarLink href="/Composition" label="Composition" />
            <SidebarLink href="/dossiers-legislatifs" label="Dossiers législatifs" />
          </SidebarSection>

          <SidebarSection icon={Building2} title="Organes législatifs">
            <SidebarLink href="/processus-legislatif" label="Processus législatif" />
            <SidebarLink href="/type-textes" label="Les types de texte" />
            <SidebarLink href="/organes/assemblee" label="L'Assemblée nationale" />
            <SidebarLink href="/organes/senat" label="Le Sénat" />
            <SidebarLink href="/organes/gouvernement" label="Gouvernement & Président" />
            <SidebarLink href="/organes/conseil-constitutionnel" label="Conseil constitutionnel" />
          </SidebarSection>
        </nav>
      </ScrollArea>
    </aside>
  )
}
