// src/app/dossiers-legislatifs/page.tsx
// Page principale pour lister les dossiers législatifs.
// C'est un Server Component : fetch des données côté serveur pour sécurité et perf.
// On utilise Tailwind pour un style basique : liste en colonne, cartes sans bordure avec hover.
// Ajout : filtre par statut_final via searchParams URL (ex. ?statut=adopte).

import { supabase } from '@/lib/supabase'; // Import du client Supabase (créé précédemment).
import Link from 'next/link'; // Pour les liens internes Next.js (navigation optimisée).
import { Sparkles, ExternalLink } from 'lucide-react'; // Icônes pour liens (IA et externes).
import StatutFilter from '@/components/StatutFilter'; // Import du composant filtre (client-side).

// Signature : garde async, mais await searchParams.
export default async function DossiersLegislatifsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams; // Await pour unwrap la Promise.
  
  // Récupère le param 'statut' (remplace 'searchParams' par 'resolvedParams').
  const statutFilter = typeof resolvedParams.statut === 'string' ? resolvedParams.statut.toLowerCase() : undefined;
  
  // Validation : seulement les valeurs autorisées pour éviter problèmes.
  const validStatuts = ['en_cours', 'promulguee'];
  const statut = validStatuts.includes(statutFilter ?? '') ? statutFilter : undefined;
  
  // Fetch des données depuis la table 'dossiers_legislatifs'.
  // Sélection ajustée pour inclure UID de l'acteur et du groupe.
  // Ajout : filtre .eq sur statut_final si param présent.
  let query = supabase
    .from('dossiers_legislatifs')
    .select('*, initiateur_acteur_ref(uid, nom, prenom, roles_text, groupe:organes(uid, libelle)), actes_legislatifs!actes_legislatifs_dossier_uid_fkey(date_acte)');
  
  if (statut) {
    query = query.eq('statut_final', statut); // Filtre exact.
  }
  
  const { data: dossiers, error } = await query;

  if (error) {
    return <div>Erreur lors du chargement des données : {error.message}</div>; // Affichage d'erreur simple pour test.
  }

  if (!dossiers || dossiers.length === 0) {
    return <div>Aucun dossier législatif trouvé.</div>; // Cas vide pour test.
  }

  // Tri des dossiers par date de démarrage descendante (plus récent en premier).
  const sortedDossiers = dossiers.sort((a, b) => {
    // Calcul date min pour A.
    const actesA = a.actes_legislatifs || [];
    const actesAvecDatesA = actesA.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
    const minDateA = actesAvecDatesA.sort((x, y) => new Date(x.date_acte).getTime() - new Date(y.date_acte).getTime())[0]?.date_acte;
    const timeA = minDateA ? new Date(minDateA).getTime() : 0; // 0 si inconnue (ira en fin de liste).

    // Calcul date min pour B.
    const actesB = b.actes_legislatifs || [];
    const actesAvecDatesB = actesB.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
    const minDateB = actesAvecDatesB.sort((x, y) => new Date(x.date_acte).getTime() - new Date(y.date_acte).getTime())[0]?.date_acte;
    const timeB = minDateB ? new Date(minDateB).getTime() : 0;

    return timeB - timeA; // Descendante : B avant A si plus récente.
  });

  return (
    <div className="container mx-auto p-4"> {/* Conteneur centré avec padding */}
      <h1 className="text-2xl font-bold mb-4">Liste des Dossiers Législatifs</h1> {/* Titre de page */}
      
      {/* Ajout du filtre : label + dropdown (composant client) */}
      <div className="mb-4 flex items-center">
        <StatutFilter />
      </div>
      
      <ul className="space-y-2"> {/* Liste en colonne avec espacement vertical */}
        {sortedDossiers.map((dossier) => (
          <li key={dossier.uid}> {/* Clé unique basée sur uid */}
            <div
              className="p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors duration-200" // Carte : fond blanc, ombre légère, hover augmente l'ombre, arrondi, sans bordure explicite.
            >
              <h2 className="text-l font-semibold mb-3">{dossier.titre}</h2> {/* Titre du dossier */}

              {/* Ligne sous le titre : procédure, initiateur, rôle, organe, badge statut */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1"> {/* Espacement accru */}
                <span className="text-red-800 uppercase px-2">{dossier.procedure_libelle}</span> {/* Padding L/R */}
                {dossier.initiateur_acteur_ref && (
                  <>
                    <span>•</span>
                    <span className="px-2">{`${dossier.initiateur_acteur_ref.prenom} ${dossier.initiateur_acteur_ref.nom}`}</span> {/* Padding L/R */}
                    <span>•</span>
                    <span className="px-2">{dossier.initiateur_acteur_ref.roles_text ?? 'Non spécifié'}</span>
                  </>
                )}
                {dossier.initiateur_acteur_ref?.groupe && (
                  <>
                  <span>•</span>
                    <span className="px-2">{dossier.initiateur_acteur_ref.groupe.libelle ?? 'Mandat terminé'}</span> {/* Padding L/R */}
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

              {/* Ligne des liens : Résumé et discussion IA, AN, Sénat, Légifrance avec icônes */}
              <div className="flex items-center space-x-4 text-sm mt-2">
                <Link href={`/dossiers-legislatifs/${dossier.uid}/resume-ia`} className="flex items-center text-blue-500 hover:underline px-2">
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

              {/* Ligne date de dépôt et jours écoulés */}
              {(() => {
                // Calcul de la date de démarrage : filtrer actes avec date_acte valide, trier ascending, prendre le premier.
                const actes = dossier.actes_legislatifs || []; // Array nested des actes (ou vide si null).
                const actesAvecDates = actes.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime())); // Filtre dates valides (non null et parsables).
                const sortedActes = actesAvecDates.sort((a, b) => new Date(a.date_acte).getTime() - new Date(b.date_acte).getTime()); // Tri ascending sur valides.
                const premiereDate = sortedActes[0]?.date_acte; // Date du premier acte valide.

                if (!premiereDate) {
                  return <p className="text-gray-600 text-sm mt-2">Date de dépôt : Inconnue</p>;
                }

                // Formatage en français (ex. : "5 février 2026").
                const formattedDate = new Date(premiereDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                // Calcul du nombre de jours écoulés depuis la date de démarrage (jusqu'à aujourd'hui).
                const today = new Date(); // Date actuelle (côté serveur, mais proche du réel).
                const startDate = new Date(premiereDate); // Conversion de la timestamp.
                const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Diff en ms, divisé par ms/jour, arrondi bas.
                const daysText = daysElapsed >= 0 ? `Depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date future'; // Gère pluriel et cas rare (future).

                return (
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2"> {/* Espacement accru */}
                    <p className="px-2">Date de dépôt : {formattedDate}</p> {/* Padding L/R */}
                    <p className="px-2">{daysText}</p> {/* Padding L/R */}
                  </div>
                );
              })()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}