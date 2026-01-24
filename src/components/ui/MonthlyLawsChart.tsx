'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
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

const chartConfig: ChartConfig = {
  lois: {
    label: "Lois déposées",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;


interface MonthlyLawsChartProps {
  data: { month: string; lois: number }[];
}

export function MonthlyLawsChart({ data }: MonthlyLawsChartProps) {
      const lastMonth = data[data.length - 1]?.lois ?? 0;
  const prevMonth = data[data.length - 2]?.lois ?? 0;
  const trend = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

  const trendText = trend > 0 
    ? `En hausse de ${trend.toFixed(1)}%` 
    : trend < 0 
    ? `En baisse de ${Math.abs(trend).toFixed(1)}%` 
    : "Stable";

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Évolution mensuelle</CardTitle>
          <CardDescription>
            Nombre de lois déposées - 24 derniers mois
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-6 sm:p-6">
        <ChartContainer 
          config={chartConfig} 
          className="aspect-auto h-[150px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
  dataKey="month"
  tickLine={false}
  axisLine={false}
  tickMargin={10}
  fontSize={12}
  tickFormatter={(value) => value.split('-')[0]}  // Affiche seulement short month (ex. 'janv.').
/>
<ChartTooltip
  content={
    <ChartTooltipContent 
      className="w-[160px]"
      labelFormatter={(value) => {
        const [shortMonth, year] = value.split('-');
        return `${shortMonth} ${year || ''}`;
      }}
    />
  }
/>
            <Bar 
              dataKey="lois" 
              fill="var(--color-lois)" 
              radius={2}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-4">
        <div className="flex gap-2 font-medium leading-none">
          {trendText}
          {trend >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className="text-muted-foreground">
          Comparaison avec le mois précédent
        </p>
      </CardFooter>
    </Card>
  );
}