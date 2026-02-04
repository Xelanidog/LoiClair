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
    .select('*, initiateur_acteur_ref(nom, prenom, groupe:organes(libelle))')
    .order('created_at', { ascending: false }); // Tri par date de création descendante (récent en premier).

  if (error) {
    return <div>Erreur lors du chargement des données : {error.message}</div>; // Affichage d'erreur simple pour test.
  }

  if (!dossiers || dossiers.length === 0) {
    return <div>Aucun dossier législatif trouvé.</div>; // Cas vide pour test.
  }

  return (
    <div className="container mx-auto p-4"> {/* Conteneur centré avec padding */}
      <h1 className="text-2xl font-bold mb-4">Liste des Dossiers Législatifs</h1> {/* Titre de page */}
      <ul className="space-y-2"> {/* Liste en colonne avec espacement vertical */}
        {dossiers.map((dossier) => (
          <li key={dossier.uid}> {/* Clé unique basée sur uid */}
            <div
              className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg" // Carte : fond blanc, ombre légère, hover augmente l'ombre, arrondi, sans bordure explicite.
            >
              <h2 className="text-xl font-semibold">{dossier.titre}</h2> {/* Titre du dossier */}
              <p className="text-gray-600">Législature : {dossier.legislature}</p> {/* Exemple de détail simple */}
              <p className="text-gray-600">
                Auteur : {dossier.initiateur_acteur_ref ? `${dossier.initiateur_acteur_ref.prenom} ${dossier.initiateur_acteur_ref.nom}` : 'Non spécifié'}
                </p>
                <p className="text-gray-600">
                Groupe : {dossier.initiateur_acteur_ref?.groupe?.libelle ?? 'Non spécifié'}
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