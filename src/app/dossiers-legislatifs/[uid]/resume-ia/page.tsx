// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Page dynamique pour le résumé IA d'un dossier (basée sur uid).
// Cette page affiche une table des actes législatifs liés au dossier, avec checkboxes pour sélection.
// Plus tard, on ajoutera l'appel à xAI pour générer des résumés basés sur les actes sélectionnés.
// Note : Cette page est "use client" car elle utilise des hooks comme useState et useEffect pour du state interactif.

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
  const [actes, setActes] = useState<any[]>([]); // Tableau des actes fetchés (any pour flexibilité ; typage plus strict plus tard).
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Set des uids d'actes sélectionnés (pour checkboxes).
  const [loading, setLoading] = useState(true); // Booléen pour indiquer le chargement en cours.

  // Effet pour fetcher les actes au montage du composant (et si uid change).
  useEffect(() => {
    const fetchActes = async () => {
      setLoading(true); // Active le loading.
      const { data, error } = await supabase
        .from('actes_legislatifs') // Table Supabase des actes.
        .select('*, textes_associes: textes!actes_legislatifs_textes_associes_fkey(lien_texte), texte_adopte: textes!actes_legislatifs_texte_adopte_fkey(lien_texte)') // Select avec relations (textes liés).
        .eq('dossier_uid', uid) // Filtre par dossier_uid.
        .order('date_acte', { ascending: true }); // Tri par date ascending (plus ancien en premier).

      if (error) {
        // Log d'erreur détaillé pour debug.
        console.error('Erreur fetch actes détaillée:', error?.message || 'Message vide', error?.details || 'Détails vides', error?.hint || 'Hint vide', error?.code || 'Code vide');
        return;
      }

      setActes(data || []); // Met à jour l'état avec les données (ou vide si null).
      setLoading(false); // Désactive le loading.
    };

    fetchActes(); // Exécute le fetch.
  }, [uid]); // Dépendance : re-fetch si uid change.

  // Calcul si tous les rows sont sélectionnés (pour checkbox "tout sélectionner").
  const selectAll = selectedRows.size === actes.length;

  // Handler pour checkbox "tout sélectionner".
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(actes.map((acte) => acte.uid))); // Sélectionne tous.
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
      <p className="mb-4">Liste des actes législatifs (contenu IA à venir).</p> {/* Description temporaire. */}

      {loading ? ( // Affichage conditionnel : loading ou table.
        <div className="flex justify-center items-center h-32"> {/* Centre le spinner. */}
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" /> {/* Icône de chargement. */}
          <p className="ml-2 text-gray-500">Chargement des actes...</p> {/* Texte loading. */}
        </div>
      ) : (
        <Table> {/* Table Shadcn pour les actes. */}
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
              <TableHead>Libellé Acte</TableHead> {/* Colonne libellé. */}
              <TableHead>Date</TableHead> {/* Colonne date. */}
              <TableHead>Texte Associé</TableHead> {/* Colonne lien texte. */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {actes.map((acte) => ( // Boucle sur les actes pour rows.
              <TableRow key={acte.uid} data-state={selectedRows.has(acte.uid) ? "selected" : undefined}> {/* Row avec état sélection. */}
                <TableCell>
                  <Checkbox
                    id={`row-${acte.uid}-checkbox`}
                    name={`row-${acte.uid}-checkbox`}
                    checked={selectedRows.has(acte.uid)}
                    onCheckedChange={(checked) => handleSelectRow(acte.uid, checked === true)}
                  />
                </TableCell>
                <TableCell className="font-medium">{acte.libelle_acte || acte.code_acte || 'Inconnu'}</TableCell> {/* Libellé fallback. */}
                <TableCell>{formatDate(acte.date_acte)}</TableCell> {/* Date formatée. */}
                <TableCell>
                  {(() => { // IIFE pour logique conditionnelle du lien texte (gère array ou objet).
                    let lien = null;
                    if (acte.textes_associes) {
                      if (Array.isArray(acte.textes_associes)) {
                        lien = acte.textes_associes[0]?.lien_texte; // Prend le premier si array.
                      } else {
                        lien = acte.textes_associes.lien_texte; // Assume objet single.
                      }
                    } else if (acte.texte_adopte) {
                      lien = acte.texte_adopte.lien_texte; // Fallback sur texte adopté.
                    }
                    return lien ? (
                      <a href={lien} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Voir texte</a> // Lien cliquable.
                    ) : (
                      'Aucun texte associé' // Message si pas de lien.
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} // Fin de la fonction ResumeIAPage (accolade fermante ajoutée ici pour corriger l'erreur).