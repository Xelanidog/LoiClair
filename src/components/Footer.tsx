import { LastUpdateBadge } from "@/components/LastUpdateBadge"
import FooterLink from "@/components/FooterLink"
import LocaleToggle from "@/components/LocaleToggle"
import { getTranslations } from "next-intl/server"

export default async function Footer() {
  const t = await getTranslations("footer")

  const columns = [
    {
      title: t("explore"),
      links: [
        { label: t("dossiers"), href: "/dossiers-legislatifs" },
        { label: t("composition"), href: "/Composition" },
        { label: t("legislativeProcess"), href: "/processus-legislatif" },
      ],
    },
    {
      title: t("resources"),
      links: [
        { label: t("methodology"), href: "/documentation/methode" },
        { label: t("guide"), href: "/documentation/guide" },
        { label: t("changelog"), href: "/changelog" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("aiCompliance"), href: "/documentation/conformite-ia" },
        { label: t("about"), href: "/about" },
      ],
    },
    {
      title: t("contact"),
      links: [
        { label: t("email"), href: "mailto:loiclair.fr@gmail.com", external: true },
        { label: t("github"), href: "https://github.com/Xelanidog/LoiClair/issues", external: true },
      ],
    },
  ]

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "2.5rem 1.5rem",
        fontSize: "0.875rem",
        color: "var(--muted-foreground)",
        backgroundColor: "var(--muted)",
      }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        {/* Grid — auto-fill responsive, no media query needed */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "2rem 4rem",
          }}
        >
          {columns.map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--foreground)",
                }}
              >
                {col.title}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink
                      href={link.href}
                      label={link.label}
                      external={(link as { external?: boolean }).external}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "1rem",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
            <span>{t("publicData")} &copy; {new Date().getFullYear()}</span>
            <span>&bull;</span>
            <LastUpdateBadge />
          </div>
          <a
            href="https://github.com/Xelanidog/LoiClair/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.25rem 0.625rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--primary-foreground)",
              backgroundColor: "var(--foreground)",
              borderRadius: "9999px",
              textDecoration: "none",
            }}
          >
            <svg style={{ width: "0.75rem", height: "0.75rem" }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {t("contribute")}
          </a>
          <LocaleToggle />
        </div>
      </div>
    </footer>
  )
}
