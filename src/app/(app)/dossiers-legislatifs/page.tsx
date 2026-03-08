// src/app/dossiers-legislatifs/page.tsx
// Page principale pour lister les dossiers législatifs.

export const revalidate = 3600; // Cache 1h — données mises à jour une fois par nuit
// C'est un Server Component : fetch des données côté serveur pour sécurité et perf.
// On utilise Tailwind pour un style basique : liste en colonne, cartes sans bordure avec hover.

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import ShimmerText from '@/components/ShimmerText';
import GenericFilter from '@/components/GenericFilter';
import ResetButton from '@/components/ResetButton';
import SearchInput from '@/components/SearchInput';
import ProcedureTooltip from '@/components/ProcedureTooltip';
import { DEFINITIONS } from '@/lib/definitions';
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
  const themeFilter = typeof resolvedParams.theme === 'string' ? resolvedParams.theme.toLowerCase() : undefined;
  const keyword = typeof resolvedParams.q === 'string' ? resolvedParams.q.trim() : undefined;


  // Helper pour générer un slug à partir d'un libellé
  const toSlug = (str: string) =>
    str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '');

  // Fetch des types, groupes, thèmes ET acteurs correspondant au mot-clé en parallèle
  const [{ data: uniqueProcedures }, { data: uniqueGroupes }, { data: uniqueThemes }, { data: matchingActeurs }] = await Promise.all([
    supabase.from('dossiers_legislatifs').select('procedure_libelle').not('procedure_libelle', 'is', null),
    supabase.from('dossiers_legislatifs').select('initiateur_groupe_libelle').not('initiateur_groupe_libelle', 'is', null),
    supabase.from('dossiers_legislatifs').select('themes').not('themes', 'is', null),
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

  // Thèmes : extraction (flatten des arrays), dédoublonnage, mapping slug → DB
  const allThemes = (uniqueThemes ?? []).flatMap(item => item.themes ?? []);
  const uniqueThemesList = [...new Set(allThemes)].sort();
  const themeMap: { [key: string]: string } = {};
  uniqueThemesList.forEach(libelle => { themeMap[toSlug(libelle)] = libelle; });
  const themeOptions = uniqueThemesList.map(libelle => ({ slug: toSlug(libelle), libelle }));

  // Fetch Supabase avec filtre statut (si présent).
let query = supabase
  .from('dossiers_legislatifs')
  .select('*, initiateur_acteur_ref(uid, nom, prenom, roles_text, groupe:organes(uid, libelle)), textes_count: textes!dossier_ref(count), date_promulgation')

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
  if (themeFilter && themeMap[themeFilter]) q = q.contains('themes', [themeMap[themeFilter]]);
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


  // Requêtes batch pour les dossiers affichés
  const dossierUids = sortedDossiers.map(d => d.uid);
  const { data: textesAccessibles } = await supabase
    .from('textes')
    .select('dossier_ref')
    .in('dossier_ref', dossierUids)
    .eq('url_accessible', true);

  // Set des dossiers ayant au moins 1 texte accessible
  const dossiersWithAccessibleTexte = new Set((textesAccessibles ?? []).map(t => t.dossier_ref));

  // Fallback auteur : pour les dossiers sans initiateur, utiliser l'auteur du premier texte associé
  const uidsWithoutInitiateur = sortedDossiers
    .filter(d => !d.initiateur_acteur_ref)
    .map(d => d.uid);

  type FallbackActeur = { prenom: string | null; nom: string | null; roles_text: string | null; groupe: { uid: string; libelle: string } | null };
  const fallbackActeursByDossier = new Map<string, FallbackActeur>();

  if (uidsWithoutInitiateur.length > 0) {
    const { data: textesWithAuthors } = await supabase
      .from('textes')
      .select('dossier_ref, auteurs_refs')
      .in('dossier_ref', uidsWithoutInitiateur)
      .not('auteurs_refs', 'is', null);

    const acteurRefMap = new Map<string, string>(); // dossierUid → premier acteurRef
    for (const texte of textesWithAuthors ?? []) {
      if (!acteurRefMap.has(texte.dossier_ref) && texte.auteurs_refs) {
        const firstRef = Array.isArray(texte.auteurs_refs) ? texte.auteurs_refs[0] : texte.auteurs_refs?.split(',')[0]?.trim();
        if (firstRef) acteurRefMap.set(texte.dossier_ref, firstRef);
      }
    }

    const acteurRefs = [...new Set(acteurRefMap.values())];
    if (acteurRefs.length > 0) {
      const { data: acteursData } = await supabase
        .from('acteurs')
        .select('uid, nom, prenom, roles_text, groupe:organes(uid, libelle)')
        .in('uid', acteurRefs);

      const acteursMap = new Map((acteursData ?? []).map(a => [a.uid, a]));
      for (const [dossierUid, acteurRef] of acteurRefMap) {
        const acteur = acteursMap.get(acteurRef);
        if (acteur) fallbackActeursByDossier.set(dossierUid, acteur as unknown as FallbackActeur);
      }
    }
  }

  // Helper : calcul du texte de durée pour l'en-tête de la carte
  function getDaysInfo(dossier: typeof sortedDossiers[0]): string {
    const depotDateRaw: string | null = dossier.date_depot;
    if (!depotDateRaw) return '';
    const depotDate = new Date(depotDateRaw);
    if (isNaN(depotDate.getTime())) return '';

    if (dossier.statut_final === "Promulguée" && dossier.date_promulgation) {
      const promulDate = new Date(dossier.date_promulgation);
      if (isNaN(promulDate.getTime())) return '';
      const days = Math.floor((promulDate.getTime() - depotDate.getTime()) / 86400000);
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    const days = Math.floor((Date.now() - depotDate.getTime()) / 86400000);
    return `${days >= 0 ? days : 0} jour${days > 1 ? 's' : ''}`;
  }

  // Helper : date de dépôt formatée
  function formatDepotDate(dateRaw: string | null): string {
    if (!dateRaw) return '';
    const d = new Date(dateRaw);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(d);
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-3">Liste des textes</h1>
        <p className="text-muted-foreground">
          Les textes sont organisés par dossiers législatifs. Un dossier législatif, c’est le parcours complet d’une proposition ou d’un projet de loi, depuis son dépôt jusqu’à sa promulgation (ou son abandon).
        </p>
      </div>

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
          <GenericFilter
            paramName="theme"
            label="Thème"
            placeholder="Filtrer par thème"
            allLabel="Tous les thèmes"
            options={themeOptions}
          />
          <ResetButton />
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
      {finalTotalCount} dossier{(totalCount || 0) > 1 ? 's' : ''} trouvé{(totalCount || 0) > 1 ? 's' : ''}.      </div>


      {sortedDossiers.length === 0 ? (
  <div className="text-center text-muted-foreground mb-4">Aucun dossier législatif trouvé avec ces filtres.</div>
) : (
  <>
    <ul className="divide-y divide-border">
        {sortedDossiers.map((dossier) => {
          const daysInfo = getDaysInfo(dossier);
          const depotDate = formatDepotDate(dossier.date_depot);
          const textesCount = (dossier.textes_count as { count: number }[] | null)?.[0]?.count ?? 0;
          const hasAccessibleTexte = dossiersWithAccessibleTexte.has(dossier.uid);
          const displayActeur = dossier.initiateur_acteur_ref ?? fallbackActeursByDossier.get(dossier.uid) ?? null;

          // Couleur du bullet selon statut
          const bulletColor = (() => {
            const s = dossier.statut_final;
            if (s === 'Promulguée') return '#27AE60';
            if (s === 'Rejeté') return '#E74C3C';
            if (s?.includes('Parlement')) return '#8B5CF6';
            if (s?.includes('Assemblée')) return '#06B6D4';
            if (s?.includes('Sénat')) return '#F39C12';
            return '#F39C12';
          })();

          return (
            <li key={dossier.uid}>
              <div className="py-5 px-4 hover:bg-muted transition-colors duration-150 rounded-sm">

                {/* Ligne 1 : statut + durée */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bulletColor }} />
                  <span className="text-xs text-muted-foreground">
                    {dossier.statut_final ?? 'Statut inconnu'}
                    {daysInfo && <> · {dossier.statut_final === 'Promulguée' ? `promulguée en ${daysInfo}` : `déposé il y a ${daysInfo}`}</>}
                  </span>
                </div>

                {/* Ligne 2 : titre */}
                <h2 className="text-base font-semibold leading-snug mb-2">{dossier.titre}</h2>

                {/* Ligne 3 : méta + CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground flex-1 min-w-0">
                    {dossier.procedure_libelle && (
                      DEFINITIONS[dossier.procedure_libelle]
                        ? <ProcedureTooltip label={dossier.procedure_libelle} description={DEFINITIONS[dossier.procedure_libelle]} />
                        : <span className="font-medium uppercase tracking-wide">{dossier.procedure_libelle}</span>
                    )}
                    {displayActeur && (
                      <>
                        <span className="text-border">·</span>
                        <span>
                          {(displayActeur as any).roles_text?.split(',')[0]?.trim()
                            ? `${(displayActeur as any).roles_text.split(',')[0].trim()} `
                            : ''}{displayActeur.prenom} {displayActeur.nom}
                        </span>
                        {displayActeur.groupe && (
                          <>
                            <span className="text-border">·</span>
                            <span>{displayActeur.groupe.libelle ?? 'Mandat terminé'}</span>
                          </>
                        )}
                      </>
                    )}
                    {depotDate && (
                      <>
                        <span className="text-border">·</span>
                        <span>{depotDate}</span>
                      </>
                    )}
                    {!hasAccessibleTexte && (
                      <>
                        <span className="text-border">·</span>
                        <span className="text-destructive font-medium">{textesCount > 0 ? 'Texte non encore publié' : 'Aucun texte'}</span>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/dossiers-legislatifs/${dossier.uid}/resume-ia`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-primary/30 hover:border-primary/60 hover:scale-105 transition-all duration-200 group shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform duration-200" />
                    <ShimmerText>Dossier LoiClair avec résumé IA</ShimmerText>
                  </Link>
                </div>

                {/* Debug : référence dossier */}
                <span className="font-mono text-[10px] text-muted-foreground select-all mt-1.5 block" style={{ opacity: 0.35 }}>
                  {dossier.uid}
                </span>

              </div>
            </li>
          );
        })}
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