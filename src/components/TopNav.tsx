"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, ChevronDown, MessageSquare, Sun, Moon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useNavCategories, type NavCategory } from "@/lib/navigation"

function MobileCategory({ category, onNavigation }: { category: NavCategory; onNavigation: () => void }) {
  const pathname = usePathname()
  const isActive = category.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const [open, setOpen] = useState(isActive)

  // No sub-links — single link
  if (!category.subLinks || category.subLinks.length === 0) {
    return (
      <Link
        href={category.href}
        onClick={onNavigation}
        style={{
          display: "block",
          padding: "0.5rem 0",
          fontSize: "0.9375rem",
          fontWeight: 500,
          color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
          textDecoration: "none",
        }}
      >
        {category.label}
      </Link>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          width: "100%",
          padding: "0.5rem 0",
          fontSize: "0.9375rem",
          fontWeight: 500,
          color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {category.label}
        <ChevronDown
          style={{
            width: "0.875rem",
            height: "0.875rem",
            transition: "transform 200ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            opacity: 0.5,
          }}
        />
      </button>
      {open && (
        <div style={{ paddingLeft: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {category.subLinks.map((link) => {
            const isSubActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigation}
                style={{
                  display: "block",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: "0.375rem",
                  color: isSubActive ? "var(--foreground)" : "var(--muted-foreground)",
                  backgroundColor: isSubActive ? "var(--accent)" : "transparent",
                  fontWeight: isSubActive ? 500 : 400,
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TopNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const t = useTranslations("common")
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const categories = useNavCategories()

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "3.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        backgroundColor: "var(--background)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Logo + Desktop nav links — grouped together */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
            textDecoration: "none",
            marginRight: "0.5rem",
          }}
        >
          {t("appName")}
        </Link>

        <nav
          style={{
            alignItems: "center",
            gap: "0.25rem",
          }}
          className="max-lg:hidden flex"
        >
        {categories.map((cat) => {
          const isActive = cat.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
          return (
            <Link
              key={cat.key}
              href={cat.href}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.875rem",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                textDecoration: "none",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--foreground)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--muted-foreground)"
                }
              }}
            >
              {cat.label}
            </Link>
          )
        })}
        </nav>
      </div>

      {/* Right side — GitHub pill + theme toggle (desktop) */}
      <div
        className="max-lg:hidden flex"
        style={{
          position: "absolute",
          right: "1.5rem",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-signaler"))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.3rem 0.75rem",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--primary-foreground)",
            backgroundColor: "var(--primary)",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
            transition: "opacity 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8" }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
        >
          <MessageSquare style={{ width: "0.875rem", height: "0.875rem" }} />
          {t("feedback")}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = resolvedTheme === "dark" ? "light" : "dark"
            if (document.startViewTransition) {
              document.startViewTransition(() => setTheme(next))
            } else {
              setTheme(next)
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2rem",
            height: "2rem",
            borderRadius: "0.375rem",
            border: "none",
            background: "none",
            color: "var(--muted-foreground)",
            cursor: "pointer",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)" }}
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mounted && (
              <motion.span
                key={resolvedTheme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex" }}
              >
                {resolvedTheme === "dark"
                  ? <Sun style={{ width: "1rem", height: "1rem" }} />
                  : <Moon style={{ width: "1rem", height: "1rem" }} />
                }
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile burger */}
      <div className="lg:hidden" style={{ position: "absolute", right: "1rem" }}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
              <Menu style={{ width: "1.25rem", height: "1.25rem" }} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" style={{ width: "16rem", padding: "1.5rem" }}>
            <SheetTitle className="sr-only">{t("navMenu")}</SheetTitle>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingTop: "1.5rem" }}>
              {categories.map((cat) => (
                <MobileCategory key={cat.key} category={cat} onNavigation={() => setOpen(false)} />
              ))}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    window.dispatchEvent(new Event("open-signaler"))
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.5rem 0",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "var(--primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <MessageSquare style={{ width: "1rem", height: "1rem" }} />
                  {t("feedback")}
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
