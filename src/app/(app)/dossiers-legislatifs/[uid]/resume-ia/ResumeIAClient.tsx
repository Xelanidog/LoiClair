"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, ChevronDown, Bot, Sparkles, Check } from "lucide-react";
import Link from 'next/link';
import { SYSTEM_PROMPT_RESUME_LOI, SYSTEM_PROMPT_RESUME_LOI_EN, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts';
import { useCompletion } from '@ai-sdk/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useLocale } from 'next-intl';
import ProcedureTooltip from '@/components/ProcedureTooltip';
import { getDefinition } from '@/lib/definitions';
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

// Pre-compiled regexes for section extraction — supports both FR and EN headers
const RE_TRAILING_HEADER = /\n#{2}[^\n]*$/;
const SECTION_REGEXES_FR = {
  ceQueDit:    /## Ce que dit ce texte([\s\S]*?)(?=## |$)/,
  ceQuiChange: /## Ce qui change concrètement([\s\S]*?)(?=## |$)/,
  aRetenir:    /## À retenir([\s\S]*?)(?=## |$)/,
} as const;
const SECTION_REGEXES_EN = {
  ceQueDit:    /## What this text says([\s\S]*?)(?=## |$)/,
  ceQuiChange: /## What concretely changes([\s\S]*?)(?=## |$)/,
  aRetenir:    /## Key takeaway([\s\S]*?)(?=## |$)/,
} as const;

function parseCompletion(text: string, locale: string, isStreaming = false): Record<string, string> {
  // Only strip trailing partial headers when not streaming — during streaming it causes flicker
  const cleaned = isStreaming ? text : text.replace(RE_TRAILING_HEADER, '');
  const regexes = locale === 'en' ? SECTION_REGEXES_EN : SECTION_REGEXES_FR;
  return {
    ceQueDit:    cleaned.match(regexes.ceQueDit)?.[1]?.trim() || '',
    ceQuiChange: cleaned.match(regexes.ceQuiChange)?.[1]?.trim() || '',
    aRetenir:    cleaned.match(regexes.aRetenir)?.[1]?.trim() || '',
  };
}

export default function ResumeIAClient({ uid, titreDossier, initialTextes, statutFinal, procedureLibelle, dateDepot, datePromulgation, lienAN, lienSenat, lienLegifrance, dureeTotal, dureeApplication, isAppDirecte, auteurNom, auteurRole, auteurGroupe, timelineSteps, textesParEtape, scrutinsParTexte, defaultTexteUid, cachedResumes }: ResumeIAClientProps) {
  const tDef = useTranslations('definitions');
  const t = useTranslations('resumeIA');
  const locale = useLocale();

  const [selectedUid, setSelectedUid] = useState<string | null>(defaultTexteUid);
  const liensStatus = useMemo(() => {
    const result: Record<string, 'valide' | 'invalide' | 'lien-seul'> = {};
    for (const tx of initialTextes) {
      if (tx.uid.endsWith('-VC') && !tx.contenu_legifrance && tx.lien_texte) {
        result[tx.uid] = 'lien-seul';
      } else {
        result[tx.uid] = (tx.contenu_legifrance || (tx.url_accessible === true && tx.lien_texte)) ? 'valide' : 'invalide';
      }
    }
    return result;
  }, [initialTextes]);

  const textesByUid = useMemo(() => new Map(initialTextes.map(tx => [tx.uid, tx])), [initialTextes]);

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

  const fmtDate = (tx: Texte | undefined): string => {
    const raw = tx?.date_creation || tx?.date_publication;
    return raw ? new Date(raw).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  };

  const handleDiscussWithAI = (titre: string, lien: string) => {
    const promptKey = locale === 'en' ? 'perplexityPromptEn' : 'perplexityPromptFr';
    const prompt = t(promptKey, { title: titre, link: lien });
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
      titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || t('unknownText'),
      texte_uid: selectedUid,
      contenu_legifrance: selectedTexte.contenu_legifrance || undefined,
      locale,
    }));
    return () => { completedForRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid, initialTextes, liensStatus, cachedResumes, locale]);

  const selectedTexte = selectedUid ? textesByUid.get(selectedUid) ?? null : null;
  const lienTexte = selectedTexte?.lien_texte ?? null;
  const isLoading = isLoadingResume || isStreamingCache;
  const sections = useMemo(() => parseCompletion(completion, locale, isLoading), [completion, locale, isLoading]);
  const hasContent = Object.values(sections).some(v => v.length > 0);
  const isValid = selectedTexte && liensStatus[selectedTexte.uid] === 'valide';

  // Footer derived values — memoized to avoid recalculation during streaming renders
  const { selectedLabel, selectedLabelShort } = useMemo(() => {
    if (!selectedUid) return { selectedLabel: '', selectedLabelShort: '' };
    const fromEtape = Object.entries(textesParEtape).flatMap(([code, ts]) =>
      ts.filter(tx => tx.texteUid === selectedUid).map(tx => {
        const stepItem = timelineSteps.find(s => s.code === code);
        const texteData = textesByUid.get(tx.texteUid);
        const dateStr = fmtDate(texteData);
        const shortStep = stepItem?.label.replace(/ \(.*\)$/, '') ?? code;
        const labelIncludesStep = tx.label.toLowerCase().includes(shortStep.toLowerCase()) || shortStep.toLowerCase().includes(tx.label.toLowerCase());
        return {
          selectedLabel: labelIncludesStep
            ? `${tx.label}${dateStr ? ` — ${dateStr}` : ''}`
            : `${tx.label} (${shortStep})${dateStr ? ` — ${dateStr}` : ''}`,
          selectedLabelShort: tx.label,
        };
      })
    )[0];
    if (fromEtape) return fromEtape;
    const name = selectedTexte?.denomination || selectedTexte?.titre_principal_court || t('text');
    const dateStr = fmtDate(selectedTexte ?? undefined);
    return {
      selectedLabel: `${name}${dateStr ? ` — ${dateStr}` : ''}`,
      selectedLabelShort: name,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid, textesParEtape, timelineSteps, textesByUid, selectedTexte, locale]);

  const vcTextes = useMemo(() => {
    const mappedUids = new Set(Object.values(textesParEtape).flatMap(ts => ts.map(tx => tx.texteUid)));
    return initialTextes.filter(tx => tx.uid.endsWith('-VC') && tx.lien_texte && !mappedUids.has(tx.uid));
  }, [textesParEtape, initialTextes]);

  // Pick the right system prompt to display based on locale
  const displayedSystemPrompt = locale === 'en' ? SYSTEM_PROMPT_RESUME_LOI_EN : SYSTEM_PROMPT_RESUME_LOI;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* ═══ 1. Bandeau titre ═══ */}
      <div className="rounded-xl px-0 pt-0 pb-4 md:pb-6 mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#06B6D4' }}>{t('dossierLabel')}</span>
        <h1 className="text-lg md:text-xl font-bold mt-1">{titreDossier || `dossier ${uid}`}</h1>
        <p className="text-xs font-mono mt-1" style={{ opacity: 0.4 }}>{uid}</p>
      </div>

      {/* ═══ 2. Résumé IA — container assistant ═══ */}
      <section className="mb-8">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          <Sparkles className="h-3.5 w-3.5" style={{ color: '#06B6D4' }} />
          {t('aiSummary')}
          {isLoading && !error && (
            <span className="text-xs font-normal normal-case tracking-normal ml-2" style={{ opacity: 0.6 }}>
              {t('analyzing')}
            </span>
          )}
        </h2>

        {/* État : pas de texte sélectionné */}
        {!selectedTexte && (
          <p className="text-muted-foreground">{t('noTextAvailable')}</p>
        )}

        {/* Container AI — glowing border animé, toujours visible quand un texte est sélectionné */}
        {selectedTexte && (
          <GlowBorder>
            <div className="bg-background px-4 pt-5 pb-5" style={{ borderRadius: '15px' }}>

              {/* État : lien invalide */}
              {liensStatus[selectedTexte.uid] === 'invalide' && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-3 text-sm text-muted-foreground mb-2" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <p>{t('textNotAvailable')}</p>
                </div>
              )}

              {/* État : version consolidée */}
              {liensStatus[selectedTexte.uid] === 'lien-seul' && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-3 text-sm mb-2" style={{ backgroundColor: 'rgba(6,182,212,0.06)' }}>
                  <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#06B6D4' }} />
                  <div>
                    <p className="text-foreground">{t('consolidatedOnLegifrance')}</p>
                    <p className="text-muted-foreground mt-1">{t('aiSummaryComingSoon')}</p>
                  </div>
                </div>
              )}

              {/* État : erreur */}
              {error && isValid && (
                <div className="flex items-center gap-3 text-sm mb-2">
                  <p className="text-destructive">{t('generationFailed')}</p>
                  <button
                    onClick={() => {
                      completedForRef.current = null;
                      const tx = textesByUid.get(selectedUid!);
                      if (tx?.lien_texte) {
                        setCompletion('');
                        complete(JSON.stringify({
                          lien: tx.lien_texte,
                          titre_texte: tx.titre_principal_court || tx.denomination || t('unknownText'),
                          texte_uid: selectedUid,
                          contenu_legifrance: tx.contenu_legifrance || undefined,
                          locale,
                        }));
                      }
                    }}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    {t('retry')}
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">{t('whatChanges')}</p>
                      <div className="space-y-2.5">
                        {sections.ceQuiChange
                          .split('\n')
                          .map(line => line.replace(/^[-*•]\s*/, '').trim())
                          .filter(line => line.length > 0)
                          .map((line, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
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
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#06B6D4', opacity: 0.7 }}>{t('keyTakeaway')}</p>
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
                        selectedTexte.titre_principal_court || selectedTexte.denomination || t('unknownText'),
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
                        {t('discussWithAI')}
                      </span>
                    </button>
                  ) : null}
                  {/* Version du texte */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px', maxWidth: '100%' }}>{t('summarizedText')} <span className="text-foreground font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'clamp(140px, 40vw, 400px)' }}>{selectedLabel}</span></span>
                    <span style={{ opacity: 0.3 }}>·</span>
                    {lienTexte && (
                      <>
                        <a href={lienTexte} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          {t('officialText')} <ExternalLink className="h-3 w-3" />
                        </a>
                        <span style={{ opacity: 0.3 }}>·</span>
                      </>
                    )}
                    <span className="relative inline-block text-primary hover:underline cursor-pointer">
                      {t('changeVersion')}
                      <select
                        value={selectedUid || ''}
                        onChange={(e) => handleTimelineSelectTexte(e.target.value)}
                        className="absolute inset-0 cursor-pointer"
                        style={{ opacity: 0, width: '100%', height: '100%' }}
                      >
                        {timelineSteps.filter(s => textesParEtape[s.code]?.some(tx => liensStatus[tx.texteUid] !== 'invalide')).map(stepItem => {
                          const stepTextes = textesParEtape[stepItem.code]
                            .filter(tx => liensStatus[tx.texteUid] !== 'invalide')
                            .sort((a, b) => {
                              const da = textesByUid.get(a.texteUid)?.date_creation || textesByUid.get(a.texteUid)?.date_publication || '';
                              const db = textesByUid.get(b.texteUid)?.date_creation || textesByUid.get(b.texteUid)?.date_publication || '';
                              return da.localeCompare(db);
                            });
                          return (
                            <optgroup key={stepItem.code} label={stepItem.label}>
                              {stepTextes.map(tx => {
                                const texteData = textesByUid.get(tx.texteUid);
                                const dateStr = fmtDate(texteData);
                                return (
                                  <option key={tx.texteUid} value={tx.texteUid}>
                                    {tx.label}{dateStr ? ` — ${dateStr}` : ''}
                                  </option>
                                );
                              })}
                            </optgroup>
                          );
                        })}
                        {vcTextes.length > 0 && (
                          <optgroup label={t('consolidatedVersion')}>
                            {vcTextes.map(tx => {
                              const dateStr = fmtDate(tx);
                              return (
                                <option key={tx.uid} value={tx.uid}>
                                  {tx.denomination || t('consolidatedVersion')}{dateStr ? ` — ${dateStr}` : ''}
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
          </GlowBorder>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t('aboutThisLaw')}</h2>
        <div>
          {/* Grille de métadonnées */}
          <div className="grid gap-y-2.5 text-sm" style={{ gridTemplateColumns: 'auto 1fr' }}>
            {statutFinal && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>{t('labelStatus')}</span>
                <span>{statutFinal}</span>
              </>
            )}
            {procedureLibelle && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>{t('labelProcedure')}</span>
                <span>{(() => {
                  const def = getDefinition(procedureLibelle, tDef);
                  return def
                    ? <ProcedureTooltip label={def.term} description={def.definition} />
                    : procedureLibelle;
                })()}</span>
              </>
            )}
            {auteurNom && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>{t('labelAuthor')}</span>
                <span>{auteurRole && <span className="text-muted-foreground">{auteurRole} </span>}{auteurNom}</span>
              </>
            )}
            {auteurGroupe && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>{t('labelGroup')}</span>
                <span>{auteurGroupe}</span>
              </>
            )}
            {dateDepot && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>{t('labelFiledOn')}</span>
                <span>{new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(dateDepot))}</span>
              </>
            )}
            {(lienAN || lienSenat || lienLegifrance) && (
              <>
                <span className="text-muted-foreground text-xs font-medium pr-4" style={{ paddingTop: '2px' }}>{t('labelSources')}</span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {lienAN && (
                    <a href={lienAN} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> {t('assemblee')}
                    </a>
                  )}
                  {lienSenat && (
                    <a href={lienSenat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> {t('senat')}
                    </a>
                  )}
                  {lienLegifrance && (
                    <a href={lienLegifrance} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> {t('legifrance')}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Lien fil d'actu */}
          <div style={{ marginTop: '12px', paddingTop: '10px' }}>
            <Link href={`/Month?dossier=${uid}`} className="text-xs text-primary hover:underline" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
              {t('dossierFeed')}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 4. Parcours de la loi ═══ */}
      {timelineSteps.length > 0 && (
        <section id="parcours" className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{t('lawJourney')}</h2>
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
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('aiGenerated')}</span>
          <a href="/documentation/conformite-ia" className="text-xs text-primary hover:underline ml-1">
            {t('aiActCompliance')}
          </a>
        </div>

        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none select-none">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            {t('generationParams')}
          </summary>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border overflow-hidden text-sm">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30 w-1/3">{t('labelModel')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{MODEL_RESUME_LOI}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">{t('labelProvider')}</td>
                    <td className="px-4 py-2.5">xAI (Grok)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">{t('labelTemperature')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{PARAMS_RESUME_LOI.temperature} <span className="text-muted-foreground font-sans">{t('tempScale')}</span></td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">{t('labelMaxTokens')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{PARAMS_RESUME_LOI.maxTokens}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-muted-foreground font-medium bg-muted/30">{t('labelMaxChars')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{MAX_INPUT_CHARS_RESUME_LOI.toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR')} <span className="text-muted-foreground font-sans">{t('approxTokens', { count: Math.round(MAX_INPUT_CHARS_RESUME_LOI / 4).toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR') })}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">{t('systemPromptLabel')}</p>
              <pre className="text-xs bg-muted/40 border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {displayedSystemPrompt.trim()}
              </pre>
            </div>
          </div>
        </details>
      </div>

    </div>
  );
}

/** Bordure dorée avec glow pulsant autour de la carte résumé IA */
function GlowBorder({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t0 = performance.now();
    let id: number;
    const run = (t: number) => {
      const pulse = 0.5 + 0.5 * Math.sin((t - t0) / 2000); // cycle ~12s
      const a = (0.02 + pulse * 0.06).toFixed(3);
      const b = (0.01 + pulse * 0.03).toFixed(3);
      el.style.boxShadow = `0 0 24px rgba(218,165,32,${a}), 0 0 48px rgba(218,165,32,${b})`;
      id = requestAnimationFrame(run);
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        padding: '1px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(218,165,32,0.3), rgba(218,165,32,0.04) 30%, rgba(218,165,32,0.04) 70%, rgba(218,165,32,0.3))',
      }}
    >
      {children}
    </div>
  );
}
