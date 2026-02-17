// src/app/dossiers-legislatifs/page.tsx
// Page principale pour lister les dossiers législatifs.
// C'est un Server Component : fetch des données côté serveur pour sécurité et perf.
// On utilise Tailwind pour un style basique : liste en colonne, cartes sans bordure avec hover.

import { supabase } from '@/lib/supabase'; // Import du client Supabase.
import Link from 'next/link'; // Liens internes Next.js.
import { Sparkles, ExternalLink } from 'lucide-react'; // Icônes.
import StatutFilter from '@/components/StatutFilter'; // Filtre statut (client-side).
import AgeFilter from '@/components/AgeFilter'; // Filtre âge (client-side).
import TypeFilter from '@/components/TypeFilter';
import ResetButton from '@/components/ResetButton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';


// Fonction utilitaire pour générer une URL avec un nouveau 'page', en gardant tous les autres params.
function generatePageUrl(currentParams: { [key: string]: string | string[] | undefined }, newPage: number) {
  const params = new URLSearchParams();
  
  // Copie tous les params existants (statut, age, type, etc.)
  Object.entries(currentParams).forEach(([key, value]) => {
    if (key !== 'page' && value !== undefined) {  // Ignore 'page' et les undefined
      params.set(key, Array.isArray(value) ? value.join(',') : value);  // Gère les arrays si besoin futur
    }
  });
  
  // Ajoute le nouveau 'page'
  if (newPage > 1) {  // Pas besoin de 'page=1' dans l'URL
    params.set('page', newPage.toString());
  }
  
  return `?${params.toString()}`;
}

// Signature avec await pour searchParams (Server Component).
export default async function DossiersLegislatifsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams; // Unwrap la Promise.
  const ITEMS_PER_PAGE = 10; // On peut ajuster ça plus tard, ex. 20 si tu veux plus d'items visibles.

  // === NOUVEAU : Mapping des slugs URL vers les vraies valeurs en base ===
  const statutSlug = typeof resolvedParams.statut === 'string' 
    ? resolvedParams.statut.toLowerCase() 
    : undefined;

  const statutMap: { [key: string]: string } = {
    "en_cours_d_examen": "En cours d'examen",
    "adopte_par_assemblee": "Adopté par l'Assemblée nationale",
    "adopte_par_senat": "Adopté par le Sénat",
    "adopte_par_parlement": "Adopté par le Parlement",
    "rejetee": "Rejeté",
    "promulguee": "Promulguée",
  };

  const statut = statutSlug ? statutMap[statutSlug] : undefined;

  const ageFilter = typeof resolvedParams.age === 'string' ? resolvedParams.age.toLowerCase() : undefined;
  const validAges = ['moins_6m', '6m_1a', 'plus_1a'];
  const age = validAges.includes(ageFilter ?? '') ? ageFilter : undefined;

  // calculer les bornes (seulement si age est défini)
let sixMonthsAgo: Date | undefined;
let oneYearAgo: Date | undefined;

if (age) {
  const today = new Date(); // Date actuelle (serveur-side, donc UTC par défaut, mais ça marche pour des filtres approximatifs).
  
  // Calcul pour 6 mois en arrière
  sixMonthsAgo = new Date(today);
  sixMonthsAgo.setDate(today.getDate() - 180); // Soustrait 180 jours (approximation simple).
  
  // Calcul pour 1 an en arrière
  oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 365); // Soustrait 365 jours.
}

  const typeFilter = typeof resolvedParams.type === 'string' ? resolvedParams.type.toLowerCase() : undefined; 


  // Fetch des types uniques pour le filtre (distinct sur procedure_libelle, ignore null).
  const { data: uniqueProcedures } = await supabase
  .from('dossiers_legislatifs')
  .select('procedure_libelle')
  .not('procedure_libelle', 'is', null); // Ignore les null.

// Extraction des valeurs uniques et tri alphabétique.
const uniqueTypes = [...new Set(uniqueProcedures?.map(item => item.procedure_libelle) || [])].sort();

// Génère le mapping slug -> valeur DB dynamiquement.
const procedureMap: { [key: string]: string } = {};
uniqueTypes.forEach(type => {
  const slug = type.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retire accents.
    .replace(/[^a-z0-9]+/g, '_') // Remplace espaces/punctuation par '_'.
    .replace(/_+$/, ''); // Nettoie fin.
  procedureMap[slug] = type;
});

// === NOUVELLE VERSION : tableau optimisé pour TypeFilter ===
const typeOptions = uniqueTypes.map((libelle) => {
  const slug = Object.keys(procedureMap).find(
    (key) => procedureMap[key] === libelle
  ) || '';
  return { slug, libelle };
});

const procedure = typeFilter ? procedureMap[typeFilter] : undefined;


  // Fetch Supabase avec filtre statut (si présent).
let query = supabase
  .from('dossiers_legislatifs')
  .select('*, initiateur_acteur_ref(uid, nom, prenom, roles_text, groupe:organes(uid, libelle)), textes_count: textes!dossier_ref(count), date_promulgation') 
 
  if (statut) {
    query = query.eq('statut_final', statut);
  }

  if (procedure) {
  query = query.eq('procedure_libelle', procedure);
}

// Après les if pour statut et procedure...

if (age && sixMonthsAgo && oneYearAgo) {
  const sixMonthsAgoISO = sixMonthsAgo.toISOString(); // Convertit en format timestamp ISO pour Supabase.
  const oneYearAgoISO = oneYearAgo.toISOString();

  if (age === 'moins_6m') {
    query = query.gt('date_depot', sixMonthsAgoISO); // Plus récent que 6 mois en arrière.
  } else if (age === '6m_1a') {
    query = query.gt('date_depot', oneYearAgoISO) // Plus récent que 1 an en arrière...
               .lte('date_depot', sixMonthsAgoISO); // ...mais pas plus récent que 6 mois en arrière.
  } else if (age === 'plus_1a') {
    query = query.lte('date_depot', oneYearAgoISO); // Plus ancien ou égal à 1 an en arrière.
  }
}

// Query pour compter le total (duplique les filtres de la query principale)
let countQuery = supabase
  .from('dossiers_legislatifs')
  .select('uid', { count: 'exact' }); // Plus besoin du join sur groupe.

// Applique les mêmes filtres que sur la query principale
if (statut) {
  countQuery = countQuery.eq('statut_final', statut);
}
if (procedure) {
  countQuery = countQuery.eq('procedure_libelle', procedure);
}

// Après les if pour statut et procedure dans countQuery...

if (age && sixMonthsAgo && oneYearAgo) {
  const sixMonthsAgoISO = sixMonthsAgo.toISOString();
  const oneYearAgoISO = oneYearAgo.toISOString();

  if (age === 'moins_6m') {
    countQuery = countQuery.gt('date_depot', sixMonthsAgoISO);
  } else if (age === '6m_1a') {
    countQuery = countQuery.gt('date_depot', oneYearAgoISO)
                          .lte('date_depot', sixMonthsAgoISO);
  } else if (age === 'plus_1a') {
    countQuery = countQuery.lte('date_depot', oneYearAgoISO);
  }
}

const { count: totalCount, error: countError } = await countQuery;
let finalTotalCount = totalCount || 0; // Fallback si undefined.
if (countError) {
  console.error('Erreur lors du count des dossiers:', countError);
  finalTotalCount = 0; // Fallback safe pour éviter crash.
}
const totalPages = Math.ceil(finalTotalCount / ITEMS_PER_PAGE);




// Récupération et validation du paramètre page (similaire à tes autres filtres)
const pageParam = typeof resolvedParams.page === 'string' ? resolvedParams.page : undefined;
let currentPage = pageParam ? parseInt(pageParam, 10) : 1; // Convertit en nombre, fallback à 1 si absent.
if (isNaN(currentPage) || currentPage < 1) {
  currentPage = 1; // Garde au minimum 1 si invalide.
}
// Optionnel : Limite à totalPages max, mais on le fera après car totalPages est calculé plus bas.
let offset = (currentPage - 1) * ITEMS_PER_PAGE; // Calcule l'offset dynamique.

if (currentPage > totalPages) {
  currentPage = totalPages; // Ramène à la dernière page valide.
}


query = query
  .order('date_depot', { ascending: false })   // Du plus récent au plus ancien
  .range(offset, offset + ITEMS_PER_PAGE - 1);


  const { data: dossiers, error } = await query;




 const sortedDossiers = dossiers || [];



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des Dossiers Législatifs</h1>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Un dossier législatif, c’est le parcours complet d’une proposition ou d’un projet de loi, depuis son dépôt jusqu’à sa promulgation (ou son abandon). On y trouve tous les textes, débats, votes et étapes réelles, pas seulement la théorie.
      </p>

      <p className="text-xs text-muted-foreground mb-8">
        Données de la 17ième legislature, mise à jours quotidiennement, provenant de{' '}
        <a href="https://data.assemblee-nationale.fr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          data.assemblee-nationale.fr
        </a>
      </p>

      {/* Filtres (avec labels et gap pour espacement) */}
      <div className="mb-4 flex items-center gap-4">
          <StatutFilter />
          <AgeFilter />
          <TypeFilter typeOptions={typeOptions} />
          <ResetButton />
                </div>

      <div className="mb-4 text-sm text-gray-600">
      {finalTotalCount} dossier{(totalCount || 0) > 1 ? 's' : ''} trouvé{(totalCount || 0) > 1 ? 's' : ''}.      </div>


      {sortedDossiers.length === 0 ? (
  <div className="text-center text-gray-600 mb-4">Aucun dossier législatif trouvé avec ces filtres.</div>
) : (
  <>
    <ul className="space-y-2">
        {sortedDossiers.map((dossier) => (
          <li key={dossier.uid}>
            <div className="p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors duration-200">
              <h2 className="text-l font-semibold mb-3">{dossier.titre}</h2>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="text-red-800 uppercase px-2">{dossier.procedure_libelle}</span>
                {dossier.initiateur_acteur_ref && (
                  <>
                    <span>•</span>
                    <span className="px-2">{`${dossier.initiateur_acteur_ref.prenom} ${dossier.initiateur_acteur_ref.nom}`}</span>
                    <span>•</span>
                    <span className="px-2">{dossier.initiateur_acteur_ref.roles_text ?? 'Non spécifié'}</span>
                  </>
                )}
                {dossier.initiateur_acteur_ref?.groupe && (
                  <>
                    <span>•</span>
                    <span className="px-2">{dossier.initiateur_acteur_ref.groupe.libelle ?? 'Mandat terminé'}</span>
                  </>
                )}
                 <span
  className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${
    dossier.statut_final === "Promulguée"
      ? "bg-green-100 text-green-800 border-green-200"
      : dossier.statut_final === "Rejeté"
      ? "bg-red-100 text-red-800 border-red-200"
      : dossier.statut_final === "En cours d'examen"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : dossier.statut_final === "Adopté par le Parlement"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : dossier.statut_final === "Adopté par l'Assemblée nationale"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : dossier.statut_final === "Adopté par le Sénat"
      ? "bg-indigo-100 text-indigo-800 border-indigo-200"
      : "bg-gray-100 text-gray-700 border-gray-200"
  }`}
>
  {dossier.statut_final}
</span>
              </div>

              <div className="flex items-center space-x-4 text-sm mt-2">
                <Link href={`/dossiers-legislatifs/${dossier.uid}/resume-ia`} target="_blank" className="flex items-center text-blue-500 hover:underline px-2">
                  <Sparkles className="w-4 h-3 mr-2" /> Résumé et discussion IA
                </Link>
                {dossier.lien_an && (
                  <a href={dossier.lien_an} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline px-2">
                    <ExternalLink className="w-4 h-3 mr-2" /> Dossier Assemblée Nationale
                  </a>
                )}
                {dossier.senat_chemin && (
                  <a href={dossier.senat_chemin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline px-2">
                    <ExternalLink className="w-4 h-3 mr-2" /> Dossier Sénat
                  </a>
                )}
                {dossier.url_legifrance && (
                  <a href={dossier.url_legifrance} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline px-2">
                    <ExternalLink className="w-4 h-3 mr-2" /> Légifrance
                  </a>
                )}
              </div>

{(() => {
// Extraction commune de la date de dépôt (première acte valide)

const premiereDate = dossier.date_depot;  // Directement la colonne officielle (timestamp ISO)

  if (!premiereDate) {
    return <p className="text-gray-600 text-sm mt-2">Date de dépôt : Inconnue</p>;
  }

  const formattedDepotDate = new Date(premiereDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (dossier.statut_final === "Promulguée" && dossier.date_promulgation) {
    // Cas promulgué : jours entre dépôt et promulgation
    const startDate = new Date(premiereDate);
    const promulDate = new Date(dossier.date_promulgation);
    const daysElapsed = Math.floor((promulDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const formattedPromulDate = promulDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const daysText = daysElapsed >= 0 ? `après ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date invalide';

    return (
      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
        <p className="px-2">Date de dépôt : {formattedDepotDate}</p>
        <p className="px-2">Promulguée le {formattedPromulDate} {daysText}</p>
      </div>
    );
  } else {
    // Cas par défaut (en cours) : jours depuis dépôt jusqu'à aujourd'hui
    const today = new Date();
    const startDate = new Date(premiereDate);
    const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysText = daysElapsed >= 0 ? `Depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date future';

    return (
      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
        <p className="px-2">Date de dépôt : {formattedDepotDate}</p>
        <p className="px-2">{daysText}</p>
      </div>
    );
  }
})()}

<p className="text-xs text-gray-400 text-right mt-1"> {/* mt-1 pour un petit espacement */}
  Debug: UID du dossier : {dossier.uid}
</p>

            </div>
          </li>
        ))}
      </ul>


{/* Nouveau : Pagination ici */}
<Pagination className="mt-6 justify-center">
  <PaginationContent>
    {/* Bouton Précédent : Désactivé si page 1 */}
    <PaginationItem>
      <PaginationPrevious
        href={generatePageUrl(resolvedParams, currentPage - 1)}
        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
      />
    </PaginationItem>

    {/* Ellipsis gauche si plus de 2 pages avant */}
    {currentPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

    {/* Lien vers page précédente (si existe) */}
    {currentPage > 1 && (
      <PaginationItem>
        <PaginationLink href={generatePageUrl(resolvedParams, currentPage - 1)}>
          {currentPage - 1}
        </PaginationLink>
      </PaginationItem>
    )}

    {/* Page actuelle : Marquée comme active */}
    <PaginationItem>
      <PaginationLink href={generatePageUrl(resolvedParams, currentPage)} isActive>
        {currentPage}
      </PaginationLink>
    </PaginationItem>

    {/* Lien vers page suivante (si existe) */}
    {currentPage < totalPages && (
      <PaginationItem>
        <PaginationLink href={generatePageUrl(resolvedParams, currentPage + 1)}>
          {currentPage + 1}
        </PaginationLink>
      </PaginationItem>
    )}

    {/* Ellipsis droite si plus de 1 page après */}
    {currentPage < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}

    {/* Bouton Suivant : Désactivé si dernière page */}
    <PaginationItem>
      <PaginationNext
        href={generatePageUrl(resolvedParams, currentPage + 1)}
        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
  </>
)}


    </div>
  );
}