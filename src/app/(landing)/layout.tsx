import TopNav from "@/components/TopNav"
import Footer from "@/components/Footer"
import SignalerProbleme from "@/components/SignalerProbleme"

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav />
      <main style={{ flex: 1, paddingTop: "3.5rem", paddingBottom: "8rem" }}>
        {children}
      </main>
      <Footer />
      <SignalerProbleme />
    </div>
  )
}
