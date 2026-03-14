"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { PctBadge } from "./PctBadge"
import type { GroupeRow } from "@/app/(app)/Composition/Compositionqueries"

type GroupeSortKey = 'libelle' | 'nb_deputes' | 'pct_representation' | 'taux_presence_moyen' | 'taux_presence_importants_moyen' | 'taux_cohesion_interne'
type SortDir = 'asc' | 'desc'

export function GroupesTable({ groupes, showVoteColumns = true }: { groupes: GroupeRow[]; showVoteColumns?: boolean }) {
  const [sortKey, setSortKey] = useState<GroupeSortKey>('nb_deputes')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: GroupeSortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'libelle' ? 'asc' : 'desc')
    }
  }

  const sorted = useMemo(() => {
    return [...groupes].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (valA == null && valB == null) return 0
      if (valA == null) return 1
      if (valB == null) return -1
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir
      return String(valA).localeCompare(String(valB), 'fr') * dir
    })
  }, [groupes, sortKey, sortDir])

  const baseColumns: [GroupeSortKey, string, string][] = [
    ['libelle', 'Groupe', 'min-w-[180px]'],
    ['nb_deputes', 'Effectif', 'w-[90px]'],
    ['pct_representation', 'Représentation', 'w-[130px]'],
  ]

  const voteColumns: [GroupeSortKey, string, string][] = [
    ['taux_presence_moyen', 'Participation votes', 'w-[130px]'],
    ['taux_presence_importants_moyen', 'Participation votes importants', 'w-[140px]'],
    ['taux_cohesion_interne', 'Cohésion interne', 'w-[130px]'],
  ]

  const columns = showVoteColumns ? [...baseColumns, ...voteColumns] : baseColumns

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Groupes politiques</h3>
      {showVoteColumns && (
        <span className="text-xs text-muted-foreground/60 mb-4 inline-flex gap-3">
          <Link href="/documentation/methode#taux-de-participation-aux-votes" className="hover:text-foreground transition-colors">
            Participation : comment c'est calculé →
          </Link>
          <Link href="/documentation/methode#taux-de-cohesion" className="hover:text-foreground transition-colors">
            Cohésion : comment c'est calculé →
          </Link>
        </span>
      )}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader className="bg-muted/80">
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
                <TableCell className="tabular-nums">{g.nb_deputes}</TableCell>
                <TableCell className="tabular-nums">
                  {g.pct_representation != null ? `${g.pct_representation.toFixed(1)} %` : '—'}
                </TableCell>
                {showVoteColumns && (
                  <>
                    <TableCell><PctBadge value={g.taux_presence_moyen} /></TableCell>
                    <TableCell><PctBadge value={g.taux_presence_importants_moyen} /></TableCell>
                    <TableCell><PctBadge value={g.taux_cohesion_interne} /></TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
