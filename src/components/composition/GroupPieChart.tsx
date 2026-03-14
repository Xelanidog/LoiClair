"use client"

import { useState, useRef, useEffect } from "react"
import {
  Pie,
  PieChart,
  Cell,
  Label,
  Tooltip as RechartsTooltip,
} from "recharts"
import { ResponsiveContainer } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

export function GroupPieChart({
  data,
  membres,
  membreLabel,
}: {
  data: Array<{ name: string; nameShort: string; value: number; fill: string }>
  membres: number
  membreLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)

  useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const isMobile = width < 520
  const outerR = isMobile
    ? Math.min(140, Math.max(60, width / 2 - 20))
    : Math.min(195, Math.max(100, width / 2 - 50))
  const innerR = Math.round(outerR * 0.74)
  const cy = isMobile ? outerR + 10 : outerR + 40
  const chartH = cy + 25
  const margin = isMobile ? 5 : 80

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
                    const item = payload[0].payload as { name: string; value: number }
                    return (
                      <div className="bg-white border border-border rounded p-3 shadow-sm text-sm">
                        <p className="font-semibold">{item.name}</p>
                        <p>{item.value} {membreLabel.toLowerCase()}</p>
                      </div>
                    )
                  }
                  return null
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
                  const RADIAN = Math.PI / 180
                  const radius = oR + 30
                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                  const y = cy + radius * Math.sin(-midAngle * RADIAN)
                  if (percent < 0.005) return null
                  const entry = data[index]
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
                  )
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
                      )
                    }
                    return null
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
