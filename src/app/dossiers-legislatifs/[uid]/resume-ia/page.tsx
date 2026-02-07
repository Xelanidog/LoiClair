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
import { Sparkles, ExternalLink } from 'lucide-react'; // Pour les icônes des liens (déjà utilisées sur la page principale)

// === Ajouts pour le bouton Perplexity ===
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ResumeIAPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [textes, setTextes] = useState<any[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeIA, setResumeIA] = useState<string>('');
  const [loadingResume, setLoadingResume] = useState(false);

  // === Fonction Perplexity ===
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
        .select('uid, date_creation, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, organe_auteur:organe_auteur_ref(libelle_abrege)')
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
    };
    fetchTextes();
  }, [uid]);

  useEffect(() => {
    const genererResume = async () => {
      if (!selectedUid) return;

      const selectedTexte = textes.find((t) => t.uid === selectedUid);
      if (!selectedTexte || !selectedTexte.lien_texte) {
        setResumeIA('Aucun lien texte valide disponible pour ce texte.');
        return;
      }

      const isValidUrl = /^https?:\/\/[^\s$.?#].[^\s]*$/.test(selectedTexte.lien_texte);
      if (!isValidUrl) {
        setResumeIA('Lien texte invalide.');
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
          setResumeIA('Erreur lors de la génération du résumé.');
          return;
        }
        const { resume } = await response.json();
        setResumeIA(resume);
      } catch (error: any) {
        setResumeIA('Erreur réseau ou format inattendu.');
      } finally {
        setLoadingResume(false);
      }
    };

    genererResume();
  }, [selectedUid, textes]);

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUid(id);
    } else if (selectedUid === id) {
      setSelectedUid(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Inconnue';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Texte sélectionné (pour le bouton Perplexity)
  const selectedTexte = selectedUid ? textes.find((t) => t.uid === selectedUid) : null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Résumé IA pour le dossier {uid}</h1>
      <p className="mb-4">Liste des textes liés.</p>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <p className="ml-2 text-gray-500">Chargement des textes...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"/><TableHead>Date de création</TableHead><TableHead>Dénomination</TableHead><TableHead>Provenance</TableHead><TableHead>Titre</TableHead><TableHead>Statut</TableHead><TableHead>Lien Texte</TableHead>
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

        {/* Bouton Perplexity */}
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