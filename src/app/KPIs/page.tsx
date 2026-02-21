// src/app/KPIs/page.tsx

'use server';

import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MonthlyDossiersChart } from '@/components/ui/MonthlyDossiersChart';
import GenericFilter from '@/components/GenericFilter';
import ResetButton from '@/components/ResetButton';

export default async function KpisPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const resolvedParams = await searchParams;

  // === Extraction du filtre type (exactement comme dans dossiers-legislatifs) ===
  const typeFilter = typeof resolvedParams.type === 'string' 
    ? resolvedParams.type.toLowerCase() 
    : undefined;

    const groupeFilter = typeof resolvedParams.groupe === 'string' 
   ? resolvedParams.groupe.toLowerCase() 
   : undefined;



// ────────────────────────────────────────────────
// PARALLÉLISATION : on lance les deux fetches en même temps
// ────────────────────────────────────────────────

// 1. Promesse pour les types (sans await)
const typesPromise = supabase
  .from('dossiers_legislatifs')
  .select('procedure_libelle')
  .not('procedure_libelle', 'is', null);

// 2. Promesse pour les groupes (sans await)
const groupesPromise = supabase
  .from('dossiers_legislatifs')
  .select('initiateur_groupe_libelle')
  .not('initiateur_groupe_libelle', 'is', null);

// 3. On attend les DEUX en parallèle
const [typesResult, groupesResult] = await Promise.all([typesPromise, groupesPromise]);


// ────────────────────────────────────────────────
// Traitement des résultats
// ────────────────────────────────────────────────


const toSlug = (str: string) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+$/, '');

const uniqueTypes = [...new Set(typesResult.data?.map(item => item.procedure_libelle) || [])].sort();
const procedureMap: { [key: string]: string } = {};
uniqueTypes.forEach(type => { procedureMap[toSlug(type)] = type; });
const typeOptions = uniqueTypes.map(libelle => ({ slug: toSlug(libelle), libelle }));
const procedure = typeFilter ? procedureMap[typeFilter] : undefined;

const uniqueGroupesLibelles = [...new Set(groupesResult.data?.map(item => item.initiateur_groupe_libelle) || [])].sort();
const groupeMap: { [key: string]: string } = {};
uniqueGroupesLibelles.forEach(libelle => { groupeMap[toSlug(libelle)] = libelle; });
const groupeOptions = uniqueGroupesLibelles.map(libelle => ({ slug: toSlug(libelle), libelle }));
const groupe = groupeFilter ? groupeMap[groupeFilter] : undefined;





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
  // ────────────────────────────────────────────────────────────────
  // Construction de la requête de base
  let query = supabase
    .from('dossiers_legislatifs')
    .select('date_depot, statut_final')
    .not('date_depot', 'is', null)
    .order('date_depot', { ascending: false })
    .limit(10000);

  // Appliquer le filtre sur procedure_libelle SI présent
  if (procedure) {
    query = query.eq('procedure_libelle', procedure);
  }

  if (groupe) {
    query = query.eq('initiateur_groupe_libelle', groupe);
  }

  const { data: dossiers, error } = await query;

  if (error) throw error;

  statsData.total_dossiers = dossiers?.length || 0;

  const now = new Date();
  const moisCourantStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const depotDates = (dossiers || [])
    .map((row: any) => row.date_depot ? new Date(row.date_depot) : null)
    .filter((date): date is Date => date !== null && !isNaN(date.getTime()));

  statsData.mois_courant = depotDates.filter(d => d >= moisCourantStart).length;

  // Calcul des statuts (inchangé)
  dossiers?.forEach((d: any) => {
    const statut = d.statut_final?.toLowerCase() || 'inconnu';

    if (statut === 'en_cours' || statut.includes('cours')) statsData.en_cours++;
    else if (statut.includes('an') || statut.includes('assemblée') || statut.includes('assemblee')) statsData.adoptes_an++;
    else if (statut.includes('sénat')) statsData.adoptes_senat++;
    else if (statut.includes('parlement') || statut.includes('navette') || statut === 'adopté') statsData.adoptes_parlement++;
    else if (statut.includes('promulgu')) statsData.promulgues++;
    else if (statut.includes('rejet')) statsData.rejetes++;
  });

  // Calcul historique mensuel (inchangé)
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


return (
  <div className="container mx-auto py-8 px-4">
    {/* Titre + filtre en haut – même style que la page dossiers */}
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-4xl font-bold mb-2">KPIs Parlement</h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Activité de la 17ᵉ législature en temps réel
          {procedure && <span className="ml-2 font-medium text-sm text-blue-600">[ {procedure} ]</span>}
          {groupe && <span className="ml-2 font-medium text-sm text-blue-600">[ {groupe} ]</span>}
        </p>
      </div>

      {/* Barre de filtres : Type + Groupe + Reset */}
      <div className="flex items-center gap-3 flex-nowrap overflow-x-auto pb-1">
        <GenericFilter
          paramName="type"
          label="Type de procédure"
          placeholder="Type de procédure"
          allLabel="Tous les types"
          tooltipTitle="Filtre par type de procédure"
          tooltipDescription="Ex : procédure législative ordinaire, projet de loi de finances, etc."
          options={typeOptions}
        />
        <GenericFilter
          paramName="groupe"
          label="Groupe politique"
          placeholder="Groupe politique"
          allLabel="Tous les groupes"
          tooltipTitle="Filtre par groupe politique initiateur"
          tooltipDescription="Ex : La France insoumise, Renaissance, Les Républicains..."
          options={groupeOptions}
        />
        <ResetButton />
      </div>
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
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">

    {/* Carte 1 - En traitement */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">En traitement</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le texte a été déposé au parlement (Assemblée Nationale ou Sénat) et est étudié pour décision
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-5xl font-bold">
          {statsData.en_cours.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 2 - Adoptés par l'Assemblée Nationale */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Adoptés par l'Assemblée Nationale</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          L'Assemblée Nationale a adopté. Prochaine étape : étude par le Sénat
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-5xl font-bold text-emerald-600">
          {statsData.adoptes_an.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 3 - Adoptés par le Sénat */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Adoptés par le Sénat</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le Sénat a adopté. Prochaine étape : étude par l'Assemblée Nationale
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-5xl font-bold text-emerald-600">
          {statsData.adoptes_senat.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 4 - Adoptés par le Parlement */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Adoptés par le Parlement</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Les deux assemblées ont adopté le texte. Prochaine étape : promulgation
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-5xl font-bold text-emerald-600">
          {statsData.adoptes_parlement.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 5 - Promulgués */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Promulgués</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          Le Président a promulgué la loi. Publication au Journal officiel
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-5xl font-bold text-purple-600">
          {statsData.promulgues.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

    {/* Carte 6 - Rejetés */}
    <Card className="grid grid-rows-[auto_1fr_auto] gap-2 text-center">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-medium">Rejetés</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-tight">
          La loi est abandonnée (sauf nouveau dépôt ou version modifiée)
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-center mt-6 md:mt-8">
        <div className="text-5xl font-bold text-red-600">
          {statsData.rejetes.toLocaleString('fr-FR')}
        </div>
      </div>
    </Card>

  </div>
</div>
    </div>
  );
}