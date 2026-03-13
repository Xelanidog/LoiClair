"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, ChevronDown, Bot, Sparkles, Check } from "lucide-react";
import Link from 'next/link';
import { SYSTEM_PROMPT_RESUME_LOI, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts';
import { useCompletion } from '@ai-sdk/react';
import { Skeleton } from '@/components/ui/skeleton';
import ProcedureTooltip from '@/components/ProcedureTooltip';
import { DEFINITIONS } from '@/lib/definitions';
import { getStatusBadgeClass } from '@/lib/statusMapping';
import { cn } from '@/lib/utils';
import Timeline from './Timeline';
import ScrutinResult from './ScrutinResult';

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

export interface TexteEtape {
  label: string;
  texteUid: string;
  type: string;
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
  auteurRole: string | null;
  auteurGroupe: string | null;
  timelineSteps: { code: string; label: string; date: string | null; done: boolean; detail: string | null }[];
  textesParEtape: Record<string, TexteEtape[]>;
  scrutinsParTexte: Record<string, ScrutinData>;
  defaultTexteUid: string | null;
  cachedResumes: Record<string, string>;
}

// Pre-compiled regexes for section extraction
const RE_TRAILING_HEADER = /\n#{2}[^\n]*$/;
const SECTION_REGEXES = {
  ceQueDit:    /## Ce que dit ce texte([\s\S]*?)(?=## |$)/,
  ceQuiChange: /## Ce qui change concrètement([\s\S]*?)(?=## |$)/,
  aRetenir:    /## À retenir([\s\S]*?)(?=## |$)/,
} as const;

function parseCompletion(text: string): Record<string, string> {
  const cleaned = text.replace(RE_TRAILING_HEADER, '');
  return {
    ceQueDit:    cleaned.match(SECTION_REGEXES.ceQueDit)?.[1]?.trim() || '',
    ceQuiChange: cleaned.match(SECTION_REGEXES.ceQuiChange)?.[1]?.trim() || '',
    aRetenir:    cleaned.match(SECTION_REGEXES.aRetenir)?.[1]?.trim() || '',
  };
}

function fmtDate(t: Texte | undefined): string {
  const raw = t?.date_creation || t?.date_publication;
  return raw ? new Date(raw).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export default function ResumeIAClient({ uid, titreDossier, initialTextes, statutFinal, procedureLibelle, dateDepot, datePromulgation, lienAN, lienSenat, lienLegifrance, dureeTotal, dureeApplication, isAppDirecte, auteurNom, auteurRole, auteurGroupe, timelineSteps, textesParEtape, scrutinsParTexte, defaultTexteUid, cachedResumes }: ResumeIAClientProps) {
  const [selectedUid, setSelectedUid] = useState<string | null>(defaultTexteUid);
  const liensStatus = useMemo(() => {
    const result: Record<string, 'valide' | 'invalide' | 'lien-seul'> = {};
    for (const t of initialTextes) {
      if (t.uid.endsWith('-VC') && !t.contenu_legifrance && t.lien_texte) {
        result[t.uid] = 'lien-seul';
      } else {
        result[t.uid] = (t.contenu_legifrance || (t.url_accessible === true && t.lien_texte)) ? 'valide' : 'invalide';
      }
    }
    return result;
  }, [initialTextes]);

  const textesByUid = useMemo(() => new Map(initialTextes.map(t => [t.uid, t])), [initialTextes]);

  const [isStreamingCache, setIsStreamingCache] = useState(false);
  const [cachedCompletion, setCachedCompletion] = useState('');
  const completedForRef = useRef<string | null>(null);

  const {
    completion: apiCompletion, complete, isLoading: isLoadingResume, error, setCompletion,
  } = useCompletion({
    api: '/api/resume-loi',
    streamProtocol: 'text',
  });

  const completion = cachedCompletion || apiCompletion;

  const handleDiscussWithAI = (titre: string, lien: string) => {
    const prompt = `Analyse et explique ce texte législatif français pour en discuter avec moi : "${titre}". Voici le lien officiel : ${lien}. Résume les points clés, les objectifs, les impacts concrets et le contexte politique.`;
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    window.open(perplexityUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTimelineSelectTexte = (texteUid: string) => {
    if (texteUid !== selectedUid) {
      completedForRef.current = null;
      setCachedCompletion('');
      setCompletion('');
      setSelectedUid(texteUid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!selectedUid) return;
    if (liensStatus[selectedUid] !== 'valide') return;
    if (completedForRef.current === selectedUid) return;

    completedForRef.current = selectedUid;

    setCachedCompletion('');
    setCompletion('');

    if (cachedResumes[selectedUid]) {
      const fullText = cachedResumes[selectedUid];
      setIsStreamingCache(true);
      let i = 0;
      let done = false;
      const step = 8;
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
      }, 30);
      return () => {
        clearInterval(interval);
        if (!done) {
          completedForRef.current = null;
          setIsStreamingCache(false);
        }
      };
    }

    const selectedTexte = textesByUid.get(selectedUid);
    if (!selectedTexte?.lien_texte && !selectedTexte?.contenu_legifrance) return;

    complete(JSON.stringify({
      lien: selectedTexte.lien_texte,
      titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
      texte_uid: selectedUid,
      contenu_legifrance: selectedTexte.contenu_legifrance || undefined,
    }));
    return () => { completedForRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid, initialTextes, liensStatus, cachedResumes]);

  const selectedTexte = selectedUid ? textesByUid.get(selectedUid) ?? null : null;
  const lienTexte = selectedTexte?.lien_texte ?? null;
  const sections = useMemo(() => parseCompletion(completion), [completion]);
  const hasContent = Object.values(sections).some(v => v.length > 0);
  const isLoading = isLoadingResume || isStreamingCache;
  const isValid = selectedTexte && liensStatus[selectedTexte.uid] === 'valide';

  // Footer derived values — memoized to avoid recalculation during streaming renders
  const { selectedLabel, selectedLabelShort } = useMemo(() => {
    if (!selectedUid) return { selectedLabel: '', selectedLabelShort: '' };
    const fromEtape = Object.entries(textesParEtape).flatMap(([code, ts]) =>
      ts.filter(t => t.texteUid === selectedUid).map(t => {
        const step = timelineSteps.find(s => s.code === code);
        const texteData = textesByUid.get(t.texteUid);
        const dateStr = fmtDate(texteData);
        const shortStep = step?.label.replace(/ \(.*\)$/, '') ?? code;
        const labelIncludesStep = t.label.toLowerCase().includes(shortStep.toLowerCase()) || shortStep.toLowerCase().includes(t.label.toLowerCase());
        return {
          selectedLabel: labelIncludesStep
            ? `${t.label}${dateStr ? ` — ${dateStr}` : ''}`
            : `${t.label} (${shortStep})${dateStr ? ` — ${dateStr}` : ''}`,
          selectedLabelShort: t.label,
        };
      })
    )[0];
    if (fromEtape) return fromEtape;
    const name = selectedTexte?.denomination || selectedTexte?.titre_principal_court || 'Texte';
    const dateStr = fmtDate(selectedTexte ?? undefined);
    return {
      selectedLabel: `${name}${dateStr ? ` — ${dateStr}` : ''}`,
      selectedLabelShort: name,
    };
  }, [selectedUid, textesParEtape, timelineSteps, textesByUid, selectedTexte]);

  const vcTextes = useMemo(() => {
    const mappedUids = new Set(Object.values(textesParEtape).flatMap(ts => ts.map(t => t.texteUid)));
    return initialTextes.filter(t => t.uid.endsWith('-VC') && t.lien_texte && !mappedUids.has(t.uid));
  }, [textesParEtape, initialTextes]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* ═══ 1. Bandeau titre ═══ */}
      <div className="rounded-xl px-0 py-4 md:py-6 mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#06B6D4' }}>Dossier LoiClair</span>
        <h1 className="text-xl md:text-2xl font-bold mt-1">{titreDossier || `dossier ${uid}`}</h1>
        <p className="text-xs font-mono mt-1" style={{ opacity: 0.4 }}>{uid}</p>
      </div>

      {/* ═══ 2. Résumé IA — container assistant ═══ */}
      <section className="mb-8">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          <Sparkles className="h-3.5 w-3.5" style={{ color: '#06B6D4' }} />
          Résumé IA
          {isLoading && !error && (
            <span className="text-xs font-normal normal-case tracking-normal ml-2" style={{ opacity: 0.6 }}>
              analyse en cours…
            </span>
          )}
        </h2>

        {/* État : pas de texte sélectionné */}
        {!selectedTexte && (
          <p className="text-muted-foreground">Aucun texte disponible pour ce dossier.</p>
        )}

        {/* Container AI — glowing border, toujours visible quand un texte est sélectionné */}
        {selectedTexte && (
          <div
            className="rounded-2xl"
            style={{
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.4), rgba(6,182,212,0.15) 30%, rgba(6,182,212,0.08) 50%, rgba(6,182,212,0.15) 70%, rgba(6,182,212,0.4))',
              boxShadow: '0 0 20px rgba(6,182,212,0.1), 0 0 40px rgba(6,182,212,0.05)',
            }}
          >
            <div className="rounded-[14px] bg-background px-4 pt-5 pb-5">

              {/* État : lien invalide */}
              {liensStatus[selectedTexte.uid] === 'invalide' && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-3 text-sm text-muted-foreground mb-2" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <p>Ce texte n&apos;est pas encore disponible en ligne. Changez de version ci-dessous.</p>
                </div>
              )}

              {/* État : version consolidée */}
              {liensStatus[selectedTexte.uid] === 'lien-seul' && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-3 text-sm mb-2" style={{ backgroundColor: 'rgba(6,182,212,0.06)' }}>
                  <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#06B6D4' }} />
                  <div>
                    <p className="text-foreground">La version consolidée est consultable directement sur Légifrance.</p>
                    <p className="text-muted-foreground mt-1">Le résumé IA de cette version sera disponible prochainement.</p>
                  </div>
                </div>
              )}

              {/* État : erreur */}
              {error && isValid && (
                <div className="flex items-center gap-3 text-sm mb-2">
                  <p className="text-destructive">Le résumé n&apos;a pas pu être généré.</p>
                  <button
                    onClick={() => {
                      completedForRef.current = null;
                      const t = textesByUid.get(selectedUid!);
                      if (t?.lien_texte) {
                        setCompletion('');
                        complete(JSON.stringify({
                          lien: t.lien_texte,
                          titre_texte: t.titre_principal_court || t.denomination || 'Texte inconnu',
                          texte_uid: selectedUid,
                          contenu_legifrance: t.contenu_legifrance || undefined,
                        }));
                      }
                    }}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Réessayer →
                  </button>
                </div>
              )}

              {/* Contenu AI */}
              {isValid && !error && (
                <div className="space-y-4">
                  {sections.ceQueDit ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{sections.ceQueDit}</p>
                  ) : isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  ) : null}

                  {sections.ceQuiChange ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">Ce qui change</p>
                      <div className="space-y-2.5">
                        {sections.ceQuiChange
                          .split('\n')
                          .map(line => line.replace(/^[-*•]\s*/, '').trim())
                          .filter(line => line.length > 0)
                          .map((line, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm">
                              <div
                                className="flex items-center justify-center rounded-full shrink-0"
                                style={{ width: '26px', height: '26px', backgroundColor: 'rgba(6,182,212,0.12)' }}
                              >
                                <Check className="h-3.5 w-3.5" style={{ color: '#06B6D4' }} />
                              </div>
                              <span className="text-muted-foreground" style={{ lineHeight: '1.6', paddingTop: '3px' }}>{line}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : isLoading && sections.ceQueDit ? (
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-4/6" />
                    </div>
                  ) : null}

                  {sections.aRetenir ? (
                    <div className="rounded-lg px-3.5 py-3" style={{ backgroundColor: 'rgba(6,182,212,0.08)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#06B6D4', opacity: 0.7 }}>À retenir</p>
                      <p className="text-sm font-medium" style={{ color: '#06B6D4' }}>{sections.aRetenir}</p>
                    </div>
                  ) : isLoading && sections.ceQuiChange ? (
                    <div className="rounded-lg px-3.5 py-2.5" style={{ backgroundColor: 'rgba(6,182,212,0.06)' }}>
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : null}

                </div>
              )}

              {/* Footer unique : version du texte + Perplexity */}
              {selectedUid && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderTop: '1px solid var(--color-border)', marginTop: '16px', paddingTop: '12px' }}>
                  {/* Gauche : Perplexity */}
                  {lienTexte && (hasContent || (!isLoading && !error)) ? (
                    <button
                      onClick={() => handleDiscussWithAI(
                        selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
                        lienTexte
                      )}
                      className="inline-flex items-center gap-2 text-sm cursor-pointer"
                      style={{ color: '#D4A54A' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 8.5L22 15.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M22 8.5L2 15.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span style={{
                        backgroundImage: 'linear-gradient(90deg, #D4A54A, #F0C674, #D4A54A)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'shimmer-text 3s ease-in-out infinite',
                      }}>
                        Discuter de ce texte avec l&apos;IA
                      </span>
                    </button>
                  ) : null}
                  {/* Version du texte */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px', maxWidth: '100%' }}>Texte résumé : <span className="text-foreground font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'clamp(140px, 40vw, 400px)' }}>{selectedLabel}</span></span>
                    <span style={{ opacity: 0.3 }}>·</span>
                    {lienTexte && (
                      <>
                        <a href={lienTexte} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          Texte officiel <ExternalLink className="h-3 w-3" />
                        </a>
                        <span style={{ opacity: 0.3 }}>·</span>
                      </>
                    )}
                    <span className="relative inline-block text-primary hover:underline cursor-pointer">
                      Changer
                      <select
                        value={selectedUid || ''}
                        onChange={(e) => handleTimelineSelectTexte(e.target.value)}
                        className="absolute inset-0 cursor-pointer"
                        style={{ opacity: 0, width: '100%', height: '100%' }}
                      >
                        {timelineSteps.filter(s => textesParEtape[s.code]?.some(t => liensStatus[t.texteUid] !== 'invalide')).map(step => {
                          const stepTextes = textesParEtape[step.code]
                            .filter(t => liensStatus[t.texteUid] !== 'invalide')
                            .sort((a, b) => {
                              const da = textesByUid.get(a.texteUid)?.date_creation || textesByUid.get(a.texteUid)?.date_publication || '';
                              const db = textesByUid.get(b.texteUid)?.date_creation || textesByUid.get(b.texteUid)?.date_publication || '';
                              return da.localeCompare(db);
                            });
                          return (
                            <optgroup key={step.code} label={step.label}>
                              {stepTextes.map(t => {
                                const texteData = textesByUid.get(t.texteUid);
                                const dateStr = fmtDate(texteData);
                                return (
                                  <option key={t.texteUid} value={t.texteUid}>
                                    {t.label}{dateStr ? ` — ${dateStr}` : ''}
                                  </option>
                                );
                              })}
                            </optgroup>
                          );
                        })}
                        {vcTextes.length > 0 && (
                          <optgroup label="Version consolidée">
                            {vcTextes.map(t => {
                              const dateStr = fmtDate(t);
                              return (
                                <option key={t.uid} value={t.uid}>
                                  {t.denomination || 'Version consolidée'}{dateStr ? ` — ${dateStr}` : ''}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </select>
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Scrutin */}
        {selectedUid && scrutinsParTexte[selectedUid] && (
          <div className="mt-4">
            <ScrutinResult scrutin={scrutinsParTexte[selectedUid]} />
          </div>
        )}
      </section>

      {/* ═══ 3. À propos de cette loi ═══ */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">À propos de cette loi</h2>
        <div>
          {/* Grille de métadonnées */}
          <div className="grid gap-y-2.5 text-sm" style={{ gridTemplateColumns: 'auto 1fr' }}>
            {statutFinal && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>Statut</span>
                <span>{statutFinal}</span>
              </>
            )}
            {procedureLibelle && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>Procédure</span>
                <span>{DEFINITIONS[procedureLibelle]
                  ? <ProcedureTooltip label={procedureLibelle} description={DEFINITIONS[procedureLibelle]} />
                  : procedureLibelle
                }</span>
              </>
            )}
            {auteurNom && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>Auteur</span>
                <span>{auteurRole && <span className="text-muted-foreground">{auteurRole} </span>}{auteurNom}</span>
              </>
            )}
            {auteurGroupe && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>Groupe</span>
                <span>{auteurGroupe}</span>
              </>
            )}
            {dateDepot && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>Déposé le</span>
                <span>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(dateDepot))}</span>
              </>
            )}
            {(lienAN || lienSenat || lienLegifrance) && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>Sources</span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {lienAN && (
                    <a href={lienAN} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> Assemblée nationale
                    </a>
                  )}
                  {lienSenat && (
                    <a href={lienSenat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> Sénat
                    </a>
                  )}
                  {lienLegifrance && (
                    <a href={lienLegifrance} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> Légifrance
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Lien fil d'actu */}
          <div style={{ marginTop: '12px', paddingTop: '10px' }}>
            <Link href={`/Month?dossier=${uid}`} className="text-xs text-primary hover:underline" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
              Fil d&apos;actu de ce dossier →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 4. Parcours de la loi ═══ */}
      {timelineSteps.length > 0 && (
        <section id="parcours" className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Parcours de la loi</h2>
          <Timeline
            uid={uid}
            steps={timelineSteps}
            statutFinal={statutFinal}
            datePromulgation={datePromulgation}
            dureeTotal={dureeTotal}
            dureeApplication={dureeApplication}
            isAppDirecte={isAppDirecte}
            textesParEtape={textesParEtape}
            selectedTexteUid={selectedUid}
            onSelectTexte={handleTimelineSelectTexte}
            liensStatus={liensStatus}
          />
        </section>
      )}

      {/* ═══ 5. Transparence IA ═══ */}
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
