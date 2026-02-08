// src/app/dossiers-legislatifs/page.tsx
// Page principale pour lister les dossiers législatifs.
// C'est un Server Component : fetch des données côté serveur pour sécurité et perf.
// On utilise Tailwind pour un style basique : liste en colonne, cartes sans bordure avec hover.

import { supabase } from '@/lib/supabase'; // Import du client Supabase.
import Link from 'next/link'; // Liens internes Next.js.
import { Sparkles, ExternalLink } from 'lucide-react'; // Icônes.
import StatutFilter from '@/components/StatutFilter'; // Filtre statut (client-side).
import AgeFilter from '@/components/AgeFilter'; // Filtre âge (client-side).

// Signature avec await pour searchParams (Server Component).
export default async function DossiersLegislatifsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams; // Unwrap la Promise.

  // Récupération et validation des params URL.
  const statutFilter = typeof resolvedParams.statut === 'string' ? resolvedParams.statut.toLowerCase() : undefined;
  const validStatuts = ['en_cours', 'promulguee'];
  const statut = validStatuts.includes(statutFilter ?? '') ? statutFilter : undefined;

  const ageFilter = typeof resolvedParams.age === 'string' ? resolvedParams.age.toLowerCase() : undefined;
  const validAges = ['moins_6m', '6m_1a', 'plus_1a'];
  const age = validAges.includes(ageFilter ?? '') ? ageFilter : undefined;

  // Fetch Supabase avec filtre statut (si présent).
  let query = supabase
    .from('dossiers_legislatifs')
    .select('*, initiateur_acteur_ref(uid, nom, prenom, roles_text, groupe:organes(uid, libelle)), actes_legislatifs!actes_legislatifs_dossier_uid_fkey(date_acte)');

  if (statut) {
    query = query.eq('statut_final', statut);
  }

  const { data: dossiers, error } = await query;

  if (error) {
    return <div>Erreur lors du chargement des données : {error.message}</div>;
  }

  if (!dossiers || dossiers.length === 0) {
    return <div>Aucun dossier législatif trouvé.</div>;
  }

  // Filtrage par âge (post-fetch en JS si param présent).
  let filteredDossiers = dossiers;

  if (age) {
    const today = new Date(); // Date actuelle pour calcul jours écoulés.

    filteredDossiers = dossiers.filter((dossier) => {
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

  // Tri par date de démarrage descendante (plus récent en premier).
  const sortedDossiers = filteredDossiers.sort((a, b) => {
    const actesA = a.actes_legislatifs || [];
    const actesAvecDatesA = actesA.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
    const minDateA = actesAvecDatesA.sort((x, y) => new Date(x.date_acte).getTime() - new Date(y.date_acte).getTime())[0]?.date_acte;
    const timeA = minDateA ? new Date(minDateA).getTime() : 0;

    const actesB = b.actes_legislatifs || [];
    const actesAvecDatesB = actesB.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
    const minDateB = actesAvecDatesB.sort((x, y) => new Date(x.date_acte).getTime() - new Date(y.date_acte).getTime())[0]?.date_acte;
    const timeB = minDateB ? new Date(minDateB).getTime() : 0;

    return timeB - timeA;
  });

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
        <div className="flex items-center">
          <StatutFilter />
        </div>
        <div className="flex items-center">
          <AgeFilter />
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {sortedDossiers.length} dossier{sortedDossiers.length > 1 ? 's' : ''} trouvé{sortedDossiers.length > 1 ? 's' : ''}.
      </div>

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

              {(() => {
                const actes = dossier.actes_legislatifs || [];
                const actesAvecDates = actes.filter(acte => acte.date_acte && !isNaN(new Date(acte.date_acte).getTime()));
                const sortedActes = actesAvecDates.sort((a, b) => new Date(a.date_acte).getTime() - new Date(b.date_acte).getTime());
                const premiereDate = sortedActes[0]?.date_acte;

                if (!premiereDate) {
                  return <p className="text-gray-600 text-sm mt-2">Date de dépôt : Inconnue</p>;
                }

                const formattedDate = new Date(premiereDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                const today = new Date();
                const startDate = new Date(premiereDate);
                const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysText = daysElapsed >= 0 ? `Depuis ${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}` : 'Date future';

                return (
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <p className="px-2">Date de dépôt : {formattedDate}</p>
                    <p className="px-2">{daysText}</p>
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