'use server';

import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'; // Wrapper Shadcn pour graphiques élégants et intégrés à Tailwind
import { MonthlyLawsChart } from '@/components/ui/MonthlyLawsChart'; // Chemin relatif si dans app/KPIs/
import fs from 'fs/promises'; // Pour lecture async, évite de bloquer le server.
import path from 'path'; // Pour chemins absolus robustes, portable dev/prod.

// Lecture et parse CSV server-side via fetch pour cohérence avec tes dossiers + deploy facile
let statsData = { mois_courant: 0, historique: [] };

try {
const csvPath = path.join(process.cwd(), 'public', 'data', 'lois.csv'); // Absolu : racine + public/data.
const csvBuffer = await fs.readFile(csvPath);
const csvData = csvBuffer.toString();



  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  
  console.log('CSV lu, lignes:', parsed.data.length);

  const now = new Date();
  const moisCourantStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const depotDates = parsed.data
    .map((row: any) => row.date_depot ? new Date(row.date_depot) : null)
    .filter((date: Date | null): date is Date => date !== null && !isNaN(date.getTime()));
  
  statsData.mois_courant = depotDates.filter((d: Date) => d >= moisCourantStart && d < now).length;
  
    const startDate = new Date(now.getFullYear(), now.getMonth() - 23, 1);  // 24 mois en arrière : mois courant -23 pour inclure full 24.
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);     // End = mois suivant pour couvrir courant.
    const monthlyCounts: { [key: string]: number } = {};
  
  for (let d = new Date(startDate); d < endDate; d.setMonth(d.getMonth() + 1)) {
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[moisKey] = 0;
  }
  
  depotDates.forEach((d: Date) => {
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyCounts[moisKey] !== undefined) monthlyCounts[moisKey]++;
  });
  
  statsData.historique = Object.entries(monthlyCounts).map(([mois, count]) => ({ mois, count }));
  console.log('Historique calculé:', statsData.historique);
} catch (error) {
  console.error('Erreur parse CSV:', error);
}

// Transformation des données pour le chart : on mappe vers un format { month: 'Jan', lois: number } 
// pour une intégration directe avec Recharts. Choix d'optimisation : formatage ici server-side pour 
// éviter du JS client inutile ; utilisation de Intl pour les mois en FR (internationalisation facile) ; 
// limitation aux 12 derniers mois (slice(-12)) pour focus sur l'historique récent, comme demandé.
const chartData = statsData.historique.slice(-24).map(({ mois, count }) => {
  const [year, month] = mois.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(year, month - 1));
  return { month: `${monthName}-${year}`, lois: count, year };  // Month unique avec -year caché.
});
  
export default async function ALaUnePage() {
  return (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  

  {/* Card graphique (droite) */}
  
  <MonthlyLawsChart data={chartData} />
 
</div>
  );
}