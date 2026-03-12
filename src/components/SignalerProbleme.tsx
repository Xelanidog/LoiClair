"use client"

import { useState } from "react"
import {
  MessageSquare,
  Loader2,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
} from "lucide-react"
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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

type Category = "probleme" | "idee"

const TYPES_PROBLEME = [
  { value: "donnee-incorrecte", label: "Donnée incorrecte" },
  { value: "affichage", label: "Problème d'affichage" },
  { value: "lien-casse", label: "Lien cassé" },
  { value: "ia", label: "Résumé IA incorrect" },
  { value: "autre-probleme", label: "Autre" },
] as const

const TYPES_IDEE = [
  { value: "nouvelle-fonctionnalite", label: "Nouvelle fonctionnalité" },
  { value: "amelioration", label: "Amélioration existante" },
  { value: "autre-idee", label: "Autre idée" },
] as const

const CATEGORY_CONFIG = {
  probleme: {
    title: "Signaler un problème",
    description: "Aidez-nous à améliorer LoiClair en signalant une erreur ou un dysfonctionnement.",
    typeLabel: "Type de problème",
    typePlaceholder: "Sélectionner un type...",
    descriptionPlaceholder: "Décrivez le problème rencontré...",
    types: TYPES_PROBLEME,
    successMessage: "Merci pour votre signalement !",
    successDetail: "Votre signalement a été enregistré. Vous pouvez suivre son traitement :",
    githubLabel: "Voir le signalement sur GitHub",
  },
  idee: {
    title: "Proposer une idée",
    description: "Une fonctionnalité qui vous manque ? Une amélioration à suggérer ? Dites-nous tout !",
    typeLabel: "Type d'idée",
    typePlaceholder: "Sélectionner un type...",
    descriptionPlaceholder: "Décrivez votre idée...",
    types: TYPES_IDEE,
    successMessage: "Merci pour votre suggestion !",
    successDetail: "Votre idée a été enregistrée. Vous pouvez suivre son évolution :",
    githubLabel: "Voir la suggestion sur GitHub",
  },
} as const

type FormState = "idle" | "submitting" | "success" | "error"

export default function SignalerProbleme() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [formState, setFormState] = useState<FormState>("idle")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [issueUrl, setIssueUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

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
        setErrorMessage(data.error || "Une erreur est survenue.")
        setFormState("error")
        return
      }

      setIssueUrl(data.issueUrl)
      setFormState("success")
    } catch {
      setErrorMessage(
        "Impossible de contacter le serveur. Réessayez plus tard."
      )
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
      {/* Bouton flottant — div fixe + bouton animé séparés pour Safari */}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 30 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:opacity-80 cursor-pointer"
              aria-label="Une idée ? Un problème ?"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Une idée ? Un problème ?</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            Proposer une idée ou signaler un problème
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Modale */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" style={{ maxWidth: "28rem" }}>
          {/* Étape 1 : choix de la catégorie */}
          {!category && formState !== "success" && (
            <>
              <DialogHeader>
                <DialogTitle>Comment pouvons-nous vous aider ?</DialogTitle>
                <DialogDescription>
                  Choisissez ce que vous souhaitez nous partager.
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
                    <p className="font-medium">Signaler un problème</p>
                    <p className="text-sm text-muted-foreground">
                      Erreur, bug, donnée incorrecte…
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
                    <p className="font-medium">Proposer une idée</p>
                    <p className="text-sm text-muted-foreground">
                      Nouvelle fonctionnalité, amélioration…
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
                    aria-label="Retour"
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
                      {config.types.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
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
                    Email{" "}
                    <span className="text-muted-foreground font-normal">
                      (optionnel)
                    </span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Pour vous recontacter si besoin"
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
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer
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
