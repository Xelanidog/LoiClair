export const revalidate = 3600

import { getKpiMetrics } from '@/app/(app)/Composition/Compositionqueries'
import { AssembleeClient } from './AssembleeClient'

export const metadata = {
  title: "Assemblée nationale — LoiClair",
  description: "Composition, groupes politiques et statistiques de vote des 577 députés de l'Assemblée nationale.",
}

export default async function AssembleePage() {
  const data = await getKpiMetrics('AN')
  return <AssembleeClient data={data} />
}
