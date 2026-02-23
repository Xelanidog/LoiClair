// src/app/dossiers-legislatifs/page.tsx
// Page principale pour lister les dossiers législatifs.
// C'est un Server Component : fetch des données côté serveur pour sécurité et perf.
// On utilise Tailwind pour un style basique : liste en colonne, cartes sans bordure avec hover.

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';
import GenericFilter from '@/components/GenericFilter';
import ResetButton from '@/components/ResetButton';
import SearchInput from '@/components/SearchInput';
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
  const groupeFilter = typeof resolvedParams.groupe === 'string' ? resolvedParams.groupe.toLowerCase() : undefined;
  const keyword = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : undefined;


  // Helper pour générer un slug à partir d'un libellé
  const toSlug = (str: string) =>
    str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '');

  // Fetch des types, groupes ET acteurs correspondant au mot-clé en parallèle
  const [{ data: uniqueProcedures }, { data: uniqueGroupes }, { data: matchingActeurs }] = await Promise.all([
    supabase.from('dossiers_legislatifs').select('procedure_libelle').not('procedure_libelle', 'is', null),
    supabase.from('dossiers_legislatifs').select('initiateur_groupe_libelle').not('initiateur_groupe_libelle', 'is', null),
    keyword
      ? supabase.from('acteurs').select('uid').or(`nom.ilike.%${keyword}%,prenom.ilike.%${keyword}%`)
      : Promise.resolve({ data: [] as { uid: string }[] }),
  ]);

  // UIDs des acteurs dont le nom/prénom correspond au mot-clé
  const acteurUids = (matchingActeurs ?? []).map(a => a.uid);

  // Types : extraction, dédoublonnage, mapping slug → DB
  const uniqueTypes = [...new Set(uniqueProcedures?.map(item => item.procedure_libelle) || [])].sort();
  const procedureMap: { [key: string]: string } = {};
  uniqueTypes.forEach(type => { procedureMap[toSlug(type)] = type; });
  const typeOptions = uniqueTypes.map(libelle => ({ slug: toSlug(libelle), libelle }));
  const procedure = typeFilter ? procedureMap[typeFilter] : undefined;

  // Groupes : extraction, dédoublonnage, mapping slug → DB
  const uniqueGroupesLibelles = [...new Set(uniqueGroupes?.map(item => item.initiateur_groupe_libelle) || [])].sort();
  const groupeMap: { [key: string]: string } = {};
  uniqueGroupesLibelles.forEach(libelle => { groupeMap[toSlug(libelle)] = libelle; });
  const groupeOptions = uniqueGroupesLibelles.map(libelle => ({ slug: toSlug(libelle), libelle }));


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

if (groupeFilter && groupeMap[groupeFilter]) {
  query = query.eq('initiateur_groupe_libelle', groupeMap[groupeFilter]);
}

// Helper pour appliquer les mêmes filtres sur n'importe quelle query
function applyFilters(q: any) {
  if (statut) q = q.eq('statut_final', statut);
  if (procedure) q = q.eq('procedure_libelle', procedure);
  if (age && sixMonthsAgo && oneYearAgo) {
    const sixMonthsAgoISO = sixMonthsAgo.toISOString();
    const oneYearAgoISO = oneYearAgo.toISOString();
    if (age === 'moins_6m') q = q.gt('date_depot', sixMonthsAgoISO);
    else if (age === '6m_1a') q = q.gt('date_depot', oneYearAgoISO).lte('date_depot', sixMonthsAgoISO);
    else if (age === 'plus_1a') q = q.lte('date_depot', oneYearAgoISO);
  }
  if (groupeFilter && groupeMap[groupeFilter]) q = q.eq('initiateur_groupe_libelle', groupeMap[groupeFilter]);
  if (keyword) {
    if (acteurUids.length > 0) {
      // Cherche dans le titre OU parmi les auteurs connus
      q = q.or(`titre.ilike.%${keyword}%,initiateur_acteur_ref.in.(${acteurUids.join(',')})`)
    } else {
      // Aucun acteur ne correspond → filtre uniquement sur le titre
      q = q.ilike('titre', `%${keyword}%`);
    }
  }
  return q;
}

// Pagination : récupérer et valider le paramètre page
const pageParam = typeof resolvedParams.page === 'string' ? resolvedParams.page : undefined;
let currentPage = pageParam ? parseInt(pageParam, 10) : 1;
if (isNaN(currentPage) || currentPage < 1) currentPage = 1;
const offset = (currentPage - 1) * ITEMS_PER_PAGE;

// Count et données principales en parallèle (même filtres, pas de duplication)
const countQuery = applyFilters(supabase.from('dossiers_legislatifs').select('uid', { count: 'exact' }));
query = applyFilters(query).order('date_depot', { ascending: false }).range(offset, offset + ITEMS_PER_PAGE - 1);

const [{ count: totalCount, error: countError }, { data: dossiers, error }] = await Promise.all([countQuery, query]);

let finalTotalCount = totalCount || 0;
if (countError) {
  console.error('Erreur lors du count des dossiers:', countError);
  finalTotalCount = 0;
}
const totalPages = Math.ceil(finalTotalCount / ITEMS_PER_PAGE);
if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;




 const sortedDossiers = dossiers || [];



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des textes</h1>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Les textes sont organisés par dossiers législatifs. Un dossier législatif, c’est le parcours complet d’une proposition ou d’un projet de loi, depuis son dépôt jusqu’à sa promulgation (ou son abandon). On y trouve tous les textes, débats, votes et étapes réelles, pas seulement la théorie.
      </p>

      <p className="text-xs text-muted-foreground mb-8">
        Données de la 17ième legislature, mise à jours quotidiennement, provenant de{' '}
        <a href="https://data.assemblee-nationale.fr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          data.assemblee-nationale.fr
        </a>
      </p>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput />
          <GenericFilter
            paramName="statut"
            label="Statut du dossier"
            placeholder="Filtrer par statut"
            allLabel="Tous les statuts"
            options={[
              { slug: 'en_cours_d_examen', libelle: "En cours d'examen" },
              { slug: 'adopte_par_assemblee', libelle: "Adopté par l'Assemblée nationale" },
              { slug: 'adopte_par_senat', libelle: "Adopté par le Sénat" },
              { slug: 'adopte_par_parlement', libelle: "Adopté par le Parlement" },
              { slug: 'rejetee', libelle: "Rejeté" },
              { slug: 'promulguee', libelle: "Promulguée" },
            ]}
          />
          <GenericFilter
            paramName="age"
            label="Âge du dossier"
            placeholder="Sélectionner une tranche d'âge"
            allLabel="Toutes les dates"
            options={[
              { slug: 'moins_6m', libelle: 'Moins de 6 mois' },
              { slug: '6m_1a', libelle: 'Entre 6 mois et 1 an' },
              { slug: 'plus_1a', libelle: "Plus d'1 an" },
            ]}
            validValues={['moins_6m', '6m_1a', 'plus_1a']}
          />
          <GenericFilter
            paramName="type"
            label="Type de procédure"
            placeholder="Type de procédure"
            allLabel="Tous les types"
            options={typeOptions}
          />
          <GenericFilter
            paramName="groupe"
            label="Groupe politique"
            placeholder="Groupe politique"
            allLabel="Tous les groupes"
            options={groupeOptions}
          />
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
  const depotDateRaw: string | null = dossier.date_depot;

  if (!depotDateRaw) {
    return <p className="text-gray-600 text-sm mt-2">Date de dépôt : Inconnue</p>;
  }

  const depotDateObj = new Date(depotDateRaw);
  if (isNaN(depotDateObj.getTime())) {
    return <p className="text-gray-600 text-sm mt-2">Date de dépôt : Format invalide</p>;
  }

  // Affichage en français + timezone France (évite décalage de jour sur Vercel UTC)
  const formattedDepotDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeZone: 'Europe/Paris',
  }).format(depotDateObj);

  if (dossier.statut_final === "Promulguée" && dossier.date_promulgation) {
    // Cas promulgué : jours entre dépôt et promulgation
    const promulDateObj = new Date(dossier.date_promulgation);
    if (isNaN(promulDateObj.getTime())) {
      return (
        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
          <p className="px-2">Date de dépôt : {formattedDepotDate}</p>
          <p className="px-2">Promulguée : date invalide</p>
        </div>
      );
    }

    const daysElapsed = Math.floor(
      (promulDateObj.getTime() - depotDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    const formattedPromulDate = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeZone: 'Europe/Paris',
    }).format(promulDateObj);

    const daysText =
      daysElapsed >= 0 ? `après ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date invalide';

    return (
      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
        <p className="px-2">Date de dépôt : {formattedDepotDate}</p>
        <p className="px-2">Promulguée le {formattedPromulDate} {daysText}</p>
      </div>
    );
  } else {
    // Cas par défaut (en cours) : jours depuis dépôt jusqu'à aujourd'hui
    const today = new Date();
    const daysElapsed = Math.floor(
      (today.getTime() - depotDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysText =
      daysElapsed >= 0 ? `Depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date future';

    return (
      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
        <p className="px-2">Date de dépôt : {formattedDepotDate}</p>
        <p className="px-2">{daysText}</p>
      </div>
    );
  }
})()}


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