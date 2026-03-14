// src/components/ResetButton.tsx
// Composant client-side pour réinitialiser tous les filtres (statut, age, type).
// Utilise une icône simple sans texte, avec tooltip pour accessibilité.

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react'; // Icône de refresh (ou utilise X pour croix si préféré).
import { RotateCcw } from 'lucide-react'; // Icône de flèche circulaire tournant à l'envers (undo/reset).
import { Button } from '@/components/ui/button'; // Shadcn Button pour cohérence.
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Pour explication au hover.

export default function ResetButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    // Supprime explicitement les params filtres (ajoute d'autres si nouveaux filtres futurs).
    params.delete('statut');
    params.delete('age');
    params.delete('type');
    params.delete('page');
    params.delete('groupe');
    params.delete('theme');
    params.delete('q');
    // Push l'URL nettoyée (si vide, juste '/dossiers-legislatifs').
    router.push(`?${params.toString()}`);
  };

  // Vérifie si des filtres sont actifs (pour disable le bouton si pas besoin).
const hasFilters = searchParams.has('statut') || searchParams.has('age') || searchParams.has('type') || searchParams.has('groupe') || searchParams.has('theme') || searchParams.has('q');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!hasFilters}
            className="gap-1.5 shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="max-md:hidden">Réinitialiser</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Réinitialiser les filtres</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}