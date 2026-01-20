'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, RotateCcw, X } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Check, Info, Sparkles } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Loader2 } from 'lucide-react'; // Pour le spinner Shadcn


// ──────────────────────────────────────────────────────────────────────────────
// INTERFACE
// ──────────────────────────────────────────────────────────────────────────────
interface Loi {
  numero_dossier: string
  type_texte: string
  titre_texte: string
  auteur: string
  lien_dossier_an?: string
  lien_dossier_senat?: string
  lien_dossier_legifrance?: string
  statut_final: string
  date_depot: string
  date_promulgation?: string
  themes?: string
  chronologie_complete: string
}

// ──────────────────────────────────────────────────────────────────────────────
// COMPOSANT MULTI-SELECT
// ──────────────────────────────────────────────────────────────────────────────
function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
}: {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  label: string
}) {
  const [open, setOpen] = useState(false)

  const truncate = (str: string) => {
    if (str.length <= 28) return str
    return str.slice(0, 25) + '...'
  }

  return (
    <div className="space-y-1 flex-1 min-w-[200px] max-w-[320px]">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 text-left truncate"
          >
            {value.length === 0 ? placeholder : value.length === 1 ? truncate(value[0]) : `${value.length} sélectionnés`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 min-w-[200px]">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    const newValue = value.includes(option)
                      ? value.filter((v) => v !== option)
                      : [...value, option]
                    onChange(newValue)
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary/50', // bordure plus douce
                      value.includes(option)
                        ? 'bg-muted text-muted-foreground border-primary' // ← gris clair + texte gris
                        : 'bg-background opacity-50 border-input'
                    )}
                  >
                    {value.includes(option) && <Check className="h-3 w-3" />}
                  </div>
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ──────────────────────────────────────────────────────────────────────────────
export default function DossiersLegislatifsPage() {
  const [lois, setLois] = useState<Loi[]>([])
  const [loisFiltrees, setLoisFiltrees] = useState<Loi[]>([])
  const [recherche, setRecherche] = useState('')
  const [filtreTypes, setFiltreTypes] = useState<string[]>([])
  const [filtreStatuts, setFiltreStatuts] = useState<string[]>([])
  const [filtreThemes, setFiltreThemes] = useState<string[]>([])
  const [filtrePeriode, setFiltrePeriode] = useState('Tous')
  const [typesUniques, setTypesUniques] = useState<string[]>([])
  const [statutsUniques, setStatutsUniques] = useState<string[]>([])
  const [themesUniques, setThemesUniques] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  // État pour stocker la loi actuellement sélectionnée pour le résumé
  const [selectedLoi, setSelectedLoi] = useState<Loi | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [resumeIA, setResumeIA] = useState<string | null>(null); // Stocke le résumé texte
  const [loadingResume, setLoadingResume] = useState(false); // Pour le spinner
  const [lienOfficiel, setLienOfficiel] = useState<string | null>(null); // Lien texte récent utilisé par IA
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Message erreur API pour panneau

useEffect(() => {
  if (isSheetOpen) {
    const timer = setTimeout(() => {
      const sheet = document.querySelector('[data-state="open"]');
      if (sheet) {
        sheet.style.display = 'none'; // Cache temporairement
        sheet.offsetHeight; // Force reflow
        sheet.style.display = ''; // Réaffiche avec transition
      }
    }, 50);
    return () => clearTimeout(timer);
  }
}, [isSheetOpen]);

useEffect(() => {
  if (isSheetOpen && selectedLoi) {
    setResumeIA(null); // Reset pour nouvelle loi
    setLoadingResume(true);

async function fetchResume() {
  // Reset pour nouvelle loi ; optimisation : évite affichage ancien contenu.
  setResumeIA(null);
  setLienOfficiel(null);
  setErrorMessage(null);

  try {
    const response = await fetch('/api/resume-loi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chronologie_complete: selectedLoi.chronologie_complete,
        titre_texte: selectedLoi.titre_texte,
      }),
    });

    // Plus de throw ici – optimisation : lis toujours le JSON pour gérer errors soft (ex. 400 avec {error: 'msg'})
    const data = await response.json();

    if (data.error) {
      // Si API retourne un error JSON, set le message précis sans throw (UX fluide, pas de console polluée)
      setErrorMessage(data.error); // Ex. : 'Lien erroné ou contenu non encore disponible.'
      return; // Sort du try sans proceed
    }

    // Si OK, extrait resume/lien normalement
    const { resume, lien } = data;
    setResumeIA(resume);
    setLienOfficiel(lien);
  } catch (error) {
    // Catch pour vrais échecs (ex. réseau, JSON invalide) ; optimisation : log muté pour clean console en dev
    // console.error('Erreur fetch résumé:', error); // Commenté pour éviter pollution ; réactive si besoin debug
    setErrorMessage('Désolé, impossible de générer le résumé pour le moment.'); // Fallback générique
  } finally {
    setLoadingResume(false);
  }
}

    fetchResume();

  }
}, [isSheetOpen, selectedLoi]); // Déclenche sur ouverture + sélection loi

  // Chargement CSV
  useEffect(() => {
    async function chargerLois() {
      try {
        const res = await fetch('/data/lois.csv')
        if (!res.ok) throw new Error('CSV introuvable')

        const text = await res.text()

        Papa.parse<Loi>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.filter(loi => loi.numero_dossier)
            data.sort((a, b) => new Date(b.date_depot).getTime() - new Date(a.date_depot).getTime())
            setLois(data)
            setLoisFiltrees(data)

            const types = [...new Set(data.map(l => l.type_texte || 'Inconnu'))].sort()
            setTypesUniques(types)

            const statuts = [...new Set(data.map(l => l.statut_final || 'Inconnu'))].sort()
            setStatutsUniques(statuts)

            const allThemes = data.flatMap(l => (l.themes || '').split(',').map(t => t.trim()).filter(t => t))
            const uniqueThemes = [...new Set(allThemes)].sort()
            setThemesUniques(uniqueThemes)

            setLoading(false)
          },
        })
      } catch (error) {
        console.error('Erreur chargement CSV:', error)
        setLoading(false)
      }
    }
    chargerLois()
  }, [])

  // Filtrage
  useEffect(() => {
    let filtered = lois

    if (recherche.trim()) {
      const q = recherche.toLowerCase().trim()
      filtered = filtered.filter(loi =>
        loi.titre_texte?.toLowerCase().includes(q) ||
        loi.type_texte?.toLowerCase().includes(q)
      )
    }

    if (filtreStatuts.length > 0) {
      filtered = filtered.filter(l => filtreStatuts.includes(l.statut_final || 'Inconnu'))
    }

    if (filtreThemes.length > 0) {
      filtered = filtered.filter(loi => {
        const loiThemes = (loi.themes || '').split(',').map(t => t.trim())
        return filtreThemes.some(t => loiThemes.includes(t))
      })
    }

    if (filtreTypes.length > 0) {
      filtered = filtered.filter(l => filtreTypes.includes(l.type_texte || 'Inconnu'))
    }

    if (filtrePeriode !== 'Tous') {
      const now = Date.now()
      filtered = filtered.filter(loi => {
        if (!loi.date_depot) return false
        const depot = new Date(loi.date_depot).getTime()
        const diffDays = Math.floor((now - depot) / (1000 * 60 * 60 * 24))

        if (filtrePeriode === 'moins6mois') return diffDays <= 180
        if (filtrePeriode === '6a12mois') return diffDays > 180 && diffDays <= 365
        if (filtrePeriode === '1a2ans') return diffDays > 365 && diffDays <= 730
        if (filtrePeriode === 'plus2ans') return diffDays > 730
        return true
      })
    }

    setLoisFiltrees(filtered)
  }, [recherche, filtreTypes, filtreStatuts, filtreThemes, filtrePeriode, lois])

  // Réinitialisation
  const reinitialiser = () => {
    setRecherche('')
    setFiltreTypes([])
    setFiltreStatuts([])
    setFiltreThemes([])
    setFiltrePeriode('Tous')
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UTILITAIRES
  // ──────────────────────────────────────────────────────────────────────────────

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getDuree = (loi: Loi) => {
    if (!loi.date_depot || loi.date_promulgation) return null

    const debut = new Date(loi.date_depot)
    if (isNaN(debut.getTime())) return null

    const jours = Math.floor((Date.now() - debut.getTime()) / (1000 * 60 * 60 * 24))
    return jours >= 0 ? `${jours} jours` : null
  }

  const formatThemes = (themes?: string) => {
    if (!themes) return ''
    return themes
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .join(', ')
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-muted-foreground">Chargement...</div>
  }

  const allSelected = [
    ...filtreStatuts.map(v => ({ type: 'Statut', value: v })),
    ...filtreThemes.map(v => ({ type: 'Thème', value: v })),
    ...filtreTypes.map(v => ({ type: 'Type', value: v })),
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

      {/* En-tête */}
      <div className="pb-12 space-y-16">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Dossiers législatifs</h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Un dossier législatif, c’est le parcours complet d’une proposition ou d’un projet de loi, depuis son dépôt jusqu’à sa promulgation (ou son abandon). On y trouve tous les textes, débats, votes et étapes réelles, pas seulement la théorie.
          </p>

          <p className="text-sm text-muted-foreground">
            Données de la 17ième legislature provenant de {' '}
            <a
              href="https://data.assemblee-nationale.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              data.assemblee-nationale.fr 
            </a>
          </p>
        </div>

        {/* Champ recherche */}
        <Input
          placeholder="Rechercher un titre, auteur, thème..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="h-10 max-w-xl mx-auto block mb-6 mt-14"
        />

        {/* Ligne filtres */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4">
          {/* Pas de sm:flex-nowrap : on laisse wrap sur mobile, et on garde horizontal sur desktop si place */}
          <MultiSelect
            label="Statut actuel"
            options={statutsUniques}
            value={filtreStatuts}
            onChange={setFiltreStatuts}
            placeholder="Tous les statuts"
          />

          <MultiSelect
            label="Thème principal"
            options={themesUniques}
            value={filtreThemes}
            onChange={setFiltreThemes}
            placeholder="Tous les thèmes"
          />

          <MultiSelect
            label="Type de texte"
            options={typesUniques}
            value={filtreTypes}
            onChange={setFiltreTypes}
            placeholder="Tous les types"
          />

          <div className="space-y-1 flex-1 min-w-[200px] max-w-[240px]">
            <div className="text-xs font-medium text-muted-foreground">Période de dépôt</div>
            <Select value={filtrePeriode} onValueChange={setFiltrePeriode}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous">Toutes les périodes</SelectItem>
                <SelectItem value="moins6mois">Moins de 6 mois</SelectItem>
                <SelectItem value="6a12mois">6 à 12 mois</SelectItem>
                <SelectItem value="1a2ans">1 à 2 ans</SelectItem>
                <SelectItem value="plus2ans">Plus de 2 ans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto sm:ml-auto justify-end">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {loisFiltrees.length} résultat{loisFiltrees.length !== 1 ? 's' : ''}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={reinitialiser}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Badges actifs */}
        {allSelected.length > 0 && (
          <div className="border rounded-md bg-muted/30 p-2 mt-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">Filtres actifs :</div>
            <div className="flex flex-wrap gap-2">
              {allSelected.map(({ type, value }) => (
                <Badge key={`${type}-${value}`} variant="secondary" className="text-xs">
                  {type}: {value}
                  <button
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                    onClick={() => {
                      if (type === 'Statut') setFiltreStatuts(filtreStatuts.filter(v => v !== value))
                      if (type === 'Thème') setFiltreThemes(filtreThemes.filter(v => v !== value))
                      if (type === 'Type') setFiltreTypes(filtreTypes.filter(v => v !== value))
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
      </div>

      {/* Liste des dossiers – enveloppée dans le Sheet unique pour que les Triggers soient enfants */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <div className="divide-y divide-border rounded-lg border bg-card">
          {loisFiltrees.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Aucun dossier ne correspond à votre recherche
            </div>
          ) : (
            loisFiltrees.map((loi) => (
              <div key={loi.numero_dossier} className="group px-6 py-5 hover:bg-blue-50 transition-colors">
                <h3 className="text-xl font-bold text-foreground leading-tight">
                  {loi.titre_texte || 'Titre non disponible'}
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-semibold uppercase text-red-400">{loi.type_texte || 'Type inconnu'}</span>
                  <span className="text-muted-foreground/70">·</span>
                  <span>{loi.auteur || 'Auteur inconnu'}</span>
                  <span className="text-muted-foreground/70">·</span>
                  <span>Thèmes : {formatThemes(loi.themes)}</span>
                  <span className="text-muted-foreground/70">·</span>

                  <span className="font-medium">{loi.statut_final || 'Statut inconnu'}</span>
                  {formatThemes(loi.themes) && (
                    <>
                     
                    </>
                  )}
                </div>

                {(loi.lien_dossier_an || loi.lien_dossier_senat || loi.lien_dossier_legifrance) && (
                  <div className="-ml-2 mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-left pl-0">
                    {/* Trigger pour ouvrir le Sheet avec la loi sélectionnée */}
                    <SheetTrigger asChild>
                      <div 
                        onClick={() => setSelectedLoi(loi)}
                        className="inline-block"
                      >
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary hover:text-primary/80 justify-start cursor-pointer"
                        >
                          Résumé IA <Sparkles className="ml-1.5 !h-3 !w-3" />
                        </Button>
                      </div>
                    </SheetTrigger>

                    {loi.lien_dossier_an && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:text-primary/80 justify-start" 
                        asChild
                      >
                        <a href={loi.lien_dossier_an} target="_blank" rel="noopener noreferrer">
                          Assemblée Nationale <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}

                    {loi.lien_dossier_senat && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:text-primary/80 justify-start" 
                        asChild
                      >
                        <a href={loi.lien_dossier_senat} target="_blank" rel="noopener noreferrer">
                          Sénat <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}

                    {loi.lien_dossier_legifrance && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:text-primary/80 justify-start" 
                        asChild
                      >
                        <a href={loi.lien_dossier_legifrance} target="_blank" rel="noopener noreferrer">
                          Legifrance <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-4 text-sm text-muted-foreground">
                  Déposé le <span className="font-medium">{formatDate(loi.date_depot)}</span>
                  {!loi.date_promulgation && getDuree(loi) && (
                    <>
                      {' – Depuis '}
                      <span className="font-medium">{getDuree(loi)}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contenu du panneau latéral – unique */}
<SheetContent
  side="right"
  size="lg"
  className={cn(
    "fixed inset-y-0 right-0 w-full h-full bg-background shadow-xl transition-transform duration-300 ease-in-out",
    { "translate-x-0": isSheetOpen }
  )}
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-semibold leading-tight">
              {selectedLoi ? selectedLoi.titre_texte : "Chargement..."}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Résumé simplifié généré par IA
            </SheetDescription>
          </SheetHeader>

          {/* Contenu du résumé */}
<div className="space-y-6 py-4">
  {/* Titre section : Résumé IA du dernier texte disponible – clair et pédagogique. */}
  <h3 className="text-lg font-medium text-foreground">Résumé IA du dernier texte disponible</h3>

{loadingResume ? (
  <div className="flex justify-center items-center h-32">
    {/* Spinner pendant chargement – UX fluide comme dashboard LoiClair. */}
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Génération du résumé en cours...</span>
  </div>
) : errorMessage ? (
  <p className="text-sm text-destructive italic">
    {errorMessage}
  </p>
) : lienOfficiel ? (
  <>
    {/* Ligne lien officiel : Affichage transparence, lien clickable pour source. */}
    <p className="text-sm text-muted-foreground">
      Lien vers le texte officiel :{' '}
      <a href={lienOfficiel} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {lienOfficiel}
      </a>
    </p>

    {/* Résumé IA : Affichage whitespace-pre-wrap pour structure Grok conservée. */}
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {resumeIA}
    </div>
  </>
) : (
  <p className="text-sm text-destructive italic">
    Lien erroné ou contenu non encore disponible.
  </p>
)}
</div>

          <div className="absolute bottom-6 right-6">
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Fermer
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}