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
// Type des options qu’on reçoit maintenant de la page serveur
// C’est plus clair et évite de recalculer quoi que ce soit côté client
// ────────────────────────────────────────────────
export type TypeOption = {
  slug: string;
  libelle: string;
};

interface TypeFilterProps {
  typeOptions: TypeOption[];
}

export default function TypeFilter({ typeOptions }: TypeFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Valeur initiale = paramètre URL actuel ou "tous"
  const initialValue = searchParams.get('type') || 'tous';
  const [selectedType, setSelectedType] = useState(initialValue);

  // Synchronisation quand l’URL change (ex: reset button, back/forward)
  useEffect(() => {
    const current = searchParams.get('type') || 'tous';
    setSelectedType(current);
  }, [searchParams]);

  const handleChange = (value: string) => {
    setSelectedType(value);

    const params = new URLSearchParams(searchParams.toString());

    if (value === 'tous') {
      params.delete('type');
    } else {
      params.set('type', value);
    }

    // On reset toujours la pagination quand on change de filtre
    params.delete('page');

    router.push(`?${params.toString()}`);
  };


  const selectedLibelle = 
  selectedType === 'tous'
    ? null
    : typeOptions.find(opt => opt.slug === selectedType)?.libelle || selectedType;
    
  return (
    <Select onValueChange={handleChange} value={selectedType}>
      <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <SelectTrigger 
        className={`
          max-w-56 transition-colors duration-200
          ${selectedType !== 'tous' 
            ? 'border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100' 
            : 'hover:bg-gray-100 hover:border-blue-300'}
        `}
      >
        <SelectValue placeholder="Type de procédure" className="truncate" />
        {selectedType !== 'tous' && (
          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            Actif
          </span>
        )}
      </SelectTrigger>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="max-w-xs text-base leading-relaxed">
      <p>Filtre les dossiers par type de procédure parlementaire</p>
      <p className="text-muted-foreground mt-1">
        Ex : procédure législative ordinaire, projet de loi de finances, etc.
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Type de procédure</SelectLabel>
          <SelectItem value="tous">Tous les types</SelectItem>

          {typeOptions.map(({ slug, libelle }) => (
            <SelectItem key={slug} value={slug}>
              {libelle}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}