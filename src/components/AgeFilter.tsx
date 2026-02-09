// src/components/AgeFilter.tsx
// Composant client-side pour le filtre par âge du dossier (utilise hooks React/Next et Shadcn Select).

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from 'react'; // Pour écouter les changements d'URL.

export default function AgeFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedAge, setSelectedAge] = useState(searchParams.get('age') || 'tous');

  useEffect(() => {
  // Sync l'état local avec l'URL actuelle (reset à 'tous' si param absent).
  const currentValue = searchParams.get('age') || 'tous'; // Remplace 'statut' par 'age' ou 'type' selon le filtre.
  setSelectedAge(currentValue); // Met à jour l'état si URL changée (ex. : après reset).
}, [searchParams]); // Dépend de searchParams pour re-run sur changements.

  const handleChange = (value: string) => {
    const newAge = value === 'tous' ? '' : value.toLowerCase();
    setSelectedAge(value);
    const params = new URLSearchParams(searchParams.toString());
    if (newAge) {
      params.set('age', newAge);
    } else {
      params.delete('age');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleChange} value={selectedAge}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Sélectionner une tranche d'âge" />
      </SelectTrigger>
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
  );
}