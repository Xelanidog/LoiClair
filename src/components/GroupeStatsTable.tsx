'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

type GroupeStat = {
  groupe: string;
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

  const sorted = useMemo(() => [...data].sort((a, b) => {
    let va: number | string = 0, vb: number | string = 0;
    if (sortCol === 'groupe')  { va = a.groupe; vb = b.groupe; }
    else if (sortCol === 'pctAN') { va = pct(a.adoptes_an, a.total_an); vb = pct(b.adoptes_an, b.total_an); }
    else if (sortCol === 'pctSN') { va = pct(a.adoptes_sn, a.total_sn); vb = pct(b.adoptes_sn, b.total_sn); }
    else                          { va = pct(a.promulgues,  a.total_promulgables); vb = pct(b.promulgues, b.total_promulgables); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [data, sortCol, sortDir]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const Arrow = ({ col }: { col: SortCol }) =>
    sortCol === col
      ? <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
      : <span className="ml-1 opacity-25">↕</span>;

  const thBtn = (col: SortCol, label: string, align: 'left' | 'right' = 'right') => (
    <th className={`px-4 py-3 font-medium text-${align}`}>
      <button
        onClick={() => handleSort(col)}
        className={`flex items-center gap-0.5 hover:text-foreground transition-colors ${align === 'right' ? 'ml-auto' : ''}`}
      >
        {label}<Arrow col={col} />
      </button>
    </th>
  );

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
              {sorted.map((g, i) => {
                const pctAN = Math.round(pct(g.adoptes_an, g.total_an) * 1000) / 10;
                const pctSN = Math.round(pct(g.adoptes_sn, g.total_sn) * 1000) / 10;
                const pctP  = Math.round(pct(g.promulgues,  g.total_promulgables) * 1000) / 10;
                return (
                  <tr key={g.groupe} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                    <td className="px-4 py-3 font-medium">{g.groupe}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-semibold text-blue-600">{pctAN} %</span>
                      <br /><span className="text-xs text-muted-foreground">{g.adoptes_an} / {g.total_an}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-semibold text-orange-600">{pctSN} %</span>
                      <br /><span className="text-xs text-muted-foreground">{g.adoptes_sn} / {g.total_sn}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-semibold text-purple-600">{pctP} %</span>
                      <br /><span className="text-xs text-muted-foreground">{g.promulgues} / {g.total_promulgables}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
