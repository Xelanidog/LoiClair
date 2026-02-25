"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader2, HelpCircle, ListChecks, TrendingUp, ExternalLink, Check, ChevronsUpDown, ChevronDown, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { SYSTEM_PROMPT_RESUME_LOI, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts';
import { useCompletion } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandGroup, CommandItem, CommandList,
} from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ProcedureTooltip from '@/components/ProcedureTooltip';
import { DEFINITIONS } from '@/lib/definitions';

interface Texte {
  uid: string;
  date_creation: string | null;
  date_publication: string | null;
  denomination: string | null;
  titre_principal_court: string | null;
  lien_texte: string | null;
  libelle_statut_adoption: string | null;
  provenance: string | null;
  organe_auteur: { libelle: string } | null;
}

interface ResumeIAClientProps {
  uid: string;
  titreDossier: string;
  initialTextes: Texte[];
  statutFinal: string | null;
  procedureLibelle: string | null;
  dateDepot: string | null;
  datePromulgation: string | null;
  auteurNom: string | null;
  auteurGroupe: string | null;
  timelineSteps: string[];
}

const CARDS = [
  { key: 'pourquoi',    Icon: HelpCircle,  title: 'Pourquoi cette loi ?' },
  { key: 'changements', Icon: ListChecks,  title: 'Changements clés' },
  { key: 'impact',      Icon: TrendingUp,  title: 'Impact attendu' },
] as const;

function parseCompletion(text: string): Record<string, string> {
  const extract = (header: string) => {
    const match = text.match(new RegExp(`## ${header}([\\s\\S]*?)(?=## |$)`));
    return match?.[1]?.trim() || '';
  };
  return {
    pourquoi:    extract('Pourquoi cette loi \\?'),
    changements: extract('Changements clés'),
    impact:      extract('Impact attendu'),
  };
}

const BADGE_CLASSES: Record<string, string> = {
  "Promulguée": "bg-green-100 text-green-800 border-green-200",
  "Rejeté": "bg-red-100 text-red-800 border-red-200",
  "En cours d'examen": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Adopté par le Parlement": "bg-purple-100 text-purple-800 border-purple-200",
  "Adopté par l'Assemblée nationale": "bg-blue-100 text-blue-800 border-blue-200",
  "Adopté par le Sénat": "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export default function ResumeIAClient({ uid, titreDossier, initialTextes, statutFinal, procedureLibelle, dateDepot, datePromulgation, auteurNom, auteurGroupe, timelineSteps }: ResumeIAClientProps) {
  const [textes] = useState<Texte[]>(initialTextes);
  const [selectedUid, setSelectedUid] = useState<string | null>(
    initialTextes.length > 0 ? initialTextes[initialTextes.length - 1].uid : null
  );
  const [liensStatus, setLiensStatus] = useState<Record<string, 'valide' | 'invalide' | 'en_cours' | null>>(
    initialTextes.reduce((acc, t) => ({ ...acc, [t.uid]: 'en_cours' as const }), {} as Record<string, 'en_cours'>)
  );

  const [open, setOpen] = useState(false);
  const completedForRef = useRef<string | null>(null);

  const {
    completion, complete, isLoading: isLoadingResume, error, setCompletion,
  } = useCompletion({
    api: '/api/resume-loi',
    streamProtocol: 'text',
  });

  const handleDiscussWithAI = (titre: string, lien: string) => {
    const prompt = `Analyse et explique ce texte législatif français pour en discuter avec moi : "${titre}". Voici le lien officiel : ${lien}. Résume les points clés, les objectifs, les impacts concrets et le contexte politique.`;
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    window.open(perplexityUrl, '_blank', 'noopener,noreferrer');
  };

  // Vérification des liens
  useEffect(() => {
    const verifierLiens = async () => {
      for (const texte of textes) {
        if (!texte.lien_texte) {
          setLiensStatus(prev => ({ ...prev, [texte.uid]: 'invalide' }));
          continue;
        }
        const isValidFormat = /^https?:\/\/[^\s$.?#].[^\s]*$/.test(texte.lien_texte);
        if (!isValidFormat) {
          setLiensStatus(prev => ({ ...prev, [texte.uid]: 'invalide' }));
          continue;
        }
        try {
          const response = await fetch('/api/verifier-lien', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: texte.lien_texte }),
          });
          const data = await response.json();
          setLiensStatus(prev => ({ ...prev, [texte.uid]: data.ok ? 'valide' : 'invalide' }));
        } catch {
          setLiensStatus(prev => ({ ...prev, [texte.uid]: 'invalide' }));
        }
      }
    };
    if (textes.length > 0) verifierLiens();
  }, [textes]);

  // Lancement du résumé IA uniquement quand le lien est confirmé valide
  useEffect(() => {
    if (!selectedUid) return;
    if (liensStatus[selectedUid] !== 'valide') return;
    if (completedForRef.current === selectedUid) return;

    const selectedTexte = textes.find(t => t.uid === selectedUid);
    if (!selectedTexte?.lien_texte) return;

    completedForRef.current = selectedUid;
    setCompletion('');
    complete(JSON.stringify({
      lien: selectedTexte.lien_texte,
      titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
    }));
  }, [selectedUid, textes, liensStatus, complete, setCompletion]);

  const handleSelectChange = (uid: string) => setSelectedUid(uid);

  const formatDate = (dateCreation: string | null, datePublication: string | null) => {
    const dateToUse = dateCreation || datePublication;
    if (!dateToUse) return 'Inconnue';
    return new Date(dateToUse).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const selectedTexte = selectedUid ? textes.find((t) => t.uid === selectedUid) : null;
  const sections = parseCompletion(completion);
  const hasContent = Object.values(sections).some(v => v.length > 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-4">
        Résumé IA — {titreDossier || `dossier ${uid}`}
      </h1>

      {/* Métadonnées du dossier */}
      <div className="mb-6 space-y-3">
        {/* Ligne 1 : badge statut + type procédure + auteur + groupe + date */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {statutFinal && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${BADGE_CLASSES[statutFinal] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
              {statutFinal}
            </span>
          )}
          {procedureLibelle && (
            DEFINITIONS[procedureLibelle]
              ? <ProcedureTooltip label={procedureLibelle} description={DEFINITIONS[procedureLibelle]} />
              : <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium uppercase tracking-wide">{procedureLibelle}</span>
          )}
          {auteurNom && (
            <>
              <span className="text-border">·</span>
              <span className="text-muted-foreground">{auteurNom}</span>
            </>
          )}
          {auteurGroupe && (
            <>
              <span className="text-border">·</span>
              <span className="px-2 py-0.5 rounded-md bg-muted text-xs">{auteurGroupe}</span>
            </>
          )}
          {dateDepot && (
            <>
              <span className="text-border">·</span>
              <span className="text-muted-foreground text-xs">
                Déposé le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(dateDepot))}
              </span>
            </>
          )}
        </div>

        {/* Ligne 2 : timeline */}
        {timelineSteps.length > 0 && (() => {
          const steps = ['Dépôt', ...timelineSteps];
          const lastIdx = steps.length - 1;
          const isRejected = statutFinal === 'Rejeté';
          const lineColor = isRejected ? 'bg-red-400' : 'bg-primary';
          return (
            <div className="flex overflow-x-auto">
              {steps.map((label, i) => (
                <div key={i} className="w-12 sm:w-20 shrink-0 flex flex-col">
                  <div className="flex items-center">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${isRejected && i === lastIdx ? 'bg-red-500 border-red-500' : 'bg-primary border-primary'}`} />
                    {i < lastIdx && <div className={`flex-1 h-px ${lineColor}`} />}
                  </div>
                  <span className="text-[10px] leading-tight mt-1.5 text-foreground font-medium">{label}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Combobox de sélection du texte */}
      <div className="mb-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full max-w-xl justify-between font-normal"
            >
              <span className="truncate">
                {selectedTexte
                  ? `${selectedTexte.denomination || 'Texte'} — ${formatDate(selectedTexte.date_creation, selectedTexte.date_publication)}`
                  : 'Sélectionner un texte à analyser...'}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[520px] p-0" side="bottom" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {textes.map(t => (
                    <CommandItem
                      key={t.uid}
                      value={t.uid}
                      onSelect={() => { handleSelectChange(t.uid); setOpen(false); }}
                      disabled={liensStatus[t.uid] === 'invalide'}
                      className="flex items-center gap-2 py-2"
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-medium text-sm">
                          {t.denomination || 'Texte'}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          {t.provenance && <span>{t.provenance}</span>}
                          {t.provenance && t.organe_auteur?.libelle && <span>·</span>}
                          {t.organe_auteur?.libelle && <span>{t.organe_auteur.libelle}</span>}
                          {t.libelle_statut_adoption && <span>·</span>}
                          {t.libelle_statut_adoption && (
                            <Badge variant="secondary" className="text-xs py-0 h-4">
                              {t.libelle_statut_adoption}
                            </Badge>
                          )}
                          <span>·</span>
                          <span>{formatDate(t.date_creation, t.date_publication)}</span>
                          {liensStatus[t.uid] === 'invalide' && (
                            <span className="text-destructive">· Non disponible</span>
                          )}
                        </div>
                      </div>
                      {selectedUid === t.uid && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Metadata du texte sélectionné */}
      {selectedTexte && (
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-muted-foreground">
          {selectedTexte.organe_auteur?.libelle && (
            <span>{selectedTexte.organe_auteur.libelle}</span>
          )}
          {selectedTexte.libelle_statut_adoption && (
            <>
              <span>·</span>
              <Badge variant="secondary">{selectedTexte.libelle_statut_adoption}</Badge>
            </>
          )}
          {selectedTexte.lien_texte && (
            <>
              <span>·</span>
              <a
                href={selectedTexte.lien_texte}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                Voir le texte officiel
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
          {liensStatus[selectedTexte.uid] === 'en_cours' && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Vérification du lien...
              </span>
            </>
          )}
        </div>
      )}

      {/* État : pas de texte sélectionné */}
      {!selectedTexte && (
        <p className="text-muted-foreground">Sélectionnez un texte pour générer le résumé IA.</p>
      )}

      {/* État : lien invalide */}
      {selectedTexte && liensStatus[selectedTexte.uid] === 'invalide' && (
        <p className="text-muted-foreground">Ce texte n&apos;a pas encore été publié. Sélectionnez un autre texte.</p>
      )}

      {/* État : erreur */}
      {error && (
        <p className="text-destructive">Erreur : {error.message}</p>
      )}

      {/* 3 cartes structurées */}
      {selectedTexte && liensStatus[selectedTexte.uid] !== 'invalide' && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map(({ key, Icon, title }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm prose prose-sm max-w-none dark:prose-invert">
                {sections[key] ? (
                  <ReactMarkdown>{sections[key]}</ReactMarkdown>
                ) : isLoadingResume ? (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/6" />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rainbow button Perplexity — sous les cartes */}
      {selectedTexte && selectedTexte.lien_texte && (hasContent || (!isLoadingResume && !error)) && liensStatus[selectedTexte.uid] === 'valide' && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => handleDiscussWithAI(
              selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
              selectedTexte.lien_texte!
            )}
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform rounded-xl"
            style={{
              background: 'conic-gradient(from var(--rainbow-angle), #ff0080, #ff8c00, #ffe600, #00ff88, #00cfff, #8a2be2, #ff0080)',
              animation: 'rainbow-rotate 4s linear infinite',
              padding: '2px',
            }}
          >
            <span className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-background text-foreground font-medium text-sm">
              <ExternalLink className="h-4 w-4" />
              Approfondir avec Perplexity
            </span>
          </button>
        </div>
      )}

      {/* Section transparence IA — Article 50 AI Act */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contenu généré par intelligence artificielle</span>
          <a href="/documentation/conformite-ia" className="text-xs text-primary hover:underline ml-1">
            Conformité AI Act →
          </a>
        </div>

        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none select-none">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            Paramètres de génération
          </summary>

          <div className="mt-4 space-y-4">
            {/* Tableau des paramètres */}
            <div className="rounded-lg border overflow-hidden text-sm">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30 w-1/3">Modèle</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{MODEL_RESUME_LOI}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">Fournisseur</td>
                    <td className="px-4 py-2.5">xAI (Grok)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">Température</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{PARAMS_RESUME_LOI.temperature} <span className="text-muted-foreground font-sans">(0 = strict, 1 = créatif)</span></td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">Tokens max (sortie)</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{PARAMS_RESUME_LOI.maxTokens}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">Caractères max (entrée)</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{MAX_INPUT_CHARS_RESUME_LOI.toLocaleString('fr-FR')} <span className="text-muted-foreground font-sans">(≈ {Math.round(MAX_INPUT_CHARS_RESUME_LOI / 4).toLocaleString('fr-FR')} tokens)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Prompt système */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Prompt système (instructions données à l&apos;IA)</p>
              <pre className="text-xs bg-muted/40 border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {SYSTEM_PROMPT_RESUME_LOI.trim()}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
