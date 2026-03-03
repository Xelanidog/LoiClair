'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface GroupeBarChartProps {
  data: { groupe: string; value: number }[];
  title: string;
  description: string;
  color: string;
  valueLabel: string;
}

export function GroupeBarChart({ data, title, description, color, valueLabel }: GroupeBarChartProps) {
  const chartConfig: ChartConfig = {
    value: { label: valueLabel, color },
  };

  // Hauteur dynamique : 40px par barre + marges
  const chartHeight = Math.max(200, data.length * 40);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <ChartContainer config={chartConfig} style={{ height: chartHeight }} className="w-full">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis
              dataKey="groupe"
              type="category"
              tickLine={false}
              axisLine={false}
              width={180}
              fontSize={12}
              tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v}
            />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip
              content={<ChartTooltipContent className="w-[220px]" labelKey="groupe" />}
            />
            <Bar dataKey="value" fill={color} radius={3} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
