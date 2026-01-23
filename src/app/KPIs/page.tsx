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
  
  const startDate = new Date(2025, 1, 1);
  const endDate = new Date(2026, 1, 1);
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
const chartData = statsData.historique.slice(-12).map(({ mois, count }) => {
  const [year, month] = mois.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(year, month - 1));
  return { month: monthName, lois: count };
});
  
export default async function ALaUnePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">À la une : Activité de l'Assemblée nationale</h1>
      
      {/* Chiffre clé du mois courant : Gros et centré pour lisibilité immédiate */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Textes déposés ce mois-ci (janvier 2026)</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
{statsData.mois_courant > 0 ? (
  <>
    <p className="text-5xl font-bold text-center">{statsData.mois_courant}</p>
  </>
) : (
  <p className="text-center text-muted-foreground">Aucune donnée ce mois-ci (vérifiez lois.csv).</p>
)}


        </CardContent>
      </Card>

      {/* Historique mensuel : Card séparé pour clarté, permet un scroll progressif et une lecture "histoire" */}
<Card className="mb-8">
  <CardHeader>
    <CardTitle>Évolution des textes déposés</CardTitle>
  </CardHeader>
  <CardContent>
    <MonthlyLawsChart data={chartData} />
  </CardContent>
</Card>
      
   </div>
  );
}