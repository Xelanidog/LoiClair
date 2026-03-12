"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function LandingMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header
      className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b"
      style={{ WebkitBackdropFilter: "blur(12px)", top: 0 }}
    >
      <Link href="/" className="font-bold text-xl tracking-tight">
        LoiClair
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-6">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <nav className="flex flex-col gap-4 pt-6">
            <Link href="/about" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              À propos
            </Link>
            <Link href="/documentation/guide" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Documentation
            </Link>
            <Link href="/dossiers-legislatifs" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Dossiers
            </Link>
            <Link href="/Month" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              Fil d&apos;actu
            </Link>
            <div className="border-t pt-4 mt-2">
              <Link href="/KPIs" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-full gap-1.5">
                  Tableau de bord
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
