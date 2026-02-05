// src/app/dossiers-legislatifs/page.tsx
// Page principale pour lister les dossiers législatifs.
// C'est un Server Component : fetch des données côté serveur pour sécurité et perf.
// On utilise Tailwind pour un style basique : liste en colonne, cartes sans bordure avec hover.

import { supabase } from '@/lib/supabase'; // Import du client Supabase (créé précédemment).
import Link from 'next/link'; // Pour les liens internes Next.js (navigation optimisée).

export default async function DossiersLegislatifsPage() {
  // Fetch des données depuis la table 'dossiers_legislatifs'.
  // On sélectionne tout pour tester (*), mais on pourra limiter les colonnes plus tard (ex. : select('uid, titre, legislature')).
  // Gère les erreurs basiquement pour debug.
  const { data: dossiers, error } = await supabase
    .from('dossiers_legislatifs')
    .select('*, initiateur_acteur_ref(nom, prenom, roles_text, groupe:organes(libelle)), actes_legislatifs!actes_legislatifs_dossier_uid_fkey(date_acte)')

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
  const timeA = minDateA ? new Date(minDateA).getTime() : 0; // 0 si inconnue ( ira en fin de liste).

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
      <ul className="space-y-2"> {/* Liste en colonne avec espacement vertical */}
        {sortedDossiers.map((dossier) => (
          <li key={dossier.uid}> {/* Clé unique basée sur uid */}
            <div
              className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg" // Carte : fond blanc, ombre légère, hover augmente l'ombre, arrondi, sans bordure explicite.
            >
              <h2 className="text-xl font-semibold">{dossier.titre}</h2> {/* Titre du dossier */}
              <p className="text-red-800 uppercase text-sm mt-1"> {/* Rouge burgundy, majuscules, petit texte, marge top légère */}
                {dossier.procedure_libelle}
                </p>

{(() => {
  // Calcul de la date de démarrage : filtrer actes avec date_acte valide, trier ascending, prendre le premier.
  const actes = dossier.actes_legislatifs || []; // Array nested des actes (ou vide si null).
  const actesAvecDates = actes.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime())); // Filtre dates valides (non null et parsables).
  const sortedActes = actesAvecDates.sort((a, b) => new Date(a.date_acte).getTime() - new Date(b.date_acte).getTime()); // Tri ascending sur valides.
  const premiereDate = sortedActes[0]?.date_acte; // Date du premier acte valide.

  // Ligne de debug : affiche le nombre d'actes valides + exemple de première date raw (temporaire pour tester).
  const debugElement = (
    <p className="text-gray-400 text-xs">
      Debug : {actesAvecDates.length} actes valides (ex. première raw : {actesAvecDates[0]?.date_acte ?? 'aucune'})
    </p>
  );

  if (!premiereDate) {
    return (
      <>
        {debugElement} {/* Inclut la debug même en cas inconnu */}
        <p className="text-gray-600 text-sm">Date de démarrage : Inconnue</p>
      </>
    );
  }

  // Formatage en français (ex. : "5 février 2026").
  const formattedDate = new Date(premiereDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Calcul du nombre de jours écoulés depuis la date de démarrage (jusqu'à aujourd'hui).
  const today = new Date(); // Date actuelle (côté serveur, mais proche du réel).
  const startDate = new Date(premiereDate); // Conversion de la timestamp.
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Diff en ms, divisé par ms/jour, arrondi bas.
  const daysText = daysElapsed >= 0 ? `Depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date future'; // Gère pluriel et cas rare (future).

  return (
    <>
      {debugElement} {/* Inclut la debug dans le cas normal */}
      <p className="text-gray-600 text-sm">Date de démarrage : {formattedDate}</p>
      <p className="text-gray-600 text-sm">{daysText}</p> {/* Affichage simple, sous la date */}
    </>
  );
})()}


              <p className="text-gray-600">Législature : {dossier.legislature}</p> {/* Exemple de détail simple */}
              <p className="text-gray-600">
                Auteur : {dossier.initiateur_acteur_ref ? `${dossier.initiateur_acteur_ref.prenom} ${dossier.initiateur_acteur_ref.nom}` : 'Non spécifié'}
                </p>
                <p className="text-gray-600 text-sm">
                Rôle : {dossier.initiateur_acteur_ref?.roles_text ?? 'Non spécifié'}
                </p>
                <p className="text-gray-600">
                Groupe : {dossier.initiateur_acteur_ref?.groupe?.libelle ?? 'Mandat terminé'}
                </p>
                {dossier.lien_an && ( // Afficher seulement si lien_an existe.
                <p className="text-gray-600">
                    <a 
                    href={dossier.lien_an} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                    >
                    Dossier Assemblée Nationale
                    </a>
                </p>
                )}
                {dossier.senat_chemin && ( // Afficher seulement si senat_chemin existe.
                <p className="text-gray-600">
                    <a 
                    href={dossier.senat_chemin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                    >
                    Dossier Sénat
                    </a>
                </p>
                )}
                {dossier.url_legifrance && ( // Afficher seulement si url_legifrance existe.
                <p className="text-gray-600">
                    <a 
                    href={dossier.url_legifrance} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                    >
                    Légifrance
                    </a>
                </p>
                )}
               <p className="text-gray-600">
                <a 
                    href={`/dossiers-legislatifs/${dossier.uid}/resume-ia`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                >
                    Résumé IA
                </a>
                </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}