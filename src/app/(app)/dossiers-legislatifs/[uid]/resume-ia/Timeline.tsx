"use client";

import { useState } from 'react';
import { Check, Flag, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TexteEtape } from './ResumeIAClient';

interface TimelineStep {
  code: string;
  label: string;
  date: string | null;
  done: boolean;
  detail: string | null;
}

interface TimelineProps {
  uid: string;
  steps: TimelineStep[];
  statutFinal: string | null;
  datePromulgation: string | null;
  dureeTotal: number | null;
  dureeApplication: number | null;
  isAppDirecte: boolean;
  textesParEtape?: Record<string, TexteEtape[]>;
  selectedTexteUid?: string | null;
  onSelectTexte?: (texteUid: string) => void;
  liensStatus?: Record<string, string>;
}

const toDateStr = (s: string) => s.slice(0, 10);

function formatDate(iso: string) {
  const d = new Date(toDateStr(iso) + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysBetween(a: string, b: string) {
  const diff = Math.round((new Date(toDateStr(b) + 'T00:00:00').getTime() - new Date(toDateStr(a) + 'T00:00:00').getTime()) / 86400000);
  if (diff > 60) return `${Math.round(diff / 30)} mois`;
  return `${diff} j`;
}

export default function Timeline({ uid, steps, statutFinal, datePromulgation, dureeTotal, dureeApplication, isAppDirecte, textesParEtape, selectedTexteUid, onSelectTexte, liensStatus }: TimelineProps) {
  const today = new Date().toISOString().slice(0, 10);
  const isRejected = statutFinal === 'Rejeté';
  const lastDoneIdx = steps.reduce((acc, s, i) => s.done ? i : acc, -1);
  const hasPendingSteps = steps.some(s => !s.done);
  const isOngoing = !datePromulgation && !isRejected;
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Trouver l'étape qui contient le texte sélectionné
  const stepWithSelected = textesParEtape && selectedTexteUid
    ? Object.entries(textesParEtape).find(([, textes]) => textes.some(t => t.texteUid === selectedTexteUid))?.[0]
    : null;

  return (
    <>
      <div className="flex flex-col gap-0 mt-1">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const isLastDone = i === lastDoneIdx;
          const nextStep = !isLast ? steps[i + 1] : null;
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

          const stepTextes = textesParEtape?.[step.code] ?? [];
          const validTextes = stepTextes.filter(t => liensStatus?.[t.texteUid] !== 'invalide');
          const hasTextes = validTextes.length > 0;
          const isStepActive = stepWithSelected === step.code;
          const isExpanded = expandedStep === step.code;

          const handleStepClick = () => {
            if (!hasTextes || !onSelectTexte) return;
            setExpandedStep(isExpanded ? null : step.code);
          };

          return (
            <div key={step.code} className="flex gap-3">
              {/* Colonne gauche : point + ligne */}
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
              <div className="flex flex-col flex-1" style={{ paddingBottom: isLast ? 0 : '8px' }}>
                <div
                  className={cn(
                    "flex items-baseline gap-2",
                    hasTextes && "cursor-pointer"
                  )}
                  onClick={handleStepClick}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    step.done ? 'text-foreground' : 'text-muted-foreground',
                    isStepActive && 'font-semibold'
                  )}>
                    {step.label}
                  </span>
                  {hasTextes && (
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                      style={{ transition: 'transform 0.2s ease', marginBottom: '-1px' }}
                    />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {step.date ? formatDate(step.date) : step.done ? '' : 'en attente'}
                  </span>
                </div>

                {/* Zone d'expansion accordéon : liste des textes */}
                {isExpanded && validTextes.length >= 1 && (
                  <div className="mt-1.5 mb-1 rounded-md space-y-0.5" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)', padding: '6px' }}>
                    {validTextes.map(t => (
                      <button
                        key={t.texteUid}
                        onClick={() => {
                          onSelectTexte?.(t.texteUid);
                          setExpandedStep(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md transition-colors w-full text-left",
                          selectedTexteUid === t.texteUid
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        style={selectedTexteUid === t.texteUid ? { backgroundColor: 'hsl(var(--primary) / 0.1)' } : undefined}
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="flex-1">{t.label}</span>
                        {selectedTexteUid === t.texteUid && (
                          <Check className="h-3 w-3 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}

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
                        en cours depuis {daysBetween(step.date, today)}
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
    </>
  );
}
