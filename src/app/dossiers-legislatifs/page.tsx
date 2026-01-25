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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Ajout pour mieux parser les listes et tables Markdown.
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

// Fonction pour gérer le clic sur le bouton : Crée un prompt clair avec le titre de la loi + le lien officiel du texte (utilisé pour le résumé IA), encode pour URL, et ouvre Perplexity dans un nouvel onglet. Pas de dépendances externes. Optimisations cumulées depuis le début de cette page dossiers-legislatifs : on a chargé le CSV robustement (Papa.parse avec filtres uniques triés), implémenté multi-selects minimalistes (Popover/Command pour UX fluide sans state heavy), ajouté pagination centrée avec ellipsis (flex pour responsiveness), fixé animation Sheet Safari (reflow useEffect), optimisé fetch IA (try-catch avec fallbacks et spinner), structuré Markdown pour lisibilité (ReactMarkdown avec plugins pour listes/tables), affiné le Sheet pour un panneau latéral élégant (flex bottom pour boutons alignés, tooltips pour guidance sans overload), et maintenant on allège le prompt IA pour plus d'efficacité (titre + lien au lieu de chrono complète, pour éviter limites URL et favoriser fetch factuel par Perplexity).

const handleDiscussWithAI = (titre, lien) => {
  const prompt = `Discuter de ce texte de loi avec moi (résumé clair et impacts) : Titre: ${titre}. Lien officiel: ${lien || 'Lien non disponible'}`; // Fallback si lien null pour robustesse
  const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
  window.open(perplexityUrl, '_blank');
};


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
  const [resumeChrono, setResumeChrono] = useState<string | null>(null); // Stocke le résumé chrono texte
  const [loadingResume, setLoadingResume] = useState(false); // Pour le spinner
  const [lienOfficiel, setLienOfficiel] = useState<string | null>(null); // Lien texte récent utilisé par IA
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Message erreur API pour panneau
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Nb lois par page – ajuste pour équilibre (ex. 10 pour mobile-heavy)
  const [totalFiltered, setTotalFiltered] = useState(0);

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
    setResumeIA(null);
    setResumeChrono(null); // Reset
    setLoadingResume(true);
    fetchResume(); // Appel simple, l'async est gérée dedans
  }
}, [isSheetOpen, selectedLoi]); // Dépendances minimales pour éviter re-fetch inutiles

async function fetchResume() {
  try {
    const response = await fetch('/api/resume-loi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chronologie_complete: selectedLoi.chronologie_complete,
        titre_texte: selectedLoi.titre_texte,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`); // Plus précis pour debug
    }

    const data = await response.json(); // Ici, data est bien awaitée

    setResumeIA(data.resume || 'Résumé texte non disponible'); // Fallback pour robustesse
    setResumeChrono(data.resumeChrono || 'Résumé chrono non disponible');
    setLienOfficiel(data.lien || null);
    setErrorMessage(null);
  } catch (error) {
    console.error('Erreur dans fetchResume :', error); // Log pour tracer (visible dans console browser)
    setErrorMessage('Désolé, impossible de charger le résumé. Vérifiez la connexion ou réessayez.');
    setResumeIA(null);
    setResumeChrono(null);
    setLienOfficiel(null);
  } finally {
    setLoadingResume(false); // Toujours stopper le spinner, même en erreur
  }
}

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

    setTotalFiltered(filtered.length); // ← Ajout ici : stocke le nb total de lois filtrées pour l'utiliser dans la pagination (évite l'erreur "filtered undefined")

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    setLoisFiltrees(paginated); // ← Remplace le setLoisFiltrees(filtered) par ça
    if (currentPage > Math.ceil(filtered.length / itemsPerPage)) {
  setCurrentPage(1);
}


  }, [recherche, filtreTypes, filtreStatuts, filtreThemes, filtrePeriode, lois, currentPage])

  // Scroll auto en haut sur changement de page – UX fluide
useEffect(() => {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 0); // Délai 0ms pour next tick – fixe timing render
}, [currentPage]);

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
        <div className="flex flex-wrap items-center gap-2 sm:gap-2 mb-4">
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

          <div className="space-y-1 flex-1 min-w-[200px] max-w-[320px]">
            <div className="text-xs font-medium text-muted-foreground">Période de dépôt</div>
            <Select value={filtrePeriode} onValueChange={setFiltrePeriode}>
              <SelectTrigger className="hover:bg-muted/70 transition-colors h-10 min-w-[200px] hover:text-foreground">
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
              {totalFiltered} résultat{totalFiltered !== 1 ? 's' : ''}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={reinitialiser}
              className="h-10 w-10 p-0 ml-0 flex items-center justify-center"
              title="Réinitialiser les filtres"
            >
              <RotateCcw className="h-4 w-4" />
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
        <div className="divide-y divide-border rounded-lg  bg-card">
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
<div className="space-y-4 py-4">
  {/* Titre section : Résumé IA du dernier texte disponible – clair et pédagogique. */}
  <h3 className="text-lg font-medium text-foreground">Résumé IA du dernier texte disponible</h3>

{loadingResume ? (
<div className="space-y-4 py-4">
  <Skeleton className="h-6 w-3/4" /> {/* Mime le h3 titre */}
  <Skeleton className="h-4 w-full" /> {/* Ligne de texte */}
  <Skeleton className="h-4 w-5/6" />
  <Skeleton className="h-4 w-2/3" />
  <Skeleton className="h-6 w-3/4 mt-8" /> {/* Mime le second h3 */}
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-4/5" />
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
<div className="text-sm">
<ReactMarkdown
    remarkPlugins={[remarkGfm]} // Active le parsing avancé pour listes fiables.
    components={{
      strong: ({ node, ...props }) => <strong className="font-medium" {...props} />, // Modification : mb-1 pour mini-espace sous titre (écart minimal avant texte) ; mt-4 garde séparation entre sections.
      p: ({ node, ...props }) => <p className="mt-2" {...props} />, // mt-0 pour coller le texte paragraphe au titre sans espace.
      ul: ({ node, ...props }) => <ul className="list-disc pl-6" {...props} />, // mt-0 pour coller la liste puces au titre ; pl-4 garde indentation légère.
      li: ({ node, ...props }) => <li {...props} />, // Simple, sans ajouts inutiles.
    }}
  >
    {resumeIA}
  </ReactMarkdown>
</div>
  </>
) : (
  <p className="text-sm text-destructive italic">
    Lien erroné ou contenu non encore disponible.
  </p>
)}
</div>

{/* Titre section : Résumé IA du parcours de la loi – clair et pédagogique. */}
<h3 className="text-lg font-medium text-foreground mt-8">Résumé IA du parcours de la loi</h3>

{loadingResume ? (
<div className="space-y-4">
  <Skeleton className="h-6 w-3/4" /> {/* Titre */}
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-4/5" />
</div>
) : errorMessage ? (
  <p className="text-sm text-destructive italic">
    {errorMessage}
  </p>
) : resumeChrono ? (


    <div className="text-sm">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]} // Active le parsing avancé pour listes fiables.
    components={{
      ul: ({ node, ...props }) => <ul className="list-disc pl-4" {...props} />,
      li: ({ node, ...props }) => <li className="text-muted-foreground" {...props} />,
      strong: ({ node, ...props }) => <strong className="block mt-2 font-medium" {...props} />, // Ajout : rend les ** comme blocs avec margin vertical pour écart entre sections.
    }}
  >
    {resumeChrono}
  </ReactMarkdown>
</div>
) : (
  <p className="text-sm text-destructive italic">
    Chronologie incomplète ou non disponible.
  </p>
)}



<div className="absolute bottom-6 right-6 flex items-center gap-4">
  <SheetClose asChild>
    <Button variant="outline" size="sm">
      Fermer
    </Button>
  </SheetClose>

  <TooltipProvider>
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button 
          variant="outline" 
          onClick={() => handleDiscussWithAI(selectedLoi.titre_texte, lienOfficiel)}          className="mt-0"
        >
          Discuter de ce texte avec l'IA (Perplexity)
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Ouvre Perplexity avec le texte pré-chargé (compte gratuit recommandé pour discussions étendues)</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>


       </SheetContent>

        {/* Bloc pagination – ajoute ça juste après la div ci-dessus, avant le </Sheet> */}
{totalFiltered > itemsPerPage && ( // filtered est le total avant slice ; calcule-le dans useEffect si besoin
  <div className="flex items-center justify-center gap-2 mt-6">
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    >
      Précédent
    </Button>
    {/* Numéros pages dynamiques avec ellipsis + centrage sur current */}

{/* Numéros pages dynamiques avec ellipsis + centrage sur current – anti-duplicates */}
{(() => {
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);

const pages = [];
if (totalPages > 1) {
  // Première page toujours au début
  pages.push(1);

  // Ellipsis si gap avant range (ajusté pour bords)
  if (currentPage > 4) pages.push('...');

  // Range centré : ajusté pour inclure 1 si current bas
  const start = Math.max(1, currentPage - 1); // ← Changé à -1 pour limiter + inclure 1 sur page 1
  const end = Math.min(totalPages, currentPage + 1); // ← Changé à +1 pour max 3 range (limite 5 total)
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i); // Anti-duplicate
  }

  // Ellipsis si gap après range
  if (currentPage < totalPages - 2) pages.push('...'); // Ajusté pour gap réel

  // Dernière page toujours à la fin, sans duplicate
  if (totalPages > end && !pages.includes(totalPages)) pages.push(totalPages);
}

  return pages.map((page, index) => 
    typeof page === 'string' ? (
      <Badge key={`ellipsis-${index}`} variant="secondary" className="px-3 py-1 text-muted-foreground">
        {page}
      </Badge>
    ) : (
      <Button
        key={`${page}-${index}`} // Key unique avec page+index pour anti-collision
        variant={currentPage === page ? "default" : "outline"}
        size="sm"
        onClick={() => setCurrentPage(page)}
      >
        {page}
      </Button>
    )
  );
})()}
    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === Math.ceil(totalFiltered / itemsPerPage)}
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalFiltered / itemsPerPage)))}
    >
      Suivant
    </Button>
  </div>
)}
      </Sheet>
    </div> 
  )
}