"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNavContent } from "@/components/Sidebar"

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("common")

  // Ferme le drawer à chaque changement de route
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-background border-b" style={{ top: 0 }}>
      <Link href="/" className="font-bold text-xl tracking-tight">
        {t("appName")}
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">{t("navMenu")}</SheetTitle>
          <ScrollArea className="h-full">
            <SidebarNavContent onNavigation={() => setOpen(false)} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </header>
  )
}
