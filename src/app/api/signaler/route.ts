import { NextRequest, NextResponse } from "next/server"

// Rate limiter en mémoire (best effort sur serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 heure

const TYPES_PROBLEME = ["donnee-incorrecte", "affichage", "lien-casse", "ia", "autre-probleme"]
const TYPES_IDEE = ["nouvelle-fonctionnalite", "amelioration", "autre-idee"]
const CATEGORIES_VALIDES = ["probleme", "idee"]

const TYPE_LABELS: Record<string, string> = {
  "donnee-incorrecte": "Donnée incorrecte",
  "affichage": "Problème d'affichage",
  "lien-casse": "Lien cassé",
  "ia": "Résumé IA incorrect",
  "autre-probleme": "Autre problème",
  "nouvelle-fonctionnalite": "Nouvelle fonctionnalité",
  "amelioration": "Amélioration existante",
  "autre-idee": "Autre idée",
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return "unknown"
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false

  entry.count++
  return true
}

function sanitize(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 1000)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de signalements. Réessayez dans une heure." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { category, type, description, email, pageUrl } = body

    // Validation
    if (!category || !CATEGORIES_VALIDES.includes(category)) {
      return NextResponse.json(
        { error: "Catégorie invalide." },
        { status: 400 }
      )
    }
    const typesValides = category === "probleme" ? TYPES_PROBLEME : TYPES_IDEE
    if (!type || !typesValides.includes(type)) {
      return NextResponse.json(
        { error: "Type invalide." },
        { status: 400 }
      )
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "La description est requise." },
        { status: 400 }
      )
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide." },
        { status: 400 }
      )
    }

    const descSanitized = sanitize(description.trim())
    const pageUrlSafe =
      typeof pageUrl === "string" ? pageUrl.slice(0, 500) : "Non fournie"
    const now = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    })

    // Création issue GitHub
    const isIdee = category === "idee"
    const tag = isIdee ? "Idée" : "Signalement"
    const pagePath = pageUrlSafe.replace(/https?:\/\/[^/]+/, "") || "/"
    const issueTitle = `[${tag}] ${TYPE_LABELS[type]} — ${pagePath}`
    const issueBody = [
      `## ${tag} utilisateur`,
      "",
      `**Type :** ${TYPE_LABELS[type]}`,
      `**Page :** ${pageUrlSafe}`,
      `**Date :** ${now}`,
      "",
      "### Description",
      descSanitized,
      "",
      "### Contact",
      `Email : ${email || "Non fourni"}`,
      "",
      "---",
      `_${tag} automatique depuis LoiClair._`,
    ].join("\n")

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      console.error("GITHUB_TOKEN manquant")
      return NextResponse.json(
        { error: "Configuration serveur incomplète." },
        { status: 500 }
      )
    }

    const ghRes = await fetch(
      "https://api.github.com/repos/Xelanidog/LoiClair/issues",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: [isIdee ? "idée" : "signalement", type],
        }),
      }
    )

    if (!ghRes.ok) {
      const ghError = await ghRes.text()
      console.error("Erreur GitHub API:", ghRes.status, ghError)
      return NextResponse.json(
        { error: "Impossible de créer le signalement." },
        { status: 502 }
      )
    }

    const ghData = await ghRes.json()

    return NextResponse.json({ issueUrl: ghData.html_url })
  } catch (error) {
    console.error("Erreur /api/signaler:", error)
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    )
  }
}
