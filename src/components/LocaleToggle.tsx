"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()

  function switchLocale(next: string) {
    if (next === locale) return
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => switchLocale("fr")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          locale === "fr"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          locale === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  )
}
