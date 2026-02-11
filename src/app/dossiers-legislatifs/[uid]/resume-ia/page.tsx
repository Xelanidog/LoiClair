// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Sparkles, ExternalLink } from 'lucide-react';
import { useCompletion } from '@ai-sdk/react'; // Hook pour streaming IA (Vercel AI SDK)

// === Ajouts pour le bouton Perplexity ===
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Ajout pour le Badge (vérification des liens)
import { Badge } from '@/components/ui/badge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ResumeIAPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [textes, setTextes] = useState<any[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
 
  const [liensStatus, setLiensStatus] = useState<Record<string, 'valide' | 'invalide' | 'en_cours' | null>>({});
  const [titreDossier, setTitreDossier] = useState<string>('');

  const {
  completion, // ← le texte qui stream (string)
  complete, // ← fonction pour déclencher
  isLoading: isLoadingResume, // ← meilleur nom
  error,
  setCompletion  // ← Ajout ici pour le reset.
} = useCompletion({
  api: '/api/resume-loi',
  streamProtocol: 'text'
});


  const handleDiscussWithAI = (titre: string, lien: string) => {
    const prompt = `Analyse et explique ce texte législatif français pour en discuter avec moi : "${titre}". Voici le lien officiel : ${lien}. Résume les points clés, les objectifs, les impacts concrets et le contexte politique.`;
    const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    window.open(perplexityUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const fetchTextes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('textes')
        .select('uid, date_creation, date_publication, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, organe_auteur:organe_auteur_ref(libelle)')
        .eq('dossier_ref', uid)
        .order('date_creation', { ascending: true });

      if (error) {
        console.error('Erreur fetch textes:', error);
        return;
      }
      setTextes(data || []);
      setLoading(false);

      if (data && data.length > 0) {
        setSelectedUid(data[data.length - 1].uid);
      }



      if (data) {
        setLiensStatus(data.reduce((acc, t) => ({ ...acc, [t.uid]: 'en_cours' }), {}));
      }
    };
    fetchTextes();
  }, [uid]);

  useEffect(() => {
    const fetchTitreDossier = async () => {
      const { data, error } = await supabase
        .from('dossiers_legislatifs')
        .select('titre')
        .eq('uid', uid)
        .limit(1);  // Remplace .single() par .limit(1) pour éviter le bug de coercion, retourne un array (vide ou avec 1 item)

      if (error) {
        console.error('Erreur fetch titre dossier:', error?.message || error?.details || error || 'Erreur inconnue');
        setTitreDossier('Titre indisponible');
        return;
      }

      // Gère si aucun résultat (array vide) ou résultat valide
      if (!data || data.length === 0) {
        setTitreDossier('Titre indisponible');
        return;
      }

      setTitreDossier(data[0]?.titre || 'Titre indisponible');
    };
    fetchTitreDossier();
  }, [uid]);

  useEffect(() => {
    const verifierLiens = async () => {
      for (const texte of textes) {
        if (!texte.lien_texte) {
          setLiensStatus(prev => ({ ...prev, [texte.uid]: 'invalide' }));
          continue;
        }

        const isValidFormat = /^https?:\/\/[^\s$.?#].[^\s]*$/.test(texte.lien_texte);
        if (!isValidFormat) {
          setLiensStatus(prev => ({ ...prev, [texte.uid]: 'invalide' }));
          continue;
        }

        try {
          const response = await fetch(texte.lien_texte, { method: 'HEAD' });
          setLiensStatus(prev => ({ ...prev, [texte.uid]: response.ok ? 'valide' : 'invalide' }));
        } catch {
          setLiensStatus(prev => ({ ...prev, [texte.uid]: 'invalide' }));
        }
      }
    };

    if (textes.length > 0) {
      verifierLiens();
    }
  }, [textes]);

useEffect(() => {
  if (!selectedUid) return;

  const selectedTexte = textes.find(t => t.uid === selectedUid);
  if (!selectedTexte?.lien_texte) {
    // reset si besoin
    return;
  }

  const payload = {
    lien: selectedTexte.lien_texte,
    titre_texte: selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
  };



setCompletion('');  // Reset pour forcer rerender (nécessite d'ajouter setCompletion au hook : const { ..., setCompletion } = useCompletion(...))

  // Solution la plus propre (JSON.stringify dans le prompt)
  complete(JSON.stringify(payload));

}, [selectedUid, textes, complete]);

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUid(id);
    } else if (selectedUid === id) {
      setSelectedUid(null);
    }
  };

  const formatDate = (dateCreation: string | null, datePublication: string | null) => {
  const dateToUse = dateCreation || datePublication;
  if (!dateToUse) return 'Inconnue';
  return new Date(dateToUse).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

  const selectedTexte = selectedUid ? textes.find((t) => t.uid === selectedUid) : null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Résumé IA pour {titreDossier ? titreDossier : `le dossier ${uid}`} {/* Affiche le titre si disponible, sinon fallback à UID pour éviter vide */}
      </h1>
      <p className="mb-4">Liste des textes liés.</p>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <p className="ml-2 text-gray-500">Chargement des textes...</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-w-full">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-32">Date de création</TableHead>
                <TableHead className="w-40">Dénomination</TableHead>
                <TableHead className="w-[200px] min-w-[200px]">Provenance</TableHead>
                <TableHead className="w-[200px] min-w-[200px]">Titre</TableHead>
                <TableHead className="w-32">Statut</TableHead>
                <TableHead className="w-40">Lien Texte</TableHead>
                <TableHead className="w-32">Statut Lien</TableHead>
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
                  <TableCell>{formatDate(texte.date_creation, texte.date_publication)}</TableCell>
                  <TableCell className="font-medium truncate max-w-[160px]">
                    {texte.denomination || 'Inconnue'}
                  </TableCell>
                  {/* Mise à jour : largeur max 200px, wrap texte avec whitespace-normal et break-words, tooltip au hover */}
                  <TableCell className="max-w-[200px] whitespace-normal break-words" title={texte.organe_auteur?.libelle || 'Inconnue'}>
                    {texte.organe_auteur?.libelle || 'Inconnue'}
                  </TableCell>
                  {/* Mise à jour : largeur max 200px, wrap texte avec whitespace-normal et break-words, tooltip au hover */}
                  <TableCell className="max-w-[200px] whitespace-normal break-words" title={texte.titre_principal_court || 'Inconnu'}>
                    {texte.titre_principal_court || 'Inconnu'}
                  </TableCell>
                  <TableCell className="truncate max-w-[120px]">
                    {texte.libelle_statut_adoption || 'Inconnu'}
                  </TableCell>
                  <TableCell>
                    {texte.lien_texte ? (
                      <a href={texte.lien_texte} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[140px] block">
                        Voir le texte
                      </a>
                    ) : (
                      'Aucun lien disponible'
                    )}
                  </TableCell>
                  <TableCell>
                    {liensStatus[texte.uid] === 'valide' && <Badge variant="success">Valide</Badge>}
                    {liensStatus[texte.uid] === 'invalide' && <Badge variant="destructive">Invalide</Badge>}
                    {liensStatus[texte.uid] === 'en_cours' && <Badge variant="secondary">Vérification...</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Section résumé IA */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Résumé IA du texte sélectionné</h2>

        {selectedTexte && selectedTexte.lien_texte && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => handleDiscussWithAI(
                    selectedTexte.titre_principal_court || selectedTexte.denomination || 'Texte inconnu',
                    selectedTexte.lien_texte
                  )}
                  className="mb-4"
                >
                  Discuter de ce texte avec l'IA (Perplexity)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ouvre Perplexity avec le texte pré-chargé (compte gratuit recommandé pour discussions étendues)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
        )}

       {error ? (
  <p className="text-red-500">Erreur : {error.message}</p>
) : completion ? (
  <div className="prose max-w-none" key={completion.length}>
    <ReactMarkdown>{completion}</ReactMarkdown>
  </div>
) : isLoadingResume ? (
  <div className="flex justify-center items-center h-32">
    <Loader2 className="h-6 w-6 animate-spin" />
    <p className="ml-2">Génération du résumé...</p>
  </div>
) : (
  <p>Sélectionnez un texte pour générer le résumé IA...</p>
)}
      </div>
    </div>
  );
}