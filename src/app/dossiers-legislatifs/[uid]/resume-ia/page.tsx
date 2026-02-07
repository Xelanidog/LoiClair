// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Page dynamique pour le résumé IA d'un dossier (basée sur uid).
// Cette page affiche une table des textes liés au dossier, avec checkboxes pour sélection.
// Plus tard, on ajoutera l'appel à xAI pour générer des résumés basés sur les textes sélectionnés.
// Note : Cette page est "use client" car elle utilise des hooks comme useState et useEffect pour du state interactif.
// Modifications : 
// - Colonne "Provenance" adaptée pour afficher libelle_abrege de la table organes via jointure sur organe_auteur_ref.
// - Ajout colonne "Libellé statut adoption" via champ libelle_statut_adoption.
// - Fetch ajusté avec select incluant la relation et le nouveau champ.
// - Colonnes mises à jour en conséquence.

"use client"; // Directive pour rendre cette page un Client Component (nécessaire pour hooks React).

import { useParams } from 'next/navigation'; // Pour récupérer l'uid des params de l'URL.
import { createClient } from '@supabase/supabase-js'; // Pour créer un client Supabase côté client.
import { useEffect, useState } from 'react'; // Pour gérer l'état et les effets (fetch async).
import { Checkbox } from '@/components/ui/checkbox'; // Composant Checkbox de Shadcn/ui.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Composants Table de Shadcn/ui pour afficher les données.
import { Loader2 } from "lucide-react"; // Icône de spinner pour le loading (de Lucide, installé via Shadcn).

// Configuration du client Supabase (côté client).
// Utilise des variables d'env publiques pour l'URL et la clé anonyme (ajoute-les à .env.local si pas fait).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Ex. : NEXT_PUBLIC_SUPABASE_URL=ton_url_supabase.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Ex. : NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_clé_anon.
const supabase = createClient(supabaseUrl, supabaseKey); // Crée le client Supabase.

export default function ResumeIAPage() {
  // Récupération des params de l'URL.
  const params = useParams(); // Hook pour accéder aux params dynamiques (comme [uid]).
  const uid = params.uid as string; // Typage de l'uid en string (assume qu'il existe).

  // États React pour gérer les données et l'UI.
  const [textes, setTextes] = useState<any[]>([]); // Tableau des textes fetchés (any pour flexibilité ; typage plus strict plus tard).
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Set des uids de textes sélectionnés (pour checkboxes).
  const [loading, setLoading] = useState(true); // Booléen pour indiquer le chargement en cours.

  // Effet pour fetcher les textes au montage du composant (et si uid change).
  useEffect(() => {
    const fetchTextes = async () => {
      setLoading(true); // Active le loading.
      const { data, error } = await supabase
        .from('textes') // Table Supabase des textes.
        .select('uid, date_creation, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, organe_auteur:organe_auteur_ref(libelle)') // Select des champs utiles, avec jointure pour libelle_abrege.
        .eq('dossier_ref', uid) // Filtre par dossier_ref.
        .order('date_creation', { ascending: true }); // Tri par date_creation ascending (plus ancien en premier).

      if (error) {
        // Log d'erreur détaillé pour debug.
        console.error('Erreur fetch textes détaillée:', error?.message || 'Message vide', error?.details || 'Détails vides', error?.hint || 'Hint vide', error?.code || 'Code vide');
        return;
      }
      setTextes(data || []); // Met à jour l'état avec les données (ou vide si null).
      setLoading(false); // Désactive le loading.
    };
    fetchTextes(); // Exécute le fetch.
  }, [uid]); // Dépendance : re-fetch si uid change.

  // Calcul si tous les rows sont sélectionnés (pour checkbox "tout sélectionner").
  const selectAll = selectedRows.size === textes.length;

  // Handler pour checkbox "tout sélectionner".
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(textes.map((texte) => texte.uid))); // Sélectionne tous.
    } else {
      setSelectedRows(new Set()); // Désélectionne tous.
    }
  };

  // Handler pour checkbox individuelle par row.
  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows); // Copie du Set actuel.
    if (checked) {
      newSelected.add(id); // Ajoute l'id.
    } else {
      newSelected.delete(id); // Supprime l'id.
    }
    setSelectedRows(newSelected); // Met à jour l'état.
  };

  // Fonction utilitaire pour formater une date en français (ex. : "1 janvier 2023").
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Inconnue'; // Valeur par défaut si null.
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Rendu JSX de la page.
  return (
    <div className="container mx-auto p-4"> {/* Conteneur principal avec padding et centrage. */}
      <h1 className="text-2xl font-bold mb-4">Résumé IA pour le dossier {uid}</h1> {/* Titre avec uid. */}
      <p className="mb-4">Liste des textes liés (contenu IA à venir).</p> {/* Description temporaire. */}

      {loading ? ( // Affichage conditionnel : loading ou table.
        <div className="flex justify-center items-center h-32"> {/* Centre le spinner. */}
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" /> {/* Icône de chargement. */}
          <p className="ml-2 text-gray-500">Chargement des textes...</p> {/* Texte loading. */}
        </div>
      ) : (
        <Table> {/* Table Shadcn pour les textes. */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"> {/* Colonne checkbox tout sélectionner. */}
                <Checkbox
                  id="select-all-checkbox"
                  name="select-all-checkbox"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Date de création</TableHead> {/* Colonne date de création. */}
              <TableHead>Dénomination</TableHead> {/* Colonne dénomination. */}
              <TableHead>Provenance</TableHead> {/* Colonne provenance (libelle_abrege). */}
              <TableHead>Titre court</TableHead> {/* Colonne titre court. */}
              <TableHead>Libellé statut adoption</TableHead> {/* Nouvelle colonne libelle_statut_adoption. */}
              <TableHead>Lien Texte</TableHead> {/* Colonne lien texte. */}
            </TableRow>
          </TableHeader>
          {/* Section table body : affiche les textes avec checkboxes et liens. */}
          <TableBody>
            {textes.map((texte) => ( // Boucle sur les textes.
              <TableRow key={texte.uid} data-state={selectedRows.has(texte.uid) ? "selected" : undefined}> {/* Row avec état sélection. */}
                <TableCell>
                  <Checkbox
                    id={`row-${texte.uid}-checkbox`}
                    name={`row-${texte.uid}-checkbox`}
                    checked={selectedRows.has(texte.uid)}
                    onCheckedChange={(checked) => handleSelectRow(texte.uid, checked === true)}
                  />
                </TableCell>
                <TableCell>{formatDate(texte.date_creation)}</TableCell> {/* Date formatée. */}
                <TableCell className="font-medium">{texte.denomination || 'Inconnue'}</TableCell> {/* Dénomination fallback. */}
                <TableCell>{texte.organe_auteur?.libelle || 'Inconnue'}</TableCell> {/* Provenance via jointure, fallback. */}
                <TableCell className="max-w-[250px] truncate">{texte.titre_principal_court || 'Inconnu'}</TableCell> {/* Titre court avec troncature et ellipses. */}
                <TableCell>{texte.libelle_statut_adoption || 'Inconnu'}</TableCell> {/* Libellé statut adoption fallback. */}
                <TableCell>
                  {texte.lien_texte ? ( // Logique simple pour le lien.
                    <a
                      href={texte.lien_texte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Voir le texte
                    </a>
                  ) : (
                    'Aucun lien disponible'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}