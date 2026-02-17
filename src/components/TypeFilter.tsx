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

  return (
    <Select onValueChange={handleChange} value={selectedType}>
      <SelectTrigger className="w-full max-w-48 hover:bg-gray-100 hover:border-blue-300 transition-colors duration-200">
        <SelectValue placeholder="Type de procédure" />
      </SelectTrigger>

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