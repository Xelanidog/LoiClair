"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { SubLink } from "@/lib/navigation"

interface SidebarProps {
  subLinks: SubLink[]
}

export default function Sidebar({ subLinks }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.125rem",
        padding: "1.5rem 2rem 1rem 0.75rem",
        width: "100%",
      }}
    >
      {subLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "block",
              padding: "0.375rem 0.75rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
              color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
              backgroundColor: isActive ? "var(--accent)" : "transparent",
              fontWeight: isActive ? 500 : 400,
              textDecoration: "none",
              transition: "background-color 150ms, color 150ms",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--foreground)"
                e.currentTarget.style.backgroundColor = "var(--accent)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = "var(--muted-foreground)"
                e.currentTarget.style.backgroundColor = "transparent"
              }
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
