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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgeFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedAge, setSelectedAge] = useState(searchParams.get('age') || 'tous');

  useEffect(() => {
    const validAges = ['tous', 'moins_6m', '6m_1a', 'plus_1a'];
    const current = searchParams.get('age') || 'tous';
    setSelectedAge(validAges.includes(current) ? current : 'tous');
  }, [searchParams]);

  const handleChange = (value: string) => {
    setSelectedAge(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'tous') {
      params.delete('age');
    } else {
      params.set('age', value);
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const isActive = selectedAge !== 'tous';

  return (
    <TooltipProvider>
      <Tooltip>
        <Select onValueChange={handleChange} value={selectedAge}>
          <TooltipTrigger asChild>
            <SelectTrigger
              className={`
              max-w-56 transition-colors duration-200
                ${isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'border-input hover:bg-gray-100 hover:border-blue-300'}
              `}
            >
              <SelectValue placeholder="Sélectionner une tranche d'âge" />
              {isActive && (
                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  Actif
                </span>
              )}
            </SelectTrigger>
          </TooltipTrigger>

          <SelectContent>
            <SelectGroup>
              <SelectLabel>Âge du dossier</SelectLabel>
              <SelectItem value="tous">Toute les dates</SelectItem>
              <SelectItem value="moins_6m">Moins de 6 mois</SelectItem>
              <SelectItem value="6m_1a">Entre 6 mois et 1 an</SelectItem>
              <SelectItem value="plus_1a">Plus d'1 an</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <TooltipContent side="bottom" align="start" className="max-w-xs text-base leading-relaxed">
          <p className="font-medium">Filtre par ancienneté du dossier</p>
          <p className="text-muted-foreground mt-1">
            Affiche les textes récents, intermédiaires ou plus anciens.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}