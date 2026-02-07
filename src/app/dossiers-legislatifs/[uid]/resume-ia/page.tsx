// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Page dynamique pour le résumé IA d'un dossier (basée sur uid).
// Cette page affiche une table des textes liés au dossier, avec checkboxes pour sélection.
// Ajout : Sélection auto du dernier texte, appel API pour résumé IA sur son lien, loading dédié, affichage markdown.
// Limite à un seul texte sélectionné (single-select radio-like).
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
import ReactMarkdown from 'react-markdown'; // Pour rendre le markdown du résumé IA.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ResumeIAPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [textes, setTextes] = useState<any[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null); // Single-select : UID du texte sélectionné (null si aucun)
  const [loading, setLoading] = useState(true);
  const [resumeIA, setResumeIA] = useState<string>('');
  const [loadingResume, setLoadingResume] = useState(false);

  // Effet pour fetcher les textes au montage du composant (et si uid change).
  useEffect(() => {
    const fetchTextes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('textes')
        .select('uid, date_creation, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, organe_auteur:organe_auteur_ref(libelle_abrege)')
        .eq('dossier_ref', uid)
        .order('date_creation', { ascending: true });

      if (error) {
        console.error('Erreur fetch textes:', error);
        return;
      }
      setTextes(data || []);
      setLoading(false);

      // Sélection auto du dernier texte si dispo (single-select)
      if (data && data.length > 0) {
        setSelectedUid(data[data.length - 1].uid);
      }
    };
    fetchTextes();
  }, [uid]);

  // Effet pour générer le résumé quand selectedUid change.
  useEffect(() => {
    const genererResume = async () => {
      if (!selectedUid) return;

      const selectedTexte = textes.find((t) => t.uid === selectedUid);
      if (!selectedTexte || !selectedTexte.lien_texte) {
        setResumeIA('Aucun lien texte valide disponible pour ce texte.');
        return;
      }

      // Validation du lien (pattern basique HTTP/HTTPS).
      const isValidUrl = /^https?:\/\/[^\s$.?#].[^\s]*$/.test(selectedTexte.lien_texte);
      if (!isValidUrl) {
        console.error('Lien texte invalide:', selectedTexte.lien_texte);
        setResumeIA('Lien texte invalide. Vérifiez les données Supabase.');
        return;
      }

      setLoadingResume(true);
      setResumeIA('');

      try {
        const response = await fetch('/api/resume-loi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lien: selectedTexte.lien_texte,
            titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erreur API détaillée:', errorData.error || 'Réponse non OK');
          setResumeIA('Erreur lors de la génération du résumé. Vérifiez le lien ou réessayez.');
          return;
        }
        const { resume } = await response.json();
        setResumeIA(resume);
      } catch (error: any) {
        console.error('Erreur fetch résumé détaillée:', error.message, 'Lien concerné:', selectedTexte.lien_texte);
        setResumeIA('Erreur réseau ou format inattendu lors de la génération du résumé. Réessayez.');
      } finally {
        setLoadingResume(false);
      }
    };

    genererResume();
  }, [selectedUid, textes]);

  // Handler pour checkbox row : Single-select (set seulement si checked, unset si même).
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUid(id);
    } else if (selectedUid === id) {
      setSelectedUid(null);
    }
  };

  // Fonction utilitaire pour formater une date en français (ex. : "1 janvier 2023").
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Inconnue';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Résumé IA pour le dossier {uid}</h1>
      <p className="mb-4">Liste des textes liés (contenu IA à venir).</p>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <p className="ml-2 text-gray-500">Chargement des textes...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"/><TableHead>Date de création</TableHead><TableHead>Dénomination</TableHead><TableHead>Provenance</TableHead><TableHead>Titre court</TableHead><TableHead>Libellé statut adoption</TableHead><TableHead>Lien Texte</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {textes.map((texte) => (
              <TableRow key={texte.uid} data-state={selectedUid === texte.uid ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    id={`row-${texte.uid}-checkbox`}
                    checked={selectedUid === texte.uid}
                    onCheckedChange={(checked) => handleSelectRow(texte.uid, checked === true)}
                  />
                </TableCell>
                <TableCell>{formatDate(texte.date_creation)}</TableCell>
                <TableCell className="font-medium">{texte.denomination || 'Inconnue'}</TableCell>
                <TableCell>{texte.organe_auteur?.libelle_abrege || 'Inconnue'}</TableCell>
                <TableCell className="max-w-[250px] truncate">{texte.titre_principal_court || 'Inconnu'}</TableCell>
                <TableCell>{texte.libelle_statut_adoption || 'Inconnu'}</TableCell>
                <TableCell>
                  {texte.lien_texte ? (
                    <a href={texte.lien_texte} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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

      {/* Section résumé IA */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Résumé IA du texte sélectionné</h2>
        {loadingResume ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <p className="ml-2 text-gray-500">Génération du résumé en cours...</p>
          </div>
        ) : resumeIA ? (
          <div className="prose">
            <ReactMarkdown>{resumeIA}</ReactMarkdown>
          </div>
        ) : (
          <p>Aucun texte sélectionné ou résumé disponible.</p>
        )}
      </div>
    </div>
  );
}