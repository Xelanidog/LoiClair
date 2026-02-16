'use server';

import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MonthlyDossiersChart } from '@/components/ui/MonthlyDossiersChart';

let statsData = { 
  total_dossiers: 0,
  mois_courant: 0,
  moyenne_mensuelle: 0,
  historique: [] as { mois: string; count: number }[],
  en_cours: 0,
  adoptes_an: 0,
  adoptes_senat: 0,
  adoptes_parlement: 0,
  promulgues: 0,
  rejetes: 0,
};

try {
  const { data: dossiers, error } = await supabase
    .from('dossiers_legislatifs')
    .select('date_depot, statut_final')
    .not('date_depot', 'is', null)
    .order('date_depot', { ascending: false })
    .limit(10000);

  if (error) throw error;

  statsData.total_dossiers = dossiers?.length || 0;

  const now = new Date();
  const moisCourantStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const depotDates = (dossiers || [])
    .map((row: any) => row.date_depot ? new Date(row.date_depot) : null)
    .filter((date): date is Date => date !== null && !isNaN(date.getTime()));

  statsData.mois_courant = depotDates.filter(d => d >= moisCourantStart).length;

  // === Calcul des statuts ===
  dossiers?.forEach((d: any) => {
    const statut = d.statut_final?.toLowerCase() || 'inconnu';

    if (statut === 'en_cours' || statut.includes('cours')) statsData.en_cours++;
    else if (statut.includes('an') || statut.includes('assemblée') || statut.includes('assemblee')) statsData.adoptes_an++;
    else if (statut.includes('sénat')) statsData.adoptes_senat++;
    else if (statut.includes('parlement') || statut.includes('navette') || statut === 'adopté') statsData.adoptes_parlement++;
    else if (statut.includes('promulgu')) statsData.promulgues++;
    else if (statut.includes('rejet')) statsData.rejetes++;
  });

  // ... (le reste du code historique 24 mois reste identique)
  const startDate = new Date(now.getFullYear(), now.getMonth() - 23, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthlyCounts: { [key: string]: number } = {};

  for (let d = new Date(startDate); d < endDate; d.setMonth(d.getMonth() + 1)) {
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[moisKey] = 0;
  }

  depotDates.forEach(d => {
    const moisKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyCounts[moisKey] !== undefined) monthlyCounts[moisKey]++;
  });

  statsData.historique = Object.entries(monthlyCounts)
    .map(([mois, count]) => ({ mois, count }))
    .sort((a, b) => a.mois.localeCompare(b.mois));

  const totalSur24Mois = statsData.historique.reduce((sum, item) => sum + item.count, 0);
  statsData.moyenne_mensuelle = statsData.historique.length 
    ? Math.round(totalSur24Mois / statsData.historique.length) 
    : 0;

} catch (error) {
  console.error('❌ Erreur Supabase KPIs :', error);
}

// Données graphique
const chartData = statsData.historique.slice(-24).map(({ mois, count }) => {
  const [year, month] = mois.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(year, month - 1));
  return { month: `${monthName}-${year}`, dossiers: count, year };
});

export default async function KpisPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">KPIs Parlement</h1>
        <p className="text-xl text-muted-foreground">Activité législative en temps réel</p>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
            <CardDescription>Dossiers législatifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary">
              {statsData.total_dossiers.toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ce mois-ci</CardTitle>
            <CardDescription>Dossiers déposés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary">
              {statsData.mois_courant.toLocaleString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyenne mensuelle</CardTitle>
            <CardDescription>Sur les 24 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary">
              {statsData.moyenne_mensuelle}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique principal */}
      <MonthlyDossiersChart data={chartData} />

            {/* Nouvelles cartes par statut */}
      <div className="mt-8">
        <h2 className="text-4xl font-semibold mb-6">État des dossiers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">En traitement</CardTitle>
              <CardDescription>Le texte a été déposé au parlement (Assemblée Natioanle ou Sénat) et est étudié pour décision</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-blue-600">{statsData.en_cours.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adoptés par l'Assemblée Nationale</CardTitle>
              <CardDescription>L'Assemblée Nationale a adopté. Prochaine étape est l'étude par le Sénat</CardDescription>

            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-emerald-600">{statsData.adoptes_an.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adoptés par le Sénat</CardTitle>
               <CardDescription>Le Sénat a adopté. Prochaine étape est l'étude par l'assemblée Nationale</CardDescription>

            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-emerald-600">{statsData.adoptes_senat.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adoptés par le Parlement</CardTitle>
              <CardDescription>Les deux assemblées (Nationale et Sénat) on adopté le texte. Prochaine étape est sa promulgation par le Présendent de la république</CardDescription>

            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-emerald-600">{statsData.adoptes_parlement.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Promulgués</CardTitle>
              <CardDescription>Le Président de la République a promulgué la loi. La loi est publiée au Journal officiel, entre en vigueur, et nécessite souvent des décrets d’application pour être pleinement applicable</CardDescription>

            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-purple-600">{statsData.promulgues.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rejetés</CardTitle>
              <CardDescription>La loi est abandonnée, sauf si le gouvernement décide de déposer un nouveau projet ou une version modifiée du texte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-red-600">{statsData.rejetes.toLocaleString('fr-FR')}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}