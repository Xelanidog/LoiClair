import { getStatusBadgeClass } from '@/lib/statusMapping';
import type { ScrutinData } from './ResumeIAClient';

const TOTAL_DEPUTES = 577;

export default function ScrutinResult({ scrutin }: { scrutin: ScrutinData }) {
  const resultLower = scrutin.sortLibelle.toLowerCase();
  const isRejected = resultLower.includes('rejet') || resultLower.includes("n'a pas adopt") || resultLower.includes('pas adopté');
  const isAdopted = !isRejected && resultLower.includes('adopt');
  const absents = Math.max(TOTAL_DEPUTES - scrutin.votants - scrutin.nonVotants, 0);
  const dateStr = scrutin.date ? new Date(scrutin.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : null;
  const majorityPct = scrutin.suffragesRequis > 0 ? (scrutin.suffragesRequis / TOTAL_DEPUTES) * 100 : 0;

  return (
    <div className="mb-6 rounded-lg border px-4 py-3 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(isAdopted ? 'Adopté' : isRejected ? 'Rejeté' : null)}`}>
          {isAdopted ? 'Adopté' : isRejected ? 'Rejeté' : 'Vote'}
        </span>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="relative flex-1 h-2 rounded-full overflow-hidden isolate" style={{ display: 'flex', backgroundColor: 'var(--color-muted)' }}>
            <div style={{ width: `${(scrutin.pour / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#27AE60', minWidth: scrutin.pour > 0 ? '2px' : '0' }} className="h-full" />
            <div style={{ width: `${(scrutin.contre / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#E74C3C', minWidth: scrutin.contre > 0 ? '2px' : '0' }} className="h-full" />
            <div style={{ width: `${(scrutin.abstentions / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#A8A29E', minWidth: scrutin.abstentions > 0 ? '2px' : '0' }} className="h-full" />
            <div style={{ width: `${(scrutin.nonVotants / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#F39C12', minWidth: scrutin.nonVotants > 0 ? '2px' : '0' }} className="h-full" />
            <div style={{ width: `${(absents / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#F0EDEA' }} className="h-full dark:hidden" />
            <div style={{ width: `${(absents / TOTAL_DEPUTES) * 100}%`, backgroundColor: '#44403C' }} className="h-full hidden dark:block" />
            {majorityPct > 0 && (
              <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${majorityPct}%` }} title={`Majorité requise : ${scrutin.suffragesRequis}`} />
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0 font-medium">
            {scrutin.pour}–{scrutin.contre}–{scrutin.abstentions}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#27AE60' }} />Pour : {scrutin.pour}</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#E74C3C' }} />Contre : {scrutin.contre}</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#A8A29E' }} />Abstentions : {scrutin.abstentions}</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#F39C12' }} />Non-votants : {scrutin.nonVotants}</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0 bg-[#F0EDEA] dark:bg-[#44403C]" />Absents : {absents}</div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {scrutin.type && <span className="capitalize">{scrutin.type}</span>}
        {scrutin.type && dateStr && <span>·</span>}
        {dateStr && <span>{dateStr}</span>}
        <span>·</span>
        <span>{scrutin.votants} votants sur 577</span>
        {scrutin.suffragesRequis > 0 && (
          <>
            <span>·</span>
            <span>Majorité requise : {scrutin.suffragesRequis} voix</span>
          </>
        )}
      </div>
    </div>
  );
}
