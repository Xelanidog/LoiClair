// src/components/GroupeFilter.tsx
// Composant client-side pour le filtre par groupe de l'initiateur (utilise hooks React/Next et Shadcn Select).
// Options dynamiques basées sur les libellés uniques des groupes extraits de Supabase via joins.
// On utilise des slugs lowercase/underscore pour l'URL (param 'groupe').

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

export default function GroupeFilter({ uniqueGroups, groupMap }: { uniqueGroups: string[]; groupMap: { [key: string]: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedGroupe, setSelectedGroupe] = useState(searchParams.get('groupe') || 'tous');

  // Sync l'état local avec l'URL actuelle (pour reset visuel après clear).
  useEffect(() => {
    const currentValue = searchParams.get('groupe') || 'tous';
    setSelectedGroupe(currentValue);
  }, [searchParams]);

  const handleChange = (value: string) => {
    const newGroupe = value === 'tous' ? '' : value; // Garde le slug pour l'URL.
    setSelectedGroupe(value);
    const params = new URLSearchParams(searchParams.toString());
    if (newGroupe) {
      params.set('groupe', newGroupe);
    } else {
      params.delete('groupe');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleChange} value={selectedGroupe}>
      <SelectTrigger className="w-full max-w-48 hover:bg-gray-100 hover:border-blue-300 transition-colors duration-200">
        <SelectValue placeholder="Sélectionner un groupe" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="tous">Tous les groupes</SelectItem>
          {uniqueGroups.map((group) => {
            // Trouve le slug correspondant.
            const slug = Object.keys(groupMap).find(key => groupMap[key] === group) || '';
            if (!slug) return null; // Ignore si pas de slug (rare).
            return (
              <SelectItem key={slug} value={slug}>
                {group}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}