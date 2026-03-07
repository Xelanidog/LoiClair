import Link from "next/link"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"
import MobileNav from "@/components/MobileNav"
import { LastUpdateBadge } from "@/components/LastUpdateBadge"
import SignalerProbleme from "@/components/SignalerProbleme"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <MobileNav />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:block w-72 flex-shrink-0 bg-background border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-auto bg-muted/30 flex flex-col">
          <div className="flex-1 pt-20 lg:pt-10 px-6 pb-6 md:px-8 md:pb-8 lg:px-10 lg:pb-10">
            {children}
          </div>
          <footer className="border-t py-5 text-center text-xs text-muted-foreground bg-muted/40">
            <div className="mx-auto flex flex-col items-center gap-2">
              <nav className="flex flex-wrap items-center justify-center gap-x-1">
                <Link href="/about">
                  <Button variant="ghost" className="text-xs">{"À propos"}</Button>
                </Link>
                <span className="text-muted-foreground/40">{"\u00B7"}</span>
                <a href="mailto:loiclair.fr@gmail.com">
                  <Button variant="ghost" className="text-xs">Contactez-nous</Button>
                </a>
                <span className="text-muted-foreground/40">{"\u00B7"}</span>
                <Link href="https://github.com/Xelanidog/LoiClair/issues">
                  <Button variant="ghost" className="text-xs">Contribuer sur GitHub</Button>
                </Link>
              </nav>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span>{"Données publiques officielles \u00A9"} {new Date().getFullYear()}</span>
                <span>{"\u2022"}</span>
                <LastUpdateBadge />
              </div>
            </div>
          </footer>
        </main>
      </div>
      <SignalerProbleme />
    </div>
  )
}
