"use client"

import { usePathname } from "next/navigation"
import TopNav from "@/components/TopNav"
import Sidebar from "@/components/Sidebar"
import { useNavCategories, getActiveSubLinks } from "@/lib/navigation"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const categories = useNavCategories()
  const subLinks = getActiveSubLinks(categories, pathname)

  return (
    <>
      <TopNav />
      <div
        style={{
          minHeight: "100vh",
          paddingTop: "3.5rem",
          position: "relative",
        }}
      >
        {/* Subtle warm background tint — opacity controls intensity */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "var(--muted)",
          opacity: 0.3,
          pointerEvents: "none",
        }} />
        <div
          style={{
            display: "flex",
            maxWidth: "64rem",
            margin: "0 auto",
            position: "relative",
          }}
        >
          {subLinks && (
            <aside
              className="max-lg:hidden flex"
              style={{
                flexShrink: 0,
                position: "sticky",
                top: "3.5rem",
                height: "calc(100vh - 3.5rem)",
                overflowY: "auto",
              }}
            >
              <Sidebar subLinks={subLinks} />
            </aside>
          )}
          <main style={{ flex: 1, minWidth: 0 }} data-has-sidebar={subLinks ? "" : undefined}>
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
