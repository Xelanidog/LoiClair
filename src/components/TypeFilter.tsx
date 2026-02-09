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

export default function TypeFilter({ uniqueTypes, procedureMap }: { uniqueTypes: string[]; procedureMap: { [key: string]: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'tous');


  const handleChange = (value: string) => {
    const newType = value === 'tous' ? '' : value; // On garde le slug tel quel pour l'URL.
    setSelectedType(value);
    const params = new URLSearchParams(searchParams.toString());
    if (newType) {
      params.set('type', newType);
    } else {
      params.delete('type');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleChange} value={selectedType}>
      <SelectTrigger className="w-full max-w-48">
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