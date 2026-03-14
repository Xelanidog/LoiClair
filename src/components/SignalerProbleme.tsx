"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Category = "probleme" | "idee"
type FormState = "idle" | "submitting" | "success" | "error"

export default function SignalerProbleme() {
  const t = useTranslations("signaler")
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [formState, setFormState] = useState<FormState>("idle")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [issueUrl, setIssueUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("open-signaler", handler)
    return () => window.removeEventListener("open-signaler", handler)
  }, [])

  const TYPES_PROBLEME = [
    { value: "donnee-incorrecte", label: t("typeIncorrectData") },
    { value: "affichage", label: t("typeDisplay") },
    { value: "lien-casse", label: t("typeBrokenLink") },
    { value: "ia", label: t("typeAI") },
    { value: "autre-probleme", label: t("typeOtherProblem") },
  ]

  const TYPES_IDEE = [
    { value: "nouvelle-fonctionnalite", label: t("typeNewFeature") },
    { value: "amelioration", label: t("typeImprovement") },
    { value: "autre-idee", label: t("typeOtherIdea") },
  ]

  const CATEGORY_CONFIG = {
    probleme: {
      title: t("problemTitle"),
      description: t("problemDesc"),
      typeLabel: t("problemTypeLabel"),
      typePlaceholder: t("typePlaceholder"),
      descriptionPlaceholder: t("problemDescPlaceholder"),
      types: TYPES_PROBLEME,
      successMessage: t("problemSuccess"),
      successDetail: t("problemSuccessDetail"),
      githubLabel: t("problemGithubLabel"),
    },
    idee: {
      title: t("ideaTitle"),
      description: t("ideaDesc"),
      typeLabel: t("ideaTypeLabel"),
      typePlaceholder: t("typePlaceholder"),
      descriptionPlaceholder: t("ideaDescPlaceholder"),
      types: TYPES_IDEE,
      successMessage: t("ideaSuccess"),
      successDetail: t("ideaSuccessDetail"),
      githubLabel: t("ideaGithubLabel"),
    },
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return
    setFormState("submitting")

    try {
      const res = await fetch("/api/signaler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          type,
          description,
          email: email || undefined,
          pageUrl: window.location.href,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || t("errorGeneric"))
        setFormState("error")
        return
      }

      setIssueUrl(data.issueUrl)
      setFormState("success")
    } catch {
      setErrorMessage(t("errorServer"))
      setFormState("error")
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setCategory(null)
        setFormState("idle")
        setType("")
        setDescription("")
        setEmail("")
        setIssueUrl("")
        setErrorMessage("")
      }, 300)
    }
  }

  function handleBack() {
    setCategory(null)
    setType("")
    setDescription("")
    setFormState("idle")
    setErrorMessage("")
  }

  const config = category ? CATEGORY_CONFIG[category] : null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" style={{ maxWidth: "28rem" }}>
          {/* Étape 1 : choix de la catégorie */}
          {!category && formState !== "success" && (
            <>
              <DialogHeader>
                <DialogTitle>{t("chooseTitle")}</DialogTitle>
                <DialogDescription>
                  {t("chooseDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <button
                  onClick={() => setCategory("probleme")}
                  className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted cursor-pointer"
                >
                  <div className="rounded-full bg-destructive/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">{t("reportProblem")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("reportProblemDesc")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setCategory("idee")}
                  className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted cursor-pointer"
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t("suggestIdea")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("suggestIdeaDesc")}
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Étape 2 : formulaire */}
          {category && formState !== "success" && config && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="rounded-md p-1 hover:bg-muted transition-colors cursor-pointer"
                    aria-label={t("back")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  {config.title}
                </DialogTitle>
                <DialogDescription>
                  {config.description}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type-select">{config.typeLabel}</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type-select" className="w-full">
                      <SelectValue placeholder={config.typePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {config.types.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("descriptionLabel")}</Label>
                  <Textarea
                    id="description"
                    placeholder={config.descriptionPlaceholder}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {description.length}/1000
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t("emailLabel")}{" "}
                    <span className="text-muted-foreground font-normal">
                      {t("emailOptional")}
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {formState === "error" && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                )}

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      formState === "submitting" ||
                      !type ||
                      !description.trim()
                    }
                    className="w-full sm:w-auto"
                  >
                    {formState === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("sending")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t("send")}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* Étape 3 : confirmation */}
          {formState === "success" && config && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-[#27AE60]/10 p-3 dark:bg-[#27AE60]/20">
                <CheckCircle2 className="h-6 w-6 text-[#27AE60] dark:text-[#2ECC71]" />
              </div>
              <div>
                <p className="font-medium">{config.successMessage}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {config.successDetail}
                </p>
              </div>
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {config.githubLabel}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
