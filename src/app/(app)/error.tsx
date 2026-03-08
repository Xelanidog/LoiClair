"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, RefreshCw } from "lucide-react"

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "60vh" }}>
      <div className="space-y-6 max-w-lg">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">Erreur de chargement</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ lineHeight: 1.12 }}>
          Les données n&apos;ont pas<br />
          <span className="text-primary">pu être chargées.</span>
        </h1>

        <p className="text-muted-foreground leading-relaxed">
          Une erreur est survenue lors de la connexion à la base de données.
          Vérifiez votre connexion et réessayez.
        </p>
        <p className="text-sm italic" style={{ opacity: 0.5 }}>
          La base de données est peut-être en commission, elle aussi.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button size="lg" className="rounded-full gap-2 hover:scale-105" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Link href="/">
            <Button variant="ghost" size="lg" className="rounded-full gap-2 text-primary hover:text-primary">
              <Home className="h-4 w-4" />
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
