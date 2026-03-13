import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LastUpdateBadge } from "@/components/LastUpdateBadge"
import { getTranslations } from "next-intl/server"

export default async function Footer() {
  const t = await getTranslations("footer")

  return (
    <footer className="border-t py-5 text-center text-xs text-muted-foreground bg-muted/40">
      <div className="mx-auto flex flex-col items-center gap-2">
        <nav className="flex flex-wrap items-center justify-center gap-x-1">
          <Link href="/about">
            <Button variant="ghost" className="text-xs">{t("about")}</Button>
          </Link>
          <span className="text-muted-foreground/40">&middot;</span>
          <a href="mailto:loiclair.fr@gmail.com">
            <Button variant="ghost" className="text-xs">{t("contactUs")}</Button>
          </a>
          <span className="text-muted-foreground/40">&middot;</span>
          <Link href="https://github.com/Xelanidog/LoiClair/issues">
            <Button variant="ghost" className="text-xs">{t("contributeGithub")}</Button>
          </Link>
          <span className="text-muted-foreground/40">&middot;</span>
          <Link href="/changelog">
            <Button variant="ghost" className="text-xs">{t("releaseNotes")}</Button>
          </Link>
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>{t("publicData")} &copy; {new Date().getFullYear()}</span>
          <span>&bull;</span>
          <LastUpdateBadge />
        </div>
      </div>
    </footer>
  )
}
