"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "100dvh" }}>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-lg"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3.5 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Erreur 404 — Page introuvable
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.12]">
          Cette page n&apos;existe pas <span className="text-primary">dans nos archives.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          Le lien est peut-être invalide, ou la page a été déplacée.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed italic" style={{ opacity: 0.6 }}>
          Elle a probablement été renvoyée en commission.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed" style={{ opacity: 0.7 }}>
          Retrouvez les dossiers législatifs, le fil d&apos;actualité et les indicateurs clés
          sur LoiClair.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button size="lg" className="rounded-full gap-2 hover:scale-105">
              <Home className="h-4 w-4" />
              Accueil
            </Button>
          </Link>
          <Link href="/dossiers-legislatifs">
            <Button variant="ghost" size="lg" className="rounded-full gap-2 text-primary hover:text-primary">
              Voir les dossiers
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
