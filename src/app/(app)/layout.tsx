import AppShell from "@/components/AppShell"
import Footer from "@/components/Footer"
import SignalerProbleme from "@/components/SignalerProbleme"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>
        <div
          style={{
            flex: 1,
            paddingBottom: "8rem",
          }}
        >
          {children}
        </div>
      </AppShell>
      <Footer />
      <SignalerProbleme />
    </>
  )
}
