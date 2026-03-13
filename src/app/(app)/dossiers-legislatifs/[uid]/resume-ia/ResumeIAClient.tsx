"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { HelpCircle, ListChecks, TrendingUp, ExternalLink, ChevronDown, Bot, Sparkles } from "lucide-react";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { SYSTEM_PROMPT_RESUME_LOI, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts';
import { useCompletion } from '@ai-sdk/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const CARDS = [
  { key: 'pourquoi',    Icon: HelpCircle,  title: 'Pourquoi cette loi ?' },
  { key: 'changements', Icon: ListChecks,  title: 'Changements clés' },
  { key: 'impact',      Icon: TrendingUp,  title: 'Impact attendu' },
] as const;

function parseCompletion(text: string): Record<string, string> {
  const cleaned = text.replace(/\n#{2}[^\n]*$/, '');
  const extract = (header: string) => {
    const match = cleaned.match(new RegExp(`## ${header}([\\s\\S]*?)(?=## |$)`));
    return match?.[1]?.trim() || '';
  };
  return {
    enBref:      extract('En bref'),
    pourquoi:    extract('Pourquoi cette loi \\?'),
    changements: extract('Changements clés'),
    impact:      extract('Impact attendu'),
  };
}

export default function ResumeIAClient({ uid, titreDossier, initialTextes, statutFinal, procedureLibelle, dateDepot, datePromulgation, lienAN, lienSenat, lienLegifrance, dureeTotal, dureeApplication, isAppDirecte, auteurNom, auteurRole, auteurGroupe, timelineSteps, textesParEtape, scrutinsParTexte, defaultTexteUid, cachedResumes }: ResumeIAClientProps) {
  const textes = initialTextes;
  const [selectedUid, setSelectedUid] = useState<string | null>(defaultTexteUid);
  const [openSection, setOpenSection] = useState<string | null>('pourquoi');
  const liensStatus = useMemo(() =>
    initialTextes.reduce((acc, t) => {
      if (t.uid.endsWith('-VC') && !t.contenu_legifrance && t.lien_texte) {
        return { ...acc, [t.uid]: 'lien-seul' as const };
      }
      return {
        ...acc,
        [t.uid]: (t.contenu_legifrance || (t.url_accessible === true && t.lien_texte)) ? 'valide' : 'invalide',
      };
    }, {} as Record<string, 'valide' | 'invalide' | 'lien-seul'>)
  , [initialTextes]);

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

    const selectedTexte = textes.find(t => t.uid === selectedUid);
    if (!selectedTexte?.lien_texte && !selectedTexte?.contenu_legifrance) return;

    complete(JSON.stringify({
      lien: selectedTexte.lien_texte,
      titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
      texte_uid: selectedUid,
      contenu_legifrance: selectedTexte.contenu_legifrance || undefined,
    }));
    return () => { completedForRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid, textes, liensStatus, cachedResumes]);

  const selectedTexte = selectedUid ? textes.find((t) => t.uid === selectedUid) : null;
  const sections = useMemo(() => parseCompletion(completion), [completion]);
  const hasContent = Object.values(sections).some(v => v.length > 0);
  const isLoading = isLoadingResume || isStreamingCache;
  const isValid = selectedTexte && liensStatus[selectedTexte.uid] === 'valide';

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* ═══ 1. Bandeau titre ═══ */}
      <div className="rounded-xl px-0 py-4 md:py-6 mb-6" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), transparent)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--primary))' }}>Dossier LoiClair</span>
        <h1 className="text-xl md:text-2xl font-bold mt-1">{titreDossier || `dossier ${uid}`}</h1>
        <p className="text-xs font-mono mt-1" style={{ opacity: 0.4 }}>{uid}</p>
      </div>

      {/* ═══ 1b. Texte sélectionné ═══ */}
      {Object.keys(textesParEtape).length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Texte sélectionné</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedUid || undefined} onValueChange={(val) => handleTimelineSelectTexte(val)}>
              <SelectTrigger size="sm" className="text-xs" style={{ maxWidth: '340px' }}>
                <SelectValue placeholder="Choisir un texte…" />
              </SelectTrigger>
              <SelectContent>
                {timelineSteps.filter(s => textesParEtape[s.code]?.some(t => liensStatus[t.texteUid] !== 'invalide')).map(step => {
                  const stepTextes = textesParEtape[step.code]
                    .filter(t => liensStatus[t.texteUid] !== 'invalide')
                    .sort((a, b) => {
                      const da = textes.find(x => x.uid === a.texteUid)?.date_creation || '';
                      const db = textes.find(x => x.uid === b.texteUid)?.date_creation || '';
                      return da.localeCompare(db);
                    });
                  return (
                    <SelectGroup key={step.code}>
                      <SelectLabel>{step.label}</SelectLabel>
                      {stepTextes.map(t => {
                        const texteData = textes.find(x => x.uid === t.texteUid);
                        const dateStr = texteData?.date_creation ? new Date(texteData.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                        const shortStep = step.label.replace(/ \(.*\)$/, '');
                        return (
                          <SelectItem key={t.texteUid} value={t.texteUid} className="text-xs">
                            {t.label} ({shortStep}){dateStr ? ` — ${dateStr}` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedTexte?.lien_texte && (
              <a href={selectedTexte.lien_texte} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                Lire le texte <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* ═══ 2. Résumé IA — section héroïque ═══ */}
      <section className="mb-8">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          <Sparkles className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
          Résumé IA
          <span className={cn("text-xs font-normal normal-case tracking-normal transition-opacity duration-300 ml-2", isLoading && !error ? "opacity-100" : "opacity-0")}>
            Génération en cours…
          </span>
        </h2>

        {/* État : pas de texte sélectionné */}
        {!selectedTexte && (
          <p className="text-muted-foreground">Aucun texte disponible pour ce dossier.</p>
        )}

        {/* État : lien invalide */}
        {selectedTexte && liensStatus[selectedTexte.uid] === 'invalide' && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <p>Ce texte n&apos;est pas encore disponible en ligne. Sélectionnez un autre texte depuis le parcours ci-dessous.</p>
          </div>
        )}

        {/* État : version consolidée */}
        {selectedTexte && liensStatus[selectedTexte.uid] === 'lien-seul' && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="text-foreground">La version consolidée est consultable directement sur Légifrance.</p>
              <p className="text-muted-foreground mt-1">Le résumé IA de cette version sera disponible prochainement.</p>
            </div>
          </div>
        )}

        {/* État : erreur */}
        {error && (
          <div className="flex items-center gap-3 text-sm mb-4">
            <p className="text-destructive">Le résumé n&apos;a pas pu être généré (source inaccessible ou mauvaise connexion).</p>
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


        {/* En bref */}
        {isValid && !error && (
          <>
            {sections.enBref ? (
              <div className="mb-6">
                <p className="text-base font-medium leading-relaxed">{sections.enBref}</p>
              </div>
            ) : isLoading ? (
              <div className="mb-6 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : null}

            {/* Accordéon mobile / Grid desktop pour les 3 sections */}
            {/* Mobile : accordéon */}
            <div className="md:hidden space-y-2">
              {CARDS.map(({ key, Icon, title }) => {
                const isOpen = openSection === key;
                return (
                  <div key={key} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenSection(isOpen ? null : key)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-left"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium flex-1">{title}</span>
                      <ChevronDown
                        className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm prose prose-sm max-w-none dark:prose-invert">
                        {sections[key] ? (
                          <ReactMarkdown>{sections[key]}</ReactMarkdown>
                        ) : isLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                            <Skeleton className="h-3 w-4/6" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop : grid 3 colonnes */}
            <div className="max-md:hidden grid grid-cols-3 gap-4">
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
                    ) : isLoading ? (
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
          </>
        )}

        {/* Scrutin */}
        {selectedUid && scrutinsParTexte[selectedUid] && (
          <div className="mt-6">
            <ScrutinResult scrutin={scrutinsParTexte[selectedUid]} />
          </div>
        )}

        {/* Bouton Perplexity */}
        {selectedTexte && selectedTexte.lien_texte && (hasContent || (!isLoading && !error)) && isValid && (
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
      </section>

      {/* ═══ 3. À propos de cette loi ═══ */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">À propos de cette loi</h2>
        <div className="rounded-xl px-0 py-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent)' }}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
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
          </div>
          <p className="text-sm text-muted-foreground">
            {auteurNom && <>{auteurRole && <span className="text-xs font-medium">{auteurRole} </span>}{auteurNom}</>}
            {auteurGroupe && <span className="text-xs ml-1">({auteurGroupe})</span>}
            {auteurNom && dateDepot && <span className="mx-1.5 text-border">·</span>}
            {dateDepot && <>Déposé le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(dateDepot))}</>}
          </p>
          {(lienAN || lienSenat || lienLegifrance) && (
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              <span className="uppercase tracking-wide font-medium" style={{ opacity: 0.4 }}>Sources officielles</span>
              {lienAN && (
                <a href={lienAN} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" /> AN
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
          )}
          <Link href={`/Month?dossier=${uid}`} className="text-xs text-primary hover:underline mt-2 inline-block">
            Fil d&apos;actu de ce dossier →
          </Link>
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
