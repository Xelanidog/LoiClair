"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, ListChecks, TrendingUp, ExternalLink, Check, ChevronsUpDown, ChevronDown, Bot, Flag } from "lucide-react";
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
import { getStatusBadgeClass } from '@/lib/statusMapping';
import { cn } from '@/lib/utils';

interface Texte {
  uid: string;
  date_creation: string | null;
  date_publication: string | null;
  denomination: string | null;
  titre_principal_court: string | null;
  lien_texte: string | null;
  libelle_statut_adoption: string | null;
  provenance: string | null;
  url_accessible: boolean | null;
  contenu_legifrance: string | null;
  organe_auteur: { libelle: string } | null;
}

export interface ScrutinData {
  sortLibelle: string;
  type: string;
  pour: number;
  contre: number;
  abstentions: number;
  votants: number;
  nonVotants: number;
  suffragesRequis: number;
  date: string;
}

interface ResumeIAClientProps {
  uid: string;
  titreDossier: string;
  initialTextes: Texte[];
  statutFinal: string | null;
  procedureLibelle: string | null;
  dateDepot: string | null;
  datePromulgation: string | null;
  lienAN: string | null;
  lienSenat: string | null;
  lienLegifrance: string | null;
  dureeTotal: number | null;
  dureeApplication: number | null;
  isAppDirecte: boolean;
  auteurNom: string | null;
  auteurGroupe: string | null;
  timelineSteps: { code: string; label: string; date: string | null; done: boolean; detail: string | null }[];
  scrutinsParTexte: Record<string, ScrutinData>;
  initialTexteUid: string | null;
  cachedResumes: Record<string, string>;
}

const CARDS = [
  { key: 'pourquoi',    Icon: HelpCircle,  title: 'Pourquoi cette loi ?' },
  { key: 'changements', Icon: ListChecks,  title: 'Changements clés' },
  { key: 'impact',      Icon: TrendingUp,  title: 'Impact attendu' },
] as const;

function parseCompletion(text: string): Record<string, string> {
  // Pendant le streaming, un chunk peut couper un header "## ..." en plein milieu.
  // Le regex inclut alors le fragment dans le contenu de la section précédente,
  // causant un flash visuel. On supprime cette ligne partielle avant le parsing.
  const cleaned = text.replace(/\n#{2}[^\n]*$/, '');
  const extract = (header: string) => {
    const match = cleaned.match(new RegExp(`## ${header}([\\s\\S]*?)(?=## |$)`));
    return match?.[1]?.trim() || '';
  };
  return {
    pourquoi:    extract('Pourquoi cette loi \\?'),
    changements: extract('Changements clés'),
    impact:      extract('Impact attendu'),
  };
}


export default function ResumeIAClient({ uid, titreDossier, initialTextes, statutFinal, procedureLibelle, dateDepot, datePromulgation, lienAN, lienSenat, lienLegifrance, dureeTotal, dureeApplication, isAppDirecte, auteurNom, auteurGroupe, timelineSteps, scrutinsParTexte, initialTexteUid, cachedResumes }: ResumeIAClientProps) {
  const [textes] = useState<Texte[]>(initialTextes);
  const [selectedUid, setSelectedUid] = useState<string | null>(() => {
    if (initialTexteUid && initialTextes.some(t => t.uid === initialTexteUid)) return initialTexteUid;
    return initialTextes.length > 0 ? initialTextes[initialTextes.length - 1].uid : null;
  });
  const [liensStatus] = useState<Record<string, 'valide' | 'invalide' | 'lien-seul' | null>>(
    initialTextes.reduce((acc, t) => {
      // Version consolidée sans contenu stocké : lien disponible mais résumé IA impossible
      if (t.uid.endsWith('-VC') && !t.contenu_legifrance && t.lien_texte) {
        return { ...acc, [t.uid]: 'lien-seul' as const };
      }
      return {
        ...acc,
        [t.uid]: (t.contenu_legifrance || (t.url_accessible === true && t.lien_texte)) ? 'valide' : 'invalide',
      };
    }, {} as Record<string, 'valide' | 'invalide' | 'lien-seul'>)
  );

  const [open, setOpen] = useState(false);
  const [isStreamingCache, setIsStreamingCache] = useState(false);
  const [cachedCompletion, setCachedCompletion] = useState('');
  const completedForRef = useRef<string | null>(null);

  const {
    completion: apiCompletion, complete, isLoading: isLoadingResume, error, setCompletion,
  } = useCompletion({
    api: '/api/resume-loi',
    streamProtocol: 'text',
  });

  // Source d'affichage : cache s'il existe, sinon résultat API
  const completion = cachedCompletion || apiCompletion;

  const handleDiscussWithAI = (titre: string, lien: string) => {
    const prompt = `Analyse et explique ce texte législatif français pour en discuter avec moi : "${titre}". Voici le lien officiel : ${lien}. Résume les points clés, les objectifs, les impacts concrets et le contexte politique.`;
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    window.open(perplexityUrl, '_blank', 'noopener,noreferrer');
  };

  // Lancement du résumé IA : cache hit → affichage immédiat, cache miss → appel API réel
  useEffect(() => {
    if (!selectedUid) return;
    if (liensStatus[selectedUid] !== 'valide') return;
    if (completedForRef.current === selectedUid) return;

    completedForRef.current = selectedUid;

    // Nettoie les anciens résultats pour éviter le flash de contenu stale
    setCachedCompletion('');
    setCompletion('');

    // Cache hit : streaming simulé progressif (effet IA temps réel)
    if (cachedResumes[selectedUid]) {
      const fullText = cachedResumes[selectedUid];
      setIsStreamingCache(true);
      let i = 0;
      let done = false;
      const step = 8;    // caractères par tick
      const interval = setInterval(() => {
        i += step;
        if (i >= fullText.length) {
          setCachedCompletion(fullText);
          setIsStreamingCache(false);
          clearInterval(interval);
          done = true;
        } else {
          setCachedCompletion(fullText.slice(0, i));
        }
      }, 30); // ~8 chars toutes les 30ms → effet écriture lente
      return () => {
        clearInterval(interval);
        if (!done) {
          completedForRef.current = null;
          setIsStreamingCache(false);
        }
      };
    }

    // Cache miss : appel API réel (streaming via useCompletion)
    const selectedTexte = textes.find(t => t.uid === selectedUid);
    if (!selectedTexte?.lien_texte && !selectedTexte?.contenu_legifrance) return;

    complete(JSON.stringify({
      lien: selectedTexte.lien_texte,
      titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
      texte_uid: selectedUid,
      contenu_legifrance: selectedTexte.contenu_legifrance || undefined,
    }));
    // Cleanup : réinitialise le guard pour permettre à React Strict Mode (dev) de relancer l'appel
    // après sa simulation d'unmount — useCompletion aborte le streaming lors du unmount simulé.
    return () => { completedForRef.current = null; };
  // `complete` et `setCompletion` exclus des deps : ce sont des callbacks stables utilisés
  // uniquement pour déclencher des effets, pas pour lire des valeurs dérivées.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid, textes, liensStatus, cachedResumes]);

  const handleSelectChange = (uid: string) => setSelectedUid(uid);

  const formatDate = (dateCreation: string | null, datePublication: string | null) => {
    const dateToUse = dateCreation || datePublication;
    if (!dateToUse) return 'Inconnue';
    return new Date(dateToUse).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const selectedTexte = selectedUid ? textes.find((t) => t.uid === selectedUid) : null;
  const sections = useMemo(() => parseCompletion(completion), [completion]);
  const hasContent = Object.values(sections).some(v => v.length > 0);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-1">
        Résumé IA — {titreDossier || `dossier ${uid}`}
      </h1>
      <p className="text-xs font-mono text-muted-foreground/50 mb-4">{uid}</p>

      {/* Métadonnées du dossier */}
      <div className="mb-6 space-y-3">
        {/* Ligne 1 : badge statut + type procédure + auteur + groupe + date */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {statutFinal && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(statutFinal)}`}>
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

        {/* Ligne 2 : liens externes */}
        {(lienAN || lienSenat || lienLegifrance) && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {lienAN && (
              <a href={lienAN} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" />
                Assemblée nationale
              </a>
            )}
            {lienSenat && (
              <a href={lienSenat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" />
                Sénat
              </a>
            )}
            {lienLegifrance && (
              <a href={lienLegifrance} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" />
                Légifrance
              </a>
            )}
          </div>
        )}

        {/* Timeline verticale */}
        {timelineSteps.length > 0 && (() => {
          const isRejected = statutFinal === 'Rejeté';
          const lastDoneIdx = timelineSteps.reduce((acc, s, i) => s.done ? i : acc, -1);
          const hasPendingSteps = timelineSteps.some(s => !s.done);
          const isOngoing = !datePromulgation && !isRejected;
          const toDateStr = (s: string) => s.slice(0, 10); // normalise timestamp ou ISO date → "YYYY-MM-DD"
          const formatDate = (iso: string) => {
            const d = new Date(toDateStr(iso) + 'T00:00:00');
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
          };
          const daysBetween = (a: string, b: string) => {
            const diff = Math.round((new Date(toDateStr(b) + 'T00:00:00').getTime() - new Date(toDateStr(a) + 'T00:00:00').getTime()) / 86400000);
            if (diff > 60) return `${Math.round(diff / 30)} mois`;
            return `${diff} j`;
          };
          return (
            <div className="flex flex-col gap-0 mt-1">
              {timelineSteps.map((step, i) => {
                const isLast = i === timelineSteps.length - 1;
                const isLastDone = i === lastDoneIdx;
                const nextStep = !isLast ? timelineSteps[i + 1] : null;
                const showDuration = step.date && nextStep?.date;
                const isNextPending = nextStep && !nextStep.done;
                const isCurrent = isLastDone && (hasPendingSteps || isOngoing) && !isRejected;
                const dotColor = !step.done
                  ? 'border-muted-foreground bg-transparent'
                  : isRejected && isLastDone
                    ? 'border-red-500 bg-red-500'
                    : 'border-primary bg-primary';
                const lineColor = isNextPending || !step.done ? 'border-muted-foreground' : isRejected ? 'border-red-400' : 'border-primary';
                const lineStyle = isNextPending || !step.done ? 'dashed' : 'solid';
                return (
                  <div key={step.code} className="flex gap-3">
                    {/* Colonne gauche : point + ligne continue */}
                    <div className="flex flex-col items-center" style={{ width: '14px' }}>
                      <div className="relative shrink-0" style={{ width: '14px', height: '14px', marginTop: '3px' }}>
                        {isCurrent && (
                          <div
                            className="absolute rounded-full border-2 border-primary animate-ping"
                            style={{ inset: 0, opacity: 0.4 }}
                          />
                        )}
                        {step.code === 'PROM' && step.done ? (
                          <div
                            className="absolute flex items-center justify-center rounded-full bg-primary"
                            style={{ top: '0px', left: '0px', width: '14px', height: '14px' }}
                          >
                            <Check className="text-primary-foreground" style={{ width: '10px', height: '10px' }} />
                          </div>
                        ) : step.code === 'AN-APPLI' && step.done ? (
                          <div
                            className="absolute flex items-center justify-center rounded-full bg-primary"
                            style={{ top: '0px', left: '0px', width: '14px', height: '14px' }}
                          >
                            <Flag className="text-primary-foreground" style={{ width: '9px', height: '9px' }} />
                          </div>
                        ) : (
                          <div
                            className={`absolute rounded-full border-2 ${dotColor}`}
                            style={{ top: '2px', left: '2px', width: '10px', height: '10px' }}
                          />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={lineColor}
                          style={{
                            flex: 1,
                            minHeight: '28px',
                            borderLeftWidth: '2px',
                            borderLeftStyle: lineStyle,
                          }}
                        />
                      )}
                    </div>
                    {/* Colonne droite : contenu */}
                    <div className="flex flex-col" style={{ paddingBottom: isLast ? 0 : '8px' }}>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {step.date ? formatDate(step.date) : step.done ? '' : 'en attente'}
                        </span>
                      </div>
                      {step.code === 'PROM' && step.done && dureeTotal !== null && (
                        <span className="text-xs font-semibold" style={{ color: '#27AE60' }}>
                          {isAppDirecte ? `Promulgué et appliqué en ${dureeTotal} j` : `Promulgué en ${dureeTotal} j`}
                        </span>
                      )}
                      {step.code === 'AN-APPLI' && step.done && dureeApplication !== null && (
                        <span className="text-xs font-semibold" style={{ color: '#27AE60' }}>
                          Appliquée en {dureeApplication} j
                        </span>
                      )}
                      {!isLast && (
                        <div style={{ minHeight: '12px', marginTop: '4px' }}>
                          {showDuration && !step.detail && (
                            <span className="text-xs text-muted-foreground" style={{ opacity: 0.7 }}>
                              {daysBetween(step.date!, nextStep!.date!)}
                            </span>
                          )}
                          {isCurrent && step.date && !step.detail && (
                            <span className="text-xs" style={{ color: '#F39C12' }}>
                              en cours depuis {daysBetween(step.date, new Date().toISOString().slice(0, 10))}
                            </span>
                          )}
                          {step.detail && (
                            <span className="text-xs" style={{ color: step.detail.startsWith('en cours') ? '#F39C12' : undefined, opacity: step.detail.startsWith('en cours') ? 1 : 0.7 }}>
                              {step.detail}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <Link href={`/Month?dossier=${uid}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
          Voir le fil d'actu de ce dossier →
        </Link>
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
          {selectedTexte.lien_texte && liensStatus[selectedTexte.uid] !== 'invalide' && (
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
        </div>
      )}

      {/* Résultat du scrutin — affiché si le texte sélectionné a un vote associé */}
      {selectedUid && scrutinsParTexte[selectedUid] && (() => {
        const s = scrutinsParTexte[selectedUid];
        const resultLower = s.sortLibelle.toLowerCase();
        const isRejected = resultLower.includes('rejet') || resultLower.includes("n'a pas adopt") || resultLower.includes('pas adopté');
        const isAdopted = !isRejected && resultLower.includes('adopt');
        const TOTAL_DEPUTES = 577;
        const absents = Math.max(TOTAL_DEPUTES - s.votants - s.nonVotants, 0);
        const dateStr = s.date ? new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : null;
        const majorityPct = s.suffragesRequis > 0 ? (s.suffragesRequis / TOTAL_DEPUTES) * 100 : 0;

        return (
          <div className="mb-6 rounded-lg border px-4 py-3" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(isAdopted ? 'Adopté' : isRejected ? 'Rejeté' : null)}`}>
                {isAdopted ? 'Adopté' : isRejected ? 'Rejeté' : 'Vote'}
              </span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="relative flex-1 h-2 rounded-full overflow-hidden isolate" style={{ display: 'flex', backgroundColor: 'var(--color-muted)' }}>
                  <div style={{ width: `${(s.pour / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#27AE60', minWidth: s.pour > 0 ? '2px' : '0' }} className="h-full" />
                  <div style={{ width: `${(s.contre / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#E74C3C', minWidth: s.contre > 0 ? '2px' : '0' }} className="h-full" />
                  <div style={{ width: `${(s.abstentions / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#A8A29E', minWidth: s.abstentions > 0 ? '2px' : '0' }} className="h-full" />
                  <div style={{ width: `${(s.nonVotants / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#F39C12', minWidth: s.nonVotants > 0 ? '2px' : '0' }} className="h-full" />
                  <div style={{ width: `${(absents / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#F0EDEA' }} className="h-full dark:hidden" />
                  <div style={{ width: `${(absents / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#44403C' }} className="h-full hidden dark:block" />
                  {majorityPct > 0 && (
                    <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${majorityPct}%` }} title={`Majorité requise : ${s.suffragesRequis}`} />
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 font-medium">
                  {s.pour}–{s.contre}–{s.abstentions}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#27AE60' }} />Pour : {s.pour}</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#E74C3C' }} />Contre : {s.contre}</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#A8A29E' }} />Abstentions : {s.abstentions}</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#F39C12' }} />Non-votants : {s.nonVotants}</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0 bg-[#F0EDEA] dark:bg-[#44403C]" />Absents : {absents}</div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {s.type && <span className="capitalize">{s.type}</span>}
              {s.type && dateStr && <span>·</span>}
              {dateStr && <span>{dateStr}</span>}
              <span>·</span>
              <span>{s.votants} votants sur 577</span>
              {s.suffragesRequis > 0 && (
                <>
                  <span>·</span>
                  <span>Majorité requise : {s.suffragesRequis} voix</span>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* État : pas de texte sélectionné */}
      {!selectedTexte && (
        <p className="text-muted-foreground">Sélectionnez un texte pour générer le résumé IA.</p>
      )}

      {/* État : lien invalide */}
      {selectedTexte && liensStatus[selectedTexte.uid] === 'invalide' && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <p>Ce texte n&apos;est pas encore disponible en ligne. Sélectionnez un autre texte dans la liste ci-dessus.</p>
        </div>
      )}

      {/* État : version consolidée (lien seul, pas de résumé IA) */}
      {selectedTexte && liensStatus[selectedTexte.uid] === 'lien-seul' && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="text-foreground">La version consolidée (version en vigueur avec les modifications ultérieures) est consultable directement sur Légifrance.</p>
            <p className="text-muted-foreground mt-1">Le résumé IA de cette version sera disponible prochainement.</p>
          </div>
        </div>
      )}

      {/* État : erreur */}
      {error && (
        <div className="flex items-center gap-3 text-sm">
          <p className="text-destructive">Le résumé n&apos;a pas pu être généré : le texte officiel n&apos;a pas pu être téléchargé (source inaccessible ou mauvaise connexion).</p>
          <button
            onClick={() => {
              completedForRef.current = null;
              const t = textes.find(t => t.uid === selectedUid);
              if (t?.lien_texte) {
                setCompletion('');
                complete(JSON.stringify({
                  lien: t.lien_texte,
                  titre_texte: t.titre_principal_court || t.denomination || 'Texte inconnu',
                  texte_uid: selectedUid,
                }));
              }
            }}
            className="text-xs text-primary hover:underline shrink-0"
          >
            Réessayer →
          </button>
        </div>
      )}

      {/* Indicateur de génération — hauteur réservée pour éviter le saut de layout */}
      <p className={cn("text-xs mb-3 text-muted-foreground transition-opacity duration-300", (isLoadingResume || isStreamingCache) && !error ? "opacity-100" : "opacity-0")}>
        Génération du résumé en cours…
      </p>

      {/* 3 cartes structurées */}
      {selectedTexte && liensStatus[selectedTexte.uid] === 'valide' && !error && (
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
                ) : (isLoadingResume || isStreamingCache) ? (
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
      {selectedTexte && selectedTexte.lien_texte && (hasContent || (!isLoadingResume && !isStreamingCache && !error)) && liensStatus[selectedTexte.uid] === 'valide' && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => handleDiscussWithAI(
              selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
              selectedTexte.lien_texte!
            )}
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform rounded-xl"
            style={{
              background: 'conic-gradient(from var(--rainbow-angle), #0891B2, #06B6D4, #22D3EE, #D4A54A, #06B6D4, #0891B2)',
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
