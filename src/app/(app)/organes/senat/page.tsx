export const revalidate = 3600

import { getKpiMetrics } from '@/app/(app)/Composition/Compositionqueries'
import { SenatClient } from './SenatClient'

export const metadata = {
  title: "Sénat — LoiClair",
  description: "Composition, groupes politiques et statistiques des 348 sénateurs du Sénat de la République française.",
}

export default async function SenatPage() {
  const data = await getKpiMetrics('Senat')
  return <SenatClient data={data} />
}
