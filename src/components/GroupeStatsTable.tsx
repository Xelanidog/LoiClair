'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

type GroupeStat = {
  groupe: string;
  chambre: string;
  total: number;
  total_an: number;
  total_sn: number;
  total_promulgables: number;
  promulgues: number;
  adoptes_an: number;
  adoptes_sn: number;
};

type SortCol = 'groupe' | 'pctAN' | 'pctSN' | 'pctP';
type SortDir = 'asc' | 'desc';

function pct(num: number, den: number) {
  return den > 0 ? num / den : 0;
}

export function GroupeStatsTable({ data }: { data: GroupeStat[] }) {
  const [sortCol, setSortCol] = useState<SortCol>('pctP');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sections = useMemo(() => {
    const sorter = (a: GroupeStat, b: GroupeStat) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortCol === 'groupe')       { va = a.groupe; vb = b.groupe; }
      else if (sortCol === 'pctAN')   { va = pct(a.adoptes_an, a.total_an); vb = pct(b.adoptes_an, b.total_an); }
      else if (sortCol === 'pctSN')   { va = pct(a.adoptes_sn, a.total_sn); vb = pct(b.adoptes_sn, b.total_sn); }
      else                            { va = pct(a.promulgues, a.total_promulgables); vb = pct(b.promulgues, b.total_promulgables); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    };
    const by = (chambre: string) => data.filter(g => g.chambre === chambre).sort(sorter);
    return {
      AN:    by('AN'),
      Senat: by('Sénat'),
      Gouv:  by('Gouvernement'),
      Autre: data.filter(g => !['AN', 'Sénat', 'Gouvernement'].includes(g.chambre)).sort(sorter),
    };
  }, [data, sortCol, sortDir]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const Arrow = ({ col }: { col: SortCol }) =>
    sortCol === col
      ? <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
      : <span className="ml-1 opacity-25">↕</span>;

  const thBtn = (col: SortCol, label: string, align: 'left' | 'right' = 'right') => (
    <th className={`px-4 py-1.5 font-medium text-${align}`}>
      <button
        onClick={() => handleSort(col)}
        className={`flex items-center gap-0.5 hover:text-foreground transition-colors ${align === 'right' ? 'ml-auto' : ''}`}
      >
        {label}<Arrow col={col} />
      </button>
    </th>
  );

  const renderRow = (g: GroupeStat, i: number) => {
    const pctAN = Math.round(pct(g.adoptes_an, g.total_an) * 1000) / 10;
    const pctSN = Math.round(pct(g.adoptes_sn, g.total_sn) * 1000) / 10;
    const pctP  = Math.round(pct(g.promulgues,  g.total_promulgables) * 1000) / 10;
    return (
      <tr key={`${g.chambre}-${g.groupe}-${i}`} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
        <td className="px-4 py-3 font-medium">{g.groupe}</td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className="font-semibold text-primary">{pctAN} %</span>
          <br /><span className="text-xs text-muted-foreground">{g.adoptes_an} / {g.total_an}</span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className="font-semibold text-[#F39C12]">{pctSN} %</span>
          <br /><span className="text-xs text-muted-foreground">{g.adoptes_sn} / {g.total_sn}</span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className="font-semibold text-violet-600">{pctP} %</span>
          <br /><span className="text-xs text-muted-foreground">{g.promulgues} / {g.total_promulgables}</span>
        </td>
      </tr>
    );
  };

  const SectionHeader = ({ label, count, itemLabel = 'groupe' }: { label: string; count: number; itemLabel?: string }) => (
    <tr>
      <td colSpan={4} className="px-4 py-1.5 bg-muted font-semibold text-xs uppercase tracking-wider border-y">
        {label}{' '}
        <span className="font-normal text-muted-foreground normal-case tracking-normal">({count} {itemLabel}{count > 1 ? 's' : ''})</span>
      </td>
    </tr>
  );

  const renderTotalRow = (rows: GroupeStat[], label: string) => {
    const tot = rows.reduce((acc, g) => ({
      total_an: acc.total_an + g.total_an,
      total_sn: acc.total_sn + g.total_sn,
      total_promulgables: acc.total_promulgables + g.total_promulgables,
      promulgues: acc.promulgues + g.promulgues,
      adoptes_an: acc.adoptes_an + g.adoptes_an,
      adoptes_sn: acc.adoptes_sn + g.adoptes_sn,
    }), { total_an: 0, total_sn: 0, total_promulgables: 0, promulgues: 0, adoptes_an: 0, adoptes_sn: 0 });
    const pctAN = Math.round(pct(tot.adoptes_an, tot.total_an) * 1000) / 10;
    const pctSN = Math.round(pct(tot.adoptes_sn, tot.total_sn) * 1000) / 10;
    const pctP  = Math.round(pct(tot.promulgues, tot.total_promulgables) * 1000) / 10;
    return (
      <tr key="total-gouv" className="bg-muted/50 border-t-2 font-semibold">
        <td className="px-4 py-3 italic text-muted-foreground">{label}</td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className="font-semibold text-primary">{pctAN} %</span>
          <br /><span className="text-xs text-muted-foreground">{tot.adoptes_an} / {tot.total_an}</span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className="font-semibold text-[#F39C12]">{pctSN} %</span>
          <br /><span className="text-xs text-muted-foreground">{tot.adoptes_sn} / {tot.total_sn}</span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className="font-semibold text-violet-600">{pctP} %</span>
          <br /><span className="text-xs text-muted-foreground">{tot.promulgues} / {tot.total_promulgables}</span>
        </td>
      </tr>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                {thBtn('groupe', 'Groupe politique', 'left')}
                {thBtn('pctAN', '% Adoption AN')}
                {thBtn('pctSN', '% Adoption Sénat')}
                {thBtn('pctP',  '% Promulgation')}
              </tr>
            </thead>
            <tbody>
              {sections.AN.length > 0 && (
                <>
                  <SectionHeader label="Assemblée Nationale" count={sections.AN.length} />
                  {sections.AN.map(renderRow)}
                </>
              )}
              {sections.Senat.length > 0 && (
                <>
                  <SectionHeader label="Sénat" count={sections.Senat.length} />
                  {sections.Senat.map(renderRow)}
                </>
              )}
              {sections.Gouv.length === 1 && (() => {
                const g = sections.Gouv[0];
                const pctAN = Math.round(pct(g.adoptes_an, g.total_an) * 1000) / 10;
                const pctSN = Math.round(pct(g.adoptes_sn, g.total_sn) * 1000) / 10;
                const pctP  = Math.round(pct(g.promulgues,  g.total_promulgables) * 1000) / 10;
                return (
                  <tr key="gouv-single" className="bg-muted border-y">
                    <td className="px-4 py-1.5 font-semibold text-xs uppercase tracking-wider">Gouvernement</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      <span className="font-semibold text-primary">{pctAN} %</span>
                      <br /><span className="text-xs text-muted-foreground">{g.adoptes_an} / {g.total_an}</span>
                    </td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      <span className="font-semibold text-[#F39C12]">{pctSN} %</span>
                      <br /><span className="text-xs text-muted-foreground">{g.adoptes_sn} / {g.total_sn}</span>
                    </td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      <span className="font-semibold text-violet-600">{pctP} %</span>
                      <br /><span className="text-xs text-muted-foreground">{g.promulgues} / {g.total_promulgables}</span>
                    </td>
                  </tr>
                );
              })()}
              {sections.Gouv.length > 1 && (
                <>
                  <SectionHeader label="Gouvernement" count={sections.Gouv.length} itemLabel="gouvernement" />
                  {sections.Gouv.map(renderRow)}
                  {renderTotalRow(sections.Gouv, 'Total tous gouvernements')}
                </>
              )}
              {sections.Autre.length > 0 && (
                <>
                  <SectionHeader label="Autre" count={sections.Autre.length} />
                  {sections.Autre.map(renderRow)}
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
