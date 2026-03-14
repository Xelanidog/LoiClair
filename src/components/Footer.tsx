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
          <LocaleToggle />
        </div>
      </div>
    </footer>
  )
}
