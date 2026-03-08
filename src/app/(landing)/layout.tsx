import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Footer from "@/components/Footer"
import SignalerProbleme from "@/components/SignalerProbleme"
import LandingMobileNav from "./LandingMobileNav"

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop header — fixed + max-lg:hidden (Safari-safe: no hidden→flex conflict, no sticky-in-flex bug) */}
      <header
        className="max-lg:hidden flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-8 py-4 bg-background/80 border-b backdrop-blur-md"
        style={{ WebkitBackdropFilter: "blur(12px)", top: 0 }}
      >
        <Link href="/" className="text-lg font-bold tracking-tight">
          LoiClair
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/about">
            <Button variant="ghost" size="sm" className="text-sm">À propos</Button>
          </Link>
          <Link href="/documentation/guide">
            <Button variant="ghost" size="sm" className="text-sm">Documentation</Button>
          </Link>
          <Link href="/Month" className="ml-2">
            <Button size="sm" className="rounded-full gap-1.5 hover:scale-105">
              Tableau de bord
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Mobile header */}
      <LandingMobileNav />

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      <Footer />
      <SignalerProbleme />
    </div>
  )
}
