// src/app/Composition/CompositionClient.tsx
"use client"

import {
  Pie,
  PieChart,
  Cell,
  Label,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Briefcase, Calendar, Scale, Users, Group, User } from "lucide-react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import type { KpiMetrics } from './Compositionqueries'
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

  return (

    
<Card className="overflow-hidden rounded-md">    
      <CardContent className="px-4 pb-4 font-bold">


        {/* Ligne 1 : Membres + Parité */}
        <div className="flex flex-wrap justify-start items-start mb-5">
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

        {/* Ligne 2 : Âges */}
        <div className="flex justify-left items-start pb-4">
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

        {/* Le pie chart – seulement pour AN */}
        {title === "Assemblée Nationale" && data.groupes && data.groupes.length > 0 && (

            
    
        <div className="mt-4 pt-6 border-t">  
  <h3 className="text-lg font-semibold text-center">  
    Répartition par groupe politique
  </h3>

<div style={{ height: '420px', width: '100%' }}>
  
  <ChartContainer
    config={{}}
    className="relative mx-auto w-full p-0 m-0 h-full"
  >

    <ResponsiveContainer width="100%" height="100%">

    
      <PieChart 
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>    
    <RechartsTooltip
      cursor={false}
      content={({ active, payload }) => {
        if (active && payload && payload.length) {
          const item = payload[0].payload as { name: string; value: number };
          return (
            <div className="bg-white border border-gray-300 rounded p-3 shadow-md text-sm">
              <p className="font-semibold">{item.name}</p>
              <p>{item.value} députés</p>
            </div>
          );
        }
        return null;
      }}
    />

    <Pie
  data={data.groupes}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  innerRadius={100}
  outerRadius={140}
  strokeWidth={2}
  stroke="hsl(var(--background))"
  labelLine={true}                // ← lignes reliant part → texte
  label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Calcul position du label (extérieur pour parts < 5%, intérieur sinon)
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 2; // un peu plus loin
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // On affiche seulement si la part est assez grosse (évite surcharge visuelle)
    if (percent < 0.005) return null; // < 2% → pas de label

    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-md font-medium fill-foreground pointer-events-none"
      >
        {name} {value}
      </text>
    );
  }}
  paddingAngle={3} // petit espace entre parts
>
  {data.groupes.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.fill} />
  ))}

  {/* Centre total députés */}
  <Label
    content={({ viewBox }) => {
      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
        return (
          <text
            x={viewBox.cx}
            y={viewBox.cy}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan
              x={viewBox.cx}
              y={viewBox.cy}
              className="fill-foreground text-4xl font-bold"
            >
              {data.membres.toLocaleString('fr-FR')}
            </tspan>
            <tspan
              x={viewBox.cx}
              y={(viewBox.cy || 0) + 28}
              className="fill-muted-foreground text-sm sm:text-base"
            >
              Députés
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
  extraContent,           // ← nouveau prop optionnel
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number | null;
  animate?: boolean;
  decimals?: number;
  delay?: number;
  extraContent?: React.ReactNode;
}) {
  if (value === null || value === '—') {
    return (
      <div className="text-left min-w-[110px] sm:min-w-[180px] space-y-1">  {/* min-w un peu plus large */}
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

  // Détection suffix
  const hasPercent = title.toLowerCase().includes('parité') || String(value).includes('%');
  const hasAns = title.toLowerCase().includes('âge') || title.includes('jeune') || title.includes('âgé');
  const suffix = hasPercent ? ' %' : hasAns ? ' ans' : '';

  return (
    <div className="text-left min-w-[180px] sm:min-w-[220px] space-y-1">  {/* augmenté pour le nom */}
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