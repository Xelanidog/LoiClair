"use client"

import { useState, useMemo } from "react"
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { PctBadge, InsufficientDataBadge } from "./PctBadge"
import type { ActeurRow } from "@/app/(app)/Composition/Compositionqueries"

type SortKey = 'nomComplet' | 'age' | 'profession' | 'groupe' | 'departement' | 'taux_presence' | 'taux_presence_importants' | 'taux_cohesion_groupe'
type SortDir = 'asc' | 'desc'

export function ActeursTable({ acteurs, showVoteStats = false }: { acteurs: ActeurRow[]; showVoteStats?: boolean }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nomComplet')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let list = acteurs
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.nomComplet.toLowerCase().includes(q) ||
        a.profession?.toLowerCase().includes(q) ||
        a.groupe?.toLowerCase().includes(q) ||
        a.departement?.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (valA == null && valB == null) return 0
      if (valA == null) return 1
      if (valB == null) return -1
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir
      return String(valA).localeCompare(String(valB), 'fr') * dir
    })
  }, [acteurs, search, sortKey, sortDir])

  const baseColumns: [SortKey, string, string][] = [
    ['nomComplet', 'Nom Prénom', 'max-w-[160px]'],
    ['age', 'Âge', 'w-[80px]'],
    ['profession', 'Profession', 'max-w-[200px]'],
    ['groupe', 'Groupe', 'max-w-[180px]'],
    ['departement', 'Département', 'max-w-[160px]'],
  ]
  const voteColumns: [SortKey, string, string][] = [
    ['taux_presence', 'Participation votes', 'w-[95px]'],
    ['taux_presence_importants', 'Participation votes imp.', 'w-[115px]'],
    ['taux_cohesion_groupe', 'Cohésion', 'w-[100px]'],
  ]
  const columns = showVoteStats ? [...baseColumns, ...voteColumns] : baseColumns

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Liste des membres ({filtered.length})
      </h3>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, profession, groupe, département…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={e => e.currentTarget.style.borderColor = 'oklch(0.55 0.28 320)'}
          onBlur={e => e.currentTarget.style.borderColor = ''}
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none transition-all"
        />
      </div>

      <div className="rounded-lg border">
        <div style={{ height: '600px', overflowY: 'auto' }}>
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                    Aucun résultat
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((acteur, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[160px] truncate font-medium" title={acteur.nomComplet}>{acteur.nomComplet}</TableCell>
                    <TableCell>{acteur.age ?? '—'}{acteur.age ? ' ans' : ''}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={acteur.profession ?? undefined}>{acteur.profession ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={acteur.groupe ?? undefined}>{acteur.groupe ?? '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={acteur.departement ?? undefined}>{acteur.departement ?? '—'}</TableCell>
                    {showVoteStats && (
                      <>
                        <TableCell>
                          {(acteur.scrutins_pendant_mandat ?? 0) < 100
                            ? <InsufficientDataBadge />
                            : <PctBadge
                                value={acteur.taux_presence}
                                votes={(acteur.votes_pour ?? 0) + (acteur.votes_contre ?? 0) + (acteur.votes_abstentions ?? 0)}
                                total={acteur.scrutins_pendant_mandat}
                              />
                          }
                        </TableCell>
                        <TableCell>
                          {(acteur.scrutins_pendant_mandat_importants ?? 0) < 10
                            ? <InsufficientDataBadge />
                            : <PctBadge
                                value={acteur.taux_presence_importants}
                                votes={acteur.votes_actifs_importants}
                                total={acteur.scrutins_pendant_mandat_importants}
                              />
                          }
                        </TableCell>
                        <TableCell><PctBadge value={acteur.taux_cohesion_groupe} /></TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
