import Sidebar from "@/components/Sidebar"
import MobileNav from "@/components/MobileNav"
import Footer from "@/components/Footer"
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
          <div className="flex-1 pt-14 md:pt-20 lg:pt-10 px-4 pb-6 md:px-8 md:pb-8 lg:px-10 lg:pb-10">
            {children}
          </div>
          <Footer />
        </main>
      </div>
      <SignalerProbleme />
    </div>
  )
}
