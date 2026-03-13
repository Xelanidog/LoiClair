"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import LocaleToggle from "@/components/LocaleToggle"

export default function LandingMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("nav")
  const tc = useTranslations("common")

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header
      className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b"
      style={{ WebkitBackdropFilter: "blur(12px)", top: 0 }}
    >
      <Link href="/" className="font-bold text-xl tracking-tight">
        {tc("appName")}
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={tc("openMenu")}>
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-6">
          <SheetTitle className="sr-only">{tc("navMenu")}</SheetTitle>
          <nav className="flex flex-col gap-4 pt-6">
            <Link href="/about" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              {t("about")}
            </Link>
            <Link href="/documentation/guide" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              {t("documentation")}
            </Link>
            <Link href="/dossiers-legislatifs" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              {t("dossiers")}
            </Link>
            <Link href="/Month" className="text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              {t("newsFeedShort")}
            </Link>
            <div className="border-t pt-4 mt-2 space-y-4">
              <Link href="/KPIs" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-full gap-1.5">
                  {t("dashboard")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <div className="flex justify-center">
                <LocaleToggle />
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
