// src/components/Sidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation"

import {
  BarChart3,
  FileText,
  Building2,
  Info,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Sidebar() {
  const pathname = usePathname()

  // Fonction qui dit si on est sur la page actuelle (pour surligner)
  const isActive = (path: string) => pathname === path

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-50                  // Fixe à gauche + pleine hauteur écran
        w-72 border-r bg-background/95 backdrop-blur 
        supports-[backdrop-filter]:bg-background/60
      "
    >
      {/* Zone scrollable = TOUT SAUF la partie À propos en bas */}
      <ScrollArea className="h-[calc(100vh-180px)]">  {/* 180px = hauteur approx. de la zone À propos */}
        
        {/* Logo + slogan */}
        <div className="p-5 pb-6">
          <Link href="/" className="font-bold text-xl tracking-tight">
            LoiClair
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Lois claires, République accessible
          </p>
        </div>

        {/* Navigation principale (les sections qui scrollent) */}
        <nav className="px-3 py-6 space-y-7">
          {/* ── 1. TABLEAU DE BORD ── */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tableau de bord
              </span>
            </div>
            <div className="space-y-0.5 pl-5">
              <Link href="/dashboard/indicateurs">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/dashboard/indicateurs") && "bg-accent text-accent-foreground"
                  )}
                >
                  Indicateurs clés
                </Button>
              </Link>
              <Link href="/dashboard/cette-semaine">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/dashboard/cette-semaine") && "bg-accent text-accent-foreground"
                  )}
                >
                  Cette semaine
                </Button>
              </Link>

            </div>
          </div>

          {/* ── 2. LES TEXTES ── */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Les textes
              </span>
            </div>
            <div className="space-y-0.5 pl-5">

                <Link href="/dossiers-en-cours">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/loi-propose") && "bg-accent text-accent-foreground"
                  )}
                >
                  Lois proposées
                </Button>
              </Link>

              <Link href="/lois-promulguees">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/lois-promulguees") && "bg-accent text-accent-foreground"
                  )}
                >
                  Lois promulguées
                </Button>
              </Link>

                            <Link href="/dossiers-legislatifs">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/dossiers-legislatifs") && "bg-accent text-accent-foreground"
                  )}
                >
                  Dossiers législatifs
                </Button>
              </Link>
              
            </div>
          </div>

          {/* ── 3. ORGANES LÉGISLATIFS ── */}
          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Organes législatifs
              </span>
            </div>
            <div className="space-y-0.5 pl-5">
                            <Link href="/processus-legislatif">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/processus-legislatif") && "bg-accent text-accent-foreground"
                  )}
                >
                  Processus législatif
                </Button>
              </Link>
              <Link href="/type-textes">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/type-textes") && "bg-accent text-accent-foreground"
                  )}
                >
                  Les types de texte
                </Button>
              </Link>
              <Link href="/organes/assemblee">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/organes/assemblee") && "bg-accent text-accent-foreground"
                  )}
                >
                  L'Assemblée nationale
                </Button>
              </Link>
              <Link href="/organes/senat">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/organes/senat") && "bg-accent text-accent-foreground"
                  )}
                >
                  Le Sénat
                </Button>
              </Link>
              <Link href="/organes/gouvernement">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/organes/gouvernement") && "bg-accent text-accent-foreground"
                  )}
                >
                  Gouvernement & Président
                </Button>
              </Link>
              <Link href="/organes/conseil-constitutionnel">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs h-8 px-4",
                    isActive("/organes/conseil-constitutionnel") && "bg-accent text-accent-foreground"
                  )}
                >
                  Conseil constitutionnel
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* ──────────────────────────────────────────────── */}
      {/* SECTION À PROPOS – FIXÉE TOUT EN BAS DE L'ÉCRAN */}
      {/* ──────────────────────────────────────────────── */}
      <div
        className="
          absolute bottom-0 left-0 right-0          // Collé en bas de l'écran
          bg-background/95 backdrop-blur-sm
          p-4 z-10                                  // Toujours au-dessus du reste
        "
      >


        <div className="space-y-0.5 pl-5">
          <Link href="/about">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-xs h-8 px-4",
                isActive("/sources") && "bg-accent text-accent-foreground"
              )}
            >
              A propos
            </Button>
          </Link>

          
        </div>
      </div>
    </aside>
  )
}