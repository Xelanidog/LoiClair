// src/app/Composition/CompositionClient.tsx
"use client"

import {
  Pie,
  PieChart,
  Cell,
  Label,
  Tooltip as RechartsTooltip,
} from "recharts"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Briefcase, Calendar, Scale, Users, Group, User, Search, ArrowUpDown, ArrowUp, ArrowDown, BarChart2, TrendingUp, TrendingDown } from "lucide-react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import type { KpiMetrics, ActeurRow, GroupeRow } from './Compositionqueries'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { useState, useMemo, useRef, useEffect } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ResponsiveContainer } from 'recharts';



interface Props {
  data: KpiMetrics
  title: string
  icon: React.ReactNode
}

export function CompositionClient({ data, title, icon }: Props) {

  return (
    <InstitutionCard 
      title={title}
      icon={icon}
      data={data}
    />
  )
}

// ────────────────────────────────────────────────
// InstitutionCard et KpiItem (copiés tels quels, mais sans async)
// ────────────────────────────────────────────────

function InstitutionCard({
  title,
  icon,
  data,
}: {
  title: string
  icon: React.ReactNode
  data: KpiMetrics
}) {
  if (data.membres === 0) {
  
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">{icon} {title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-10">
          Données indisponibles pour le moment
        </CardContent>
      </Card>
    )
  }

    const membreLabel = title === "Assemblée Nationale" 
  ? "Députés" 
  : title === "Sénat" 
    ? "Sénateurs" 
    : "Membres";  // fallback rare

  return (

    
<Card className="overflow-hidden border-0 shadow-none rounded-md">    
      <CardContent className="px-4 pb-4">


        {/* Ligne 1 : Membres + Parité */}
        <div className="flex flex-wrap justify-start items-start mb-8">
  <KpiItem
    icon={<Users className="h-5 w-5 text-muted-foreground" />}
    title="Membres"
    value={data.membres}
    animate={true}
    decimals={0}
  />

  <KpiItem
    icon={<Scale className="h-5 w-5 text-muted-foreground" />}
    title="Parité femmes"
    value={data.pariteFemmes}
    animate={true}
    decimals={0}
  />

  {data.nombreGroupes !== null && data.nombreGroupes > 0 && (
    <KpiItem
      icon={<Group className="h-5 w-5 text-muted-foreground" />}
      title="Groupes"
      value={data.nombreGroupes}
      animate={true}
      decimals={0}
      delay={0.3}
    />
  )}
</div>
        <Link href="/documentation/methode#parite-femmes" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors -mt-6 mb-4 inline-block">
          Comment c'est calculé →
        </Link>

        {/* Ligne 2 : Âges */}
        <div className="flex flex-wrap justify-left items-start mb-8">
<KpiItem
  icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
  title="Âge moyen"
  value={data.ageMoyen}
  animate={true}
  decimals={0}          // maintenant arrondi entier dans la query + ici decimals=0
/>

          <KpiItem
  icon={<User className="h-5 w-5 text-muted-foreground" />}
  title="Le plus jeune"
  value={data.plusJeune?.age ?? '—'}
  animate={!!data.plusJeune}
  decimals={0}
  extraContent={data.plusJeune?.nom}
/>

<KpiItem
  icon={<User className="h-5 w-5 text-muted-foreground" />}
  title="Le plus âgé"
  value={data.plusAge?.age ?? '—'}
  animate={!!data.plusAge}
  decimals={0}
  extraContent={data.plusAge?.nom}
/>
        
        
        </div>

        {/* Ligne 3 : Présence aux votes (affiché uniquement si données disponibles) */}
        {(data.presenceMoyenne !== null || data.presenceSolennelsMoyenne !== null) && (
          <div className="flex flex-wrap justify-start items-start pb-4 gap-6">
            <KpiItem
              icon={<BarChart2 className="h-5 w-5 text-muted-foreground" />}
              title="Participation moyenne (tous votes)"
              value={data.presenceMoyenne}
              animate={true}
              decimals={1}
            />
            <KpiItem
              icon={<BarChart2 className="h-5 w-5 text-muted-foreground" />}
              title="Participation moyenne (votes solennels)"
              value={data.presenceSolennelsMoyenne}
              animate={true}
              decimals={1}
            />
          </div>
        )}
        {/* Ligne 4 : extremes individuels */}
        {(data.meilleurePresence !== null || data.meilleureCohesion !== null) && (
          <div className="flex flex-wrap justify-start items-start pb-4 gap-6 mt-2">
            <KpiItem
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              title="Meilleure participation"
              value={data.meilleurePresence?.valeur ?? null}
              extraContent={data.meilleurePresence?.nom}
              animate={true}
              decimals={1}
              suffix=" %"
            />
            <KpiItem
              icon={<TrendingDown className="h-5 w-5 text-red-400" />}
              title="Moindre participation"
              value={data.pirePresence?.valeur ?? null}
              extraContent={data.pirePresence?.nom}
              animate={true}
              decimals={1}
              suffix=" %"
            />
            <KpiItem
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              title="Meilleure part. solennelle"
              value={data.meilleurePresenceSolennels?.valeur ?? null}
              extraContent={data.meilleurePresenceSolennels?.nom}
              animate={true}
              decimals={1}
              suffix=" %"
            />
            <KpiItem
              icon={<TrendingDown className="h-5 w-5 text-red-400" />}
              title="Moindre part. solennelle"
              value={data.pirePresenceSolennels?.valeur ?? null}
              extraContent={data.pirePresenceSolennels?.nom}
              animate={true}
              decimals={1}
              suffix=" %"
            />
            <KpiItem
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              title="Meilleure cohésion"
              value={data.meilleureCohesion?.valeur ?? null}
              extraContent={data.meilleureCohesion?.nom}
              animate={true}
              decimals={1}
              suffix=" %"
            />
            <KpiItem
              icon={<TrendingDown className="h-5 w-5 text-red-400" />}
              title="Moindre cohésion"
              value={data.pireCohesion?.valeur ?? null}
              extraContent={data.pireCohesion?.nom}
              animate={true}
              decimals={1}
              suffix=" %"
            />
          </div>
        )}
        {(data.presenceMoyenne !== null || data.meilleurePresence !== null || data.meilleureCohesion !== null) && (
          <span className="text-xs text-muted-foreground/60 -mt-2 mb-4 inline-flex gap-3">
            <Link href="/documentation/methode#taux-de-participation-aux-votes" className="hover:text-foreground transition-colors">
              Participation : comment c'est calculé →
            </Link>
            <Link href="/documentation/methode#taux-de-cohesion" className="hover:text-foreground transition-colors">
              Cohésion : comment c'est calculé →
            </Link>
          </span>
        )}

        {/* Le pie chart – seulement pour AN et Sénat */}
{ (title === "Assemblée Nationale" || title === "Sénat")
  && data.groupes
  && data.groupes.length > 0 && (
        <div className="mt-4 pt-6 border-t">
          <h3 className="text-lg font-semibold text-center mb-4">
            Répartition par groupe politique
          </h3>
          <GroupPieChart data={data.groupes} membres={data.membres} membreLabel={membreLabel} />
        </div>
        )}

        {/* Tableau des groupes politiques avec stats (AN uniquement) */}
        {data.groupesList.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <GroupesTable groupes={data.groupesList} />
          </div>
        )}

        {/* Tableau des acteurs */}
        {data.acteursList.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <ActeursTable acteurs={data.acteursList} showVoteStats={data.groupesList.length > 0} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}


function KpiItem({
  icon,
  title,
  value,
  animate = false,
  decimals = 0,
  delay = 0.2,
  extraContent,
  suffix: suffixProp,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number | null;
  animate?: boolean;
  decimals?: number;
  delay?: number;
  extraContent?: React.ReactNode;
  suffix?: string;
}) {
  if (value === null || value === '—') {
    return (
      <div className="text-left min-w-[100px] sm:min-w-[140px] space-y-1">
        <div className="flex justify-left mb-2 opacity-80">{icon}</div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </div>
        <div className="text-m tracking-tight">—</div>
      </div>
    );
  }

  // Conversion safe en nombre (on extrait seulement la partie âge si string)
  let numericValue: number;
  if (typeof value === 'string') {
    const match = value.match(/^(\d+)/); // prend les chiffres du début
    numericValue = match ? parseInt(match[1], 10) : 0;
  } else {
    numericValue = Number(value);
  }

  // Détection suffix (suffixProp override l'auto-détection)
  const hasPercent = title.toLowerCase().includes('parité') || title.toLowerCase().includes('présence') || String(value).includes('%');
  const hasAns = title.toLowerCase().includes('âge') || title.includes('jeune') || title.includes('âgé');
  const suffix = suffixProp ?? (hasPercent ? ' %' : hasAns ? ' ans' : '');

  return (
    <div className="text-left min-w-[140px] sm:min-w-[200px] space-y-1">
      <div className="flex justify-left mb-2 opacity-80">{icon}</div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {title}
      </div>
      <div className="text-m tracking-tight flex items-baseline gap-1.5 flex-wrap">
  {animate ? (
    <AnimatedNumber
      value={numericValue}
      decimals={decimals}
      suffix={suffix}
      delay={delay}
      className="font-bold text-foreground"  // ← on force la couleur et le poids
    />
  ) : (
    <span className="font-bold text-foreground">
      {Math.round(numericValue)}{suffix}
    </span>
  )}
  
  {extraContent && (
    <span className="text-foreground font-medium">
      – {extraContent}
    </span>
  )}
</div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Graphique demi-cercle responsive
// ────────────────────────────────────────────────

function GroupPieChart({
  data,
  membres,
  membreLabel,
}: {
  data: Array<{ name: string; nameShort: string; value: number; fill: string }>;
  membres: number;
  membreLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = width < 520;
  const outerR = isMobile
    ? Math.min(140, Math.max(60, width / 2 - 20))
    : Math.min(195, Math.max(100, width / 2 - 50));
  const innerR = Math.round(outerR * 0.74);
  // cy juste assez bas pour laisser de la place aux labels au-dessus de l'arc
  const cy = isMobile ? outerR + 10 : outerR + 40;
  const chartH = cy + 25;
  const margin = isMobile ? 5 : 80;

  return (
    <div ref={ref}>
      <div style={{ height: `${chartH}px`, width: '100%' }}>
        <ChartContainer config={{}} className="relative mx-auto w-full p-0 m-0 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: margin, bottom: 0, left: margin }}>
              <RechartsTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as { name: string; value: number };
                    return (
                      <div className="bg-white border border-gray-300 rounded p-3 shadow-md text-sm">
                        <p className="font-semibold">{item.name}</p>
                        <p>{item.value} {membreLabel.toLowerCase()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy={cy}
                startAngle={180}
                endAngle={0}
                innerRadius={innerR}
                outerRadius={outerR}
                strokeWidth={2}
                stroke="hsl(var(--background))"
                labelLine={!isMobile}
                label={isMobile ? false : ({ cx, cy, midAngle, outerRadius: oR, percent, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = oR + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  if (percent < 0.005) return null;
                  const entry = data[index];
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-sm font-medium fill-foreground pointer-events-none"
                    >
                      {entry?.nameShort} {entry?.value}
                    </text>
                  );
                }}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 16} className="fill-foreground text-4xl font-bold">
                            {membres.toLocaleString('fr-FR')}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-sm">
                            {membreLabel}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

    </div>
  );
}

// ────────────────────────────────────────────────
// Badge coloré pour les pourcentages
// ────────────────────────────────────────────────

function PctBadge({ value, votes, total }: { value: number | null; votes?: number | null; total?: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const colorClass =
    value >= 75 ? 'text-emerald-600 dark:text-emerald-400'
    : value >= 50 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400';
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className={`font-semibold tabular-nums ${colorClass}`}>
        {value.toFixed(1)} %
      </span>
      {votes != null && total != null && (
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {votes} / {total}
        </span>
      )}
    </span>
  );
}

// ────────────────────────────────────────────────
// Tableau récapitulatif des groupes politiques
// ────────────────────────────────────────────────

type GroupeSortKey = 'libelle' | 'nb_deputes' | 'pct_representation' | 'taux_presence_moyen' | 'taux_presence_solennels_moyen' | 'taux_cohesion_interne';

function GroupesTable({ groupes }: { groupes: GroupeRow[] }) {
  const [sortKey, setSortKey] = useState<GroupeSortKey>('nb_deputes');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: GroupeSortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'libelle' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    return [...groupes].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
      return String(valA).localeCompare(String(valB), 'fr') * dir;
    });
  }, [groupes, sortKey, sortDir]);

  const columns: [GroupeSortKey, string, string][] = [
    ['libelle', 'Groupe', 'min-w-[180px]'],
    ['nb_deputes', 'Effectif', 'w-[90px]'],
    ['pct_representation', 'Représentation', 'w-[130px]'],
    ['taux_presence_moyen', 'Participation votes', 'w-[130px]'],
    ['taux_presence_solennels_moyen', 'Participation votes solennels', 'w-[140px]'],
    ['taux_cohesion_interne', 'Cohésion interne', 'w-[130px]'],
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Groupes politiques</h3>
      <span className="text-xs text-muted-foreground/60 mb-4 inline-flex gap-3">
        <Link href="/documentation/methode#taux-de-participation-aux-votes" className="hover:text-foreground transition-colors">
          Participation : comment c'est calculé →
        </Link>
        <Link href="/documentation/methode#taux-de-cohesion" className="hover:text-foreground transition-colors">
          Cohésion : comment c'est calculé →
        </Link>
      </span>
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader className="bg-muted/80">
            <TableRow>
              {columns.map(([key, label, cls]) => (
                <TableHead key={key} className={key !== 'libelle' ? `${cls} text-right` : cls}>
                  <button
                    onClick={() => handleSort(key)}
                    className={`flex items-center gap-1 hover:text-foreground transition-colors ${key !== 'libelle' ? 'ml-auto' : ''}`}
                  >
                    {label}
                    {sortKey === key ? (
                      sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((g) => (
              <TableRow key={g.uid}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.fill }}
                    />
                    <span className="font-semibold shrink-0">{g.libelle_abrege}</span>
                    {g.libelle_abrege !== g.libelle && (
                      <span className="text-muted-foreground font-normal">{g.libelle}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{g.nb_deputes}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {g.pct_representation != null ? `${g.pct_representation.toFixed(1)} %` : '—'}
                </TableCell>
                <TableCell className="text-right"><PctBadge value={g.taux_presence_moyen} /></TableCell>
                <TableCell className="text-right"><PctBadge value={g.taux_presence_solennels_moyen} /></TableCell>
                <TableCell className="text-right"><PctBadge value={g.taux_cohesion_interne} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Tableau des acteurs
// ────────────────────────────────────────────────

type SortKey = 'nomComplet' | 'age' | 'profession' | 'groupe' | 'departement' | 'taux_presence' | 'taux_presence_solennels' | 'taux_cohesion_groupe';
type SortDir = 'asc' | 'desc';

function ActeursTable({ acteurs, showVoteStats = false }: { acteurs: ActeurRow[]; showVoteStats?: boolean }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nomComplet');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = acteurs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.nomComplet.toLowerCase().includes(q) ||
        a.profession?.toLowerCase().includes(q) ||
        a.groupe?.toLowerCase().includes(q) ||
        a.departement?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
      return String(valA).localeCompare(String(valB), 'fr') * dir;
    });
  }, [acteurs, search, sortKey, sortDir]);

  const baseColumns: [SortKey, string, string][] = [
    ['nomComplet', 'Nom Prénom', 'max-w-[160px]'],
    ['age', 'Âge', 'w-[80px]'],
    ['profession', 'Profession', 'max-w-[200px]'],
    ['groupe', 'Groupe', 'max-w-[180px]'],
    ['departement', 'Département', 'max-w-[160px]'],
  ];
  const voteColumns: [SortKey, string, string][] = [
    ['taux_presence', 'Participation votes', 'w-[95px]'],
    ['taux_presence_solennels', 'Participation votes sol.', 'w-[115px]'],
    ['taux_cohesion_groupe', 'Cohésion', 'w-[100px]'],
  ];
  const columns = showVoteStats ? [...baseColumns, ...voteColumns] : baseColumns;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Liste des membres ({filtered.length})
      </h3>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, profession, groupe, département…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.55 0.28 320)'}
          onBlur={e => e.currentTarget.style.borderColor = ''}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none transition-all"
        />
      </div>

      {/* Tableau scrollable */}
      <div className="rounded-lg border">
        <div style={{ height: '600px', overflowY: 'auto' }}>
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                {columns.map(([key, label, cls]) => (
                  <TableHead key={key} className={cls}>
                    <button
                      onClick={() => handleSort(key)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {label}
                      {sortKey === key ? (
                        sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                    Aucun résultat
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((acteur, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[160px] truncate font-medium" title={acteur.nomComplet}>{acteur.nomComplet}</TableCell>
                    <TableCell>{acteur.age ?? '—'}{acteur.age ? ' ans' : ''}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={acteur.profession ?? undefined}>{acteur.profession ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={acteur.groupe ?? undefined}>{acteur.groupe ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={acteur.departement ?? undefined}>{acteur.departement ?? '—'}</TableCell>
                    {showVoteStats && (
                      <>
                        <TableCell>
                          <PctBadge
                            value={acteur.taux_presence}
                            votes={(acteur.votes_pour ?? 0) + (acteur.votes_contre ?? 0) + (acteur.votes_abstentions ?? 0)}
                            total={acteur.scrutins_pendant_mandat}
                          />
                        </TableCell>
                        <TableCell>
                          <PctBadge
                            value={acteur.taux_presence_solennels}
                            votes={acteur.votes_actifs_solennels}
                            total={acteur.scrutins_pendant_mandat_solennels}
                          />
                        </TableCell>
                        <TableCell><PctBadge value={acteur.taux_cohesion_groupe} /></TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}