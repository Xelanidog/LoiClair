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
        <main className="flex-1 overflow-auto bg-background">
          <div className="pt-20 lg:pt-10 px-6 pb-6 md:px-8 md:pb-8 lg:px-10 lg:pb-10">
            {children}
          </div>
        </main>
      </div>
      <footer className="border-t py-5 text-center text-xs text-muted-foreground bg-muted/40">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Link href="/about">
            <Button variant="ghost" className="text-xs">À propos de LoiClair</Button>
          </Link>
          <span>Données publiques officielles • © {new Date().getFullYear()}</span>
          <span>•</span>
          <LastUpdateBadge />
        </div>
      </footer>
      <SignalerProbleme />
    </div>
  )
}
