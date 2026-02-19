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
import { Building2, Briefcase, Calendar, Scale, User, Users } from "lucide-react"
import { AnimatedNumber } from "@/components/AnimatedNumber"
import type { KpiMetrics } from './Compositionqueries'


// Imports Shadcn chart – CRUCIAL pour que ChartContainer et ChartTooltipContent fonctionnent
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"


interface Props {
  anData: KpiMetrics
  senatData: KpiMetrics
  gouvData: KpiMetrics
}

export function CompositionClient({ anData, senatData, gouvData }: Props) {
  return (
    <div className="space-y-16 md:space-y-20 lg:space-y-24">
      <InstitutionCard title="Assemblée Nationale" icon={<Building2 className="h-4 w-4" />} data={anData} />
      <InstitutionCard title="Sénat" icon={<Building2 className="h-4 w-4" />} data={senatData} />
      <InstitutionCard title="Gouvernement" icon={<Briefcase className="h-4 w-4" />} data={gouvData} />
    </div>
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
    <Card className="overflow-hidden rounded-md pt-0">
      <CardHeader className="border-b border-border/50 bg-muted/30 px-6 py-5 flex items-center justify-start gap-3 w-full">
        <CardTitle className="flex items-center gap-3 m-0 p-0">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2 font-bold">
        {/* Ligne 1 : Membres + Parité */}
        <div className="flex justify-left items-start gap-10 md:gap-12 mb-5">
          <KpiItem icon={<Users className="h-5 w-5 text-muted-foreground" />} title="Membres" value={data.membres.toLocaleString('fr-FR')} />
          <KpiItem icon={<Scale className="h-5 w-5 text-muted-foreground" />} title="Parité femmes" value={data.pariteFemmes !== null ? `${data.pariteFemmes}%` : '—'} />
        </div>

        {/* Ligne 2 : Âges */}
        <div className="flex justify-left items-start gap-10 md:gap-12">
          <KpiItem icon={<Calendar className="h-5 w-5 text-muted-foreground" />} title="Âge moyen" value={data.ageMoyen !== null ? `${data.ageMoyen} ans` : '—'} />
          <KpiItem icon={<User className="h-5 w-5 text-muted-foreground" />} title="Le plus jeune" value={data.plusJeune ? `${data.plusJeune.age} ans – ${data.plusJeune.nom}` : '—'} />
          <KpiItem icon={<User className="h-5 w-5 text-muted-foreground" />} title="Le plus âgé" value={data.plusAge ? `${data.plusAge.age} ans – ${data.plusAge.nom}` : '—'} />
        </div>

        {/* Le pie chart – seulement pour AN */}
        {title === "Assemblée Nationale" && data.groupes && data.groupes.length > 0 && (
        <div className="mt-4 pt-2 border-t">  
  <h3 className="text-lg font-semibold text-center">  
    Répartition par groupe politique
  </h3>

  <ChartContainer
    config={{}}
    className="mx-auto w-full h-[420px] sm:h-[460px] md:h-[520px] lg:h-[560px] p-0 m-0"  
  >
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>    
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
  innerRadius={80}
  outerRadius={100}
  strokeWidth={2}
  stroke="hsl(var(--background))"
  labelLine={true}                // ← lignes reliant part → texte
  label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Calcul position du label (extérieur pour parts < 5%, intérieur sinon)
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 2.3; // un peu plus loin
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
</ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function KpiItem({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, "")) || 0
  const hasPercent = value.includes("%")
  const hasAns = value.includes("ans")
  const hasPerson = value.includes("–")

  if (hasPerson || isNaN(numericValue)) {
    return (
      <div className="text-left min-w-[110px] sm:min-w-[130px] space-y-1">
        <div className="flex justify-left mb-2 opacity-80">{icon}</div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</div>
        <div className="text-m tracking-tight">{value}</div>
      </div>
    )
  }

  return (
    <div className="text-left min-w-[110px] sm:min-w-[130px] space-y-1">
      <div className="flex justify-left mb-2 opacity-80">{icon}</div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</div>
      <div className="text-m tracking-tight">
        <AnimatedNumber value={numericValue} decimals={hasPercent ? 0 : 0} suffix={hasPercent ? "%" : hasAns ? " ans" : ""} delay={0.2} />
      </div>
    </div>
  )
}