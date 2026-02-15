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

// Signature avec await pour searchParams (Server Component).
export default async function DossiersLegislatifsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams; // Unwrap la Promise.
  const ITEMS_PER_PAGE = 10; // On peut ajuster ça plus tard, ex. 20 si tu veux plus d'items visibles.

  // Récupération et validation des params URL.
  const statutFilter = typeof resolvedParams.statut === 'string' ? resolvedParams.statut.toLowerCase() : undefined;
  const validStatuts = ['en_cours', 'promulguee'];
  const statut = validStatuts.includes(statutFilter ?? '') ? statutFilter : undefined;

  const ageFilter = typeof resolvedParams.age === 'string' ? resolvedParams.age.toLowerCase() : undefined;
  const validAges = ['moins_6m', '6m_1a', 'plus_1a'];
  const age = validAges.includes(ageFilter ?? '') ? ageFilter : undefined;

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

const procedure = typeFilter ? procedureMap[typeFilter] : undefined;


  // Fetch Supabase avec filtre statut (si présent).
let query = supabase
  .from('dossiers_legislatifs')
  .select('*, initiateur_acteur_ref!inner(uid, nom, prenom, roles_text, groupe:organes(uid, libelle)), actes_legislatifs!actes_legislatifs_dossier_uid_fkey(date_acte), textes_count: textes!dossier_ref(count), date_promulgation');  
 
 
 
  if (statut) {
    query = query.eq('statut_final', statut);
  }

  if (procedure) {
  query = query.eq('procedure_libelle', procedure);
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

  // Filtrage par âge (post-fetch en JS si param présent).
  let filteredDossiers = dossiers;

  if (age) {
    const today = new Date(); // Date actuelle pour calcul jours écoulés.

    filteredDossiers = filteredDossiers.filter((dossier) => {
      const actes = dossier.actes_legislatifs || [];
      const actesAvecDates = actes.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
      const minDate = actesAvecDates.sort((x, y) => new Date(x.date_acte).getTime() - new Date(y.date_acte).getTime())[0]?.date_acte;

      if (!minDate) return false; // Ignore si pas de date valide.

      const startDate = new Date(minDate);
      const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (age === 'moins_6m') return daysElapsed < 180;
      if (age === '6m_1a') return daysElapsed >= 180 && daysElapsed <= 365;
      if (age === 'plus_1a') return daysElapsed > 365;
      return false; // Fallback.
    });
  }



 const sortedDossiers = dossiers || [];



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des Dossiers Législatifs</h1>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Un dossier législatif, c’est le parcours complet d’une proposition ou d’un projet de loi, depuis son dépôt jusqu’à sa promulgation (ou son abandon). On y trouve tous les textes, débats, votes et étapes réelles, pas seulement la théorie.
      </p>

      <p className="text-xs text-muted-foreground mb-8">
        Données de la 17ième legislature provenant de{' '}
        <a href="https://data.assemblee-nationale.fr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          data.assemblee-nationale.fr
        </a>
      </p>

      {/* Filtres (avec labels et gap pour espacement) */}
      <div className="mb-4 flex items-center gap-4">
          <StatutFilter />
          <AgeFilter />
          <TypeFilter uniqueTypes={uniqueTypes} procedureMap={procedureMap} />
          <ResetButton />
                </div>

      <div className="mb-4 text-sm text-gray-600">
      {finalTotalCount} dossier{(totalCount || 0) > 1 ? 's' : ''} trouvé{(totalCount || 0) > 1 ? 's' : ''}.      </div>

{sortedDossiers.length === 0 ? (
  <div className="text-center text-gray-600 mb-4">Aucun dossier législatif trouvé avec ces filtres.</div>
) : (

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
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    dossier.statut_final === 'promulguee' ? 'bg-green-100 text-green-800' :
                    dossier.statut_final === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {dossier.statut_final.charAt(0).toUpperCase() + dossier.statut_final.slice(1)}
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
  const actes = dossier.actes_legislatifs || [];
  const actesAvecDates = actes.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
  const sortedActes = actesAvecDates.sort((a, b) => new Date(a.date_acte).getTime() - new Date(b.date_acte).getTime());
  const premiereDate = sortedActes[0]?.date_acte;

  if (!premiereDate) {
    return <p className="text-gray-600 text-sm mt-2">Date de dépôt : Inconnue</p>;
  }

  const formattedDepotDate = new Date(premiereDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (dossier.statut_final === 'promulguee' && dossier.date_promulgation) {
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
      )}


      {sortedDossiers.length === 0 ? (
  <div className="text-center text-gray-600 mb-4">Aucun dossier législatif trouvé avec ces filtres.</div>
) : (
  <>
    <ul className="space-y-2">
      {/* Tes map sur sortedDossiers... */}
    </ul>
    {/* Nouveau : Pagination ici */}
    <Pagination className="mt-6 justify-center">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
  href={`?page=${currentPage - 1}${resolvedParams.statut ? `&statut=${resolvedParams.statut}` : ''}${resolvedParams.age ? `&age=${resolvedParams.age}` : ''}${resolvedParams.type ? `&type=${resolvedParams.type}` : ''}`}
  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
/>
        </PaginationItem>
        {/* Exemple simple pour 3 pages visibles + ellipses si plus */}
        {currentPage > 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink href={`?page=${currentPage - 1}${resolvedParams.statut ? `&statut=$   {resolvedParams.statut}` : ''}${resolvedParams.age ? `&age=   $${resolvedParams.age}` : ''}${resolvedParams.type ? `&type=$$   {resolvedParams.type}` : ''}`}>{currentPage - 1}</PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationLink href={`?page=${currentPage}${resolvedParams.statut ? `&statut=$  {resolvedParams.statut}` : ''}${resolvedParams.age ? `&age=   $${resolvedParams.age}` : ''}${resolvedParams.type ? `&type=$$   {resolvedParams.type}` : ''}`} isActive>
            {currentPage}
          </PaginationLink>
        </PaginationItem>
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink href={`?page=${currentPage + 1}${resolvedParams.statut ? `&statut=$   {resolvedParams.statut}` : ''}${resolvedParams.age ? `&age=   $${resolvedParams.age}` : ''}${resolvedParams.type ? `&type=$$   {resolvedParams.type}` : ''}`}>{currentPage + 1}</PaginationLink>
          </PaginationItem>
        )}
        {currentPage < totalPages - 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
        <PaginationItem>
          <PaginationNext
            href={`?page=${currentPage + 1}${resolvedParams.statut ? `&statut=$   {resolvedParams.statut}` : ''}${resolvedParams.age ? `&age=   $${resolvedParams.age}` : ''}${resolvedParams.type ? `&type=$$   {resolvedParams.type}` : ''}`}
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