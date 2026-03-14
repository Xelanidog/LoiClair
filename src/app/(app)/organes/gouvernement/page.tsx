export const revalidate = 3600

import { getKpiMetrics } from '@/app/(app)/Composition/Compositionqueries'
import { GouvernementClient } from './GouvernementClient'

export default async function GouvernementPage() {
  const data = await getKpiMetrics('Gouvernement')
  return <GouvernementClient data={data} />
}
