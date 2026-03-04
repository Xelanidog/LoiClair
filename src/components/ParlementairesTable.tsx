'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Parlementaire = {
  nom: string;
  chambre: string;
  groupe: string;
  nb_auteur: number;
  nb_rapporteur: number;
  total: number;
};

type SortCol = 'nom' | 'chambre' | 'groupe' | 'nb_auteur' | 'nb_rapporteur' | 'total';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (col !== sortCol) return <span className="text-muted-foreground/40 ml-1">↕</span>;
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export function ParlementairesTable({ data }: { data: Parlementaire[] }) {
  const [sortCol, setSortCol] = useState<SortCol>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortCol, sortDir]);

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, 20);
    return sorted.filter(p => p.nom.toLowerCase().includes(q));
  }, [sorted, query]);

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const th = (col: SortCol, label: string, align: 'left' | 'right' = 'left') => (
    <th
      className={cn(
        'p-3 font-medium cursor-pointer select-none hover:text-foreground whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
        col === sortCol ? 'text-foreground' : 'text-muted-foreground'
      )}
      onClick={() => handleSort(col)}
    >
      {label}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
    </th>
  );

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-3">
      <Input
        placeholder="Rechercher un parlementaire…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="max-w-sm"
      />
      {isSearching && (
        <p className="text-xs text-muted-foreground">
          {displayed.length === 0
            ? 'Aucun résultat'
            : `${displayed.length} résultat${displayed.length > 1 ? 's' : ''} pour « ${query.trim()} »`}
        </p>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-muted-foreground w-10">#</th>
                {th('nom', 'Nom')}
                {th('chambre', 'Chambre')}
                {th('groupe', 'Groupe')}
                {th('nb_auteur', 'Auteur', 'right')}
                {th('nb_rapporteur', 'Rapporteur', 'right')}
                {th('total', 'Total', 'right')}
              </tr>
            </thead>
            <tbody>
              {displayed.map((p, i) => (
                <tr key={p.nom} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                  <td className="p-3 font-medium whitespace-nowrap">{p.nom}</td>
                  <td className="p-3">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap',
                      p.chambre === 'AN'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    )}>
                      {p.chambre === 'AN' ? 'Député' : 'Sénateur'}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{p.groupe}</td>
                  <td className="p-3 text-right">{p.nb_auteur}</td>
                  <td className="p-3 text-right">{p.nb_rapporteur}</td>
                  <td className="p-3 text-right font-bold">{p.total}</td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">
                    Aucun parlementaire trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {!isSearching && (
        <p className="text-xs text-muted-foreground/60 text-right">
          Top 20 affiché — utilisez la recherche pour trouver n&apos;importe quel parlementaire
        </p>
      )}
    </div>
  );
}
