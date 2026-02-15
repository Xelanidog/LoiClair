// src/components/TypeFilter.tsx
// Composant client-side pour le filtre par type de procédure (utilise hooks React/Next et Shadcn Select).
// Options basées sur les valeurs uniques de procedure_libelle extraites de Supabase.
// On utilise des slugs lowercase/underscore pour l'URL (param 'type').

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

export default function TypeFilter({ uniqueTypes, procedureMap }: { uniqueTypes: string[]; procedureMap: { [key: string]: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'tous');

  useEffect(() => {
  // Sync l'état local avec l'URL actuelle (reset à 'tous' si param absent).
  const currentValue = searchParams.get('type') || 'tous'; // Remplace 'statut' par 'age' ou 'type' selon le filtre.
  setSelectedType(currentValue); // Met à jour l'état si URL changée (ex. : après reset).
}, [searchParams]); // Dépend de searchParams pour re-run sur changements.


  const handleChange = (value: string) => {
    const newType = value === 'tous' ? '' : value; // On garde le slug tel quel pour l'URL.
    setSelectedType(value);
    const params = new URLSearchParams(searchParams.toString());
    if (newType) {
      params.set('type', newType);
    } else {
      params.delete('type');
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleChange} value={selectedType}>
      <SelectTrigger className="w-full max-w-48 hover:bg-gray-100 hover:border-blue-300 transition-colors duration-200">
        <SelectValue placeholder="Sélectionner un type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Type de procédure</SelectLabel>
          <SelectItem value="tous">Tous les types</SelectItem>

          {uniqueTypes.map((type) => {
  // Récupère le slug correspondant (inverse du map pour l'affichage).
  const slug = Object.keys(procedureMap).find(key => procedureMap[key] === type) || '';
  return (
    <SelectItem key={slug} value={slug}>
      {type}
    </SelectItem>
  );
})}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}