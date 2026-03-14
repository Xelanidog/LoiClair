"use client"

export function PctBadge({ value, votes, total }: { value: number | null; votes?: number | null; total?: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  const colorClass =
    value >= 75 ? 'text-[#27AE60] dark:text-[#2ECC71]'
    : value >= 50 ? 'text-[#F39C12] dark:text-[#F1C40F]'
    : 'text-[#E74C3C] dark:text-[#E74C3C]'
  return (
    <span className="flex flex-col items-start gap-0.5">
      <span className={`font-semibold tabular-nums ${colorClass}`}>
        {value.toFixed(1)} %
      </span>
      {votes != null && total != null && (
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {votes} / {total}
        </span>
      )}
    </span>
  )
}

export function InsufficientDataBadge() {
  return (
    <span className="text-[11px] text-muted-foreground italic leading-tight">
      Pas assez de scrutins
      <br />
      depuis la prise de fonction
    </span>
  )
}
