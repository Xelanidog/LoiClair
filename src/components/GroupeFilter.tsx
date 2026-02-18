'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ────────────────────────────────────────────────
// Type des options (même structure que pour TypeFilter)
// ────────────────────────────────────────────────
export type GroupeOption = {
  slug: string;
  libelle: string;
};

interface GroupeFilterProps {
  groupeOptions: GroupeOption[];
}

export default function GroupeFilter({ groupeOptions }: GroupeFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Valeur initiale = paramètre URL actuel ou "tous"
  const initialValue = searchParams.get('groupe') || 'tous';
  const [selectedGroupe, setSelectedGroupe] = useState(initialValue);

  // Synchro quand l’URL change (back/forward, reset, etc.)
  useEffect(() => {
    const current = searchParams.get('groupe') || 'tous';
    setSelectedGroupe(current);
  }, [searchParams]);

  const handleChange = (value: string) => {
    setSelectedGroupe(value);

    const params = new URLSearchParams(searchParams.toString());

    if (value === 'tous') {
      params.delete('groupe');
    } else {
      params.set('groupe', value);
    }

    // Reset pagination à chaque changement de filtre
    params.delete('page');

    router.push(`?${params.toString()}`);
  };

  const selectedLibelle =
    selectedGroupe === 'tous'
      ? null
      : groupeOptions.find(opt => opt.slug === selectedGroupe)?.libelle || selectedGroupe;

  return (
    <Select onValueChange={handleChange} value={selectedGroupe}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SelectTrigger
              className={`
                max-w-56 transition-colors duration-200
                ${selectedGroupe !== 'tous'
                  ? 'border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'hover:bg-gray-100 hover:border-blue-300'}
              `}
            >
              <SelectValue placeholder="Groupe politique" className="truncate" />
              {selectedGroupe !== 'tous' && (
                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  Actif
                </span>
              )}
            </SelectTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-base leading-relaxed">
            <p>Filtre les dossiers par groupe politique initiateur</p>
            <p className="text-muted-foreground mt-1">
              Ex : La France insoumise, Renaissance, Les Républicains, Rassemblement National…
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Groupe politique</SelectLabel>
          <SelectItem value="tous">Tous les groupes</SelectItem>

          {groupeOptions.map(({ slug, libelle }) => (
            <SelectItem key={slug} value={slug}>
              {libelle}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}