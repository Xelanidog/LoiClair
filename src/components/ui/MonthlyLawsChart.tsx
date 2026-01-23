'use client'; // Nécessaire pour Recharts (client-side rendering pour interactions).

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// Composant dédié au graphique mensuel des lois déposées. 
// Explication globale : Utilise Recharts via wrappers Shadcn pour un rendu minimaliste et responsive. 
// Choix d'optimisations depuis le début : couleurs Tailwind (--chart-1), radius doux pour élégance, 
// labels au-dessus des bars pour lisibilité immédiate (pas de hover forcé) ; calcul de tendance 
// dynamique (comparaison dernier vs avant-dernier mois) pour ajouter de la valeur sans complexité ; 
// accessibilité intégrée (accessibilityLayer). Limité à 12 mois max pour perf sur mobile.
const chartConfig: ChartConfig = {
  lois: {
    label: 'Lois déposées',
    color: 'var(--chart-1)',
  },
};

interface MonthlyLawsChartProps {
  data: { month: string; lois: number }[];
}

export function MonthlyLawsChart({ data }: MonthlyLawsChartProps) {
  // Calcul simple de la tendance pour le footer (ex. : +X% ce mois vs précédent).
  const lastMonth = data[data.length - 1]?.lois ?? 0;
  const prevMonth = data[data.length - 2]?.lois ?? 0;
  const trend = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  const trendText = trend > 0 ? `En hausse de ${trend.toFixed(1)}% ce mois` : trend < 0 ? `En baisse de ${Math.abs(trend).toFixed(1)}% ce mois` : 'Stable ce mois';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lois déposées par mois</CardTitle>
        <CardDescription>Derniers 12 mois</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 20 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="lois" fill="var(--color-lois)" radius={8}>
              <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {trendText} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Affichage du nombre total de lois déposées sur les 12 derniers mois
        </div>
      </CardFooter>
    </Card>
  );
}