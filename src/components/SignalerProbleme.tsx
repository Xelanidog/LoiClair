"use client"

import { useState } from "react"
import {
  MessageSquareWarning,
  Loader2,
  ExternalLink,
  Send,
  CheckCircle2,
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

const TYPES_PROBLEME = [
  { value: "donnee-incorrecte", label: "Donnée incorrecte" },
  { value: "affichage", label: "Problème d'affichage" },
  { value: "lien-casse", label: "Lien cassé" },
  { value: "ia", label: "Résumé IA incorrect" },
  { value: "autre", label: "Autre" },
] as const

type FormState = "idle" | "submitting" | "success" | "error"

export default function SignalerProbleme() {
  const [open, setOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>("idle")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [issueUrl, setIssueUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormState("submitting")

    try {
      const res = await fetch("/api/signaler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setFormState("idle")
        setType("")
        setDescription("")
        setEmail("")
        setIssueUrl("")
        setErrorMessage("")
      }, 300)
    }
  }

  return (
    <>
      {/* Bouton flottant — div fixe + bouton animé séparés pour Safari */}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 30 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:opacity-80 cursor-pointer"
              aria-label="Signaler un problème"
            >
              <MessageSquareWarning className="h-4 w-4" />
              <span className="hidden sm:inline">Signaler</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            Signaler un problème, une erreur ou un bug à l&apos;équipe LoiClair
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Modale */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" style={{ maxWidth: "28rem" }}>
          <DialogHeader>
            <DialogTitle>Signaler un problème</DialogTitle>
            <DialogDescription>
              Aidez-nous à améliorer LoiClair en signalant une erreur ou un
              dysfonctionnement.
            </DialogDescription>
          </DialogHeader>

          {formState === "success" ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Merci pour votre signalement !</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Votre signalement a été enregistré. Vous pouvez suivre son
                  traitement :
                </p>
              </div>
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Voir le signalement sur GitHub
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type de problème */}
              <div className="space-y-2">
                <Label htmlFor="type-probleme">Type de problème</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type-probleme" className="w-full">
                    <SelectValue placeholder="Sélectionner un type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_PROBLEME.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le problème rencontré..."
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

              {/* Email optionnel */}
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

              {/* Message d'erreur */}
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
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
