"use client"

import { AnimatedNumber } from "@/components/AnimatedNumber"

export function KpiItem({
  icon,
  title,
  value,
  animate = false,
  decimals = 0,
  delay = 0.2,
  extraContent,
  suffix: suffixProp,
}: {
  icon: React.ReactNode
  title: string
  value: string | number | null
  animate?: boolean
  decimals?: number
  delay?: number
  extraContent?: React.ReactNode
  suffix?: string
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
    )
  }

  let numericValue: number
  if (typeof value === 'string') {
    const match = value.match(/^(\d+)/)
    numericValue = match ? parseInt(match[1], 10) : 0
  } else {
    numericValue = Number(value)
  }

  const hasPercent = title.toLowerCase().includes('parité') || title.toLowerCase().includes('présence') || String(value).includes('%')
  const hasAns = title.toLowerCase().includes('âge') || title.includes('jeune') || title.includes('âgé')
  const suffix = suffixProp ?? (hasPercent ? ' %' : hasAns ? ' ans' : '')

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
            className="font-bold text-foreground"
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
  )
}
