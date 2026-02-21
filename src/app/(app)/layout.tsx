import Link from "next/link"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/Sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 flex-shrink-0 bg-background border-r">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
      <footer className="border-t py-5 text-center text-xs text-muted-foreground bg-muted/40">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Link href="/about">
            <Button variant="ghost" className="text-xs">À propos de LoiClair</Button>
          </Link>
          <span>Données publiques officielles • © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}