import { Clock } from "lucide-react"

async function getLastSuccessfulRun(): Promise<string | null> {
  try {
    const headers: HeadersInit = { "Accept": "application/vnd.github+json" }
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const res = await fetch(
      "https://api.github.com/repos/Xelanidog/LoiClair/actions/workflows/update-data.yml/runs?status=success&per_page=1",
      { headers, next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.workflow_runs?.[0]?.updated_at ?? null
  } catch {
    return null
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris"
  })
}

export async function LastUpdateBadge({ className }: { className?: string }) {
  const updatedAt = await getLastSuccessfulRun()
  if (!updatedAt) return null

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className ?? ""}`}>
      <Clock className="h-3 w-3 flex-shrink-0" />
      Dernière mise à jour des données le {formatDate(updatedAt)}
    </span>
  )
}
