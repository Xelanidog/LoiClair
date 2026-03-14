import { useTranslations } from "next-intl"

export interface SubLink {
  href: string
  label: string
}

export interface NavCategory {
  key: string
  label: string
  href: string
  prefixes: string[]
  subLinks?: SubLink[]
}

/**
 * Returns all navigation categories with translated labels.
 * Must be called from a client component (uses useTranslations hook).
 */
export function useNavCategories(): NavCategory[] {
  const t = useTranslations("nav")

  return [
    {
      key: "newsfeed",
      label: t("newsFeedShort"),
      href: "/Month",
      prefixes: ["/Month"],
    },
    {
      key: "dashboard",
      label: t("dashboard"),
      href: "/KPIs",
      prefixes: ["/KPIs", "/Composition"],
      subLinks: [
        { href: "/KPIs", label: t("keyIndicators") },
        { href: "/Composition", label: t("composition") },
      ],
    },
    {
      key: "textes",
      label: t("textes"),
      href: "/dossiers-legislatifs",
      prefixes: ["/dossiers-legislatifs"],
    },
    {
      key: "organes",
      label: t("legislativeBodies"),
      href: "/processus-legislatif",
      prefixes: ["/processus-legislatif", "/type-textes", "/organes"],
      subLinks: [
        { href: "/processus-legislatif", label: t("legislativeProcess") },
        { href: "/type-textes", label: t("textTypes") },
        { href: "/organes/assemblee", label: t("nationalAssembly") },
        { href: "/organes/senat", label: t("senate") },
        { href: "/organes/gouvernement", label: t("government") },
        { href: "/organes/conseil-constitutionnel", label: t("constitutionalCouncil") },
      ],
    },
    {
      key: "documentation",
      label: t("documentation"),
      href: "/documentation/guide",
      prefixes: ["/documentation", "/changelog"],
      subLinks: [
        { href: "/documentation/guide", label: t("userGuide") },
        { href: "/documentation/glossaire", label: t("glossary") },
        { href: "/documentation/methode", label: t("methodology") },
        { href: "/documentation/conformite-ia", label: t("aiCompliance") },
        { href: "/changelog", label: "Changelog" },
      ],
    },
    {
      key: "about",
      label: t("about"),
      href: "/about",
      prefixes: ["/about"],
    },
  ]
}

/** Paths that should never show the sidebar (full-width pages) */
const NO_SIDEBAR_PATTERNS = [/\/resume-ia/]

export function getActiveSubLinks(categories: NavCategory[], pathname: string): SubLink[] | undefined {
  if (NO_SIDEBAR_PATTERNS.some((re) => re.test(pathname))) return undefined
  for (const cat of categories) {
    if (cat.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return cat.subLinks
    }
  }
  return undefined
}
