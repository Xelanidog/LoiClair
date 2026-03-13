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

interface MonthlyDossiersChartProps {
  data: { month: string; dossiers: number }[];
  title: string;
  description: string;
  tooltipLabel: string;
  trendUpTemplate: string;
  trendDownTemplate: string;
  trendStable: string;
  comparisonLabel: string;
}

export function MonthlyDossiersChart({
  data,
  title,
  description,
  tooltipLabel,
  trendUpTemplate,
  trendDownTemplate,
  trendStable,
  comparisonLabel,
}: MonthlyDossiersChartProps) {
  const chartConfig: ChartConfig = {
    dossiers: {
      label: tooltipLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Calcul de la tendance (mois courant vs mois précédent)
  const lastMonth = data[data.length - 1]?.dossiers ?? 0;
  const prevMonth = data[data.length - 2]?.dossiers ?? 0;
  const trend = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

  const trendText = trend > 0
    ? trendUpTemplate.replace('__RATE__', trend.toFixed(1))
    : trend < 0
    ? trendDownTemplate.replace('__RATE__', Math.abs(trend).toFixed(1))
    : trendStable;

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
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
              tickFormatter={(value) => value.split('-')[0]}
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
              dataKey="dossiers"
              fill="var(--color-dossiers)"
              radius={2}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-4">
        <div className="flex gap-2 font-medium leading-none">
          {trendText}
          {trend >= 0 ? (
            <TrendingUp className="h-4 w-4 text-[#27AE60]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[#E74C3C]" />
          )}
        </div>
        <p className="text-muted-foreground">{comparisonLabel}</p>
      </CardFooter>
    </Card>
  );
}
