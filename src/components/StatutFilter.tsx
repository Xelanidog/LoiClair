// src/components/StatutFilter.tsx
// Composant client-side pour le filtre par statut (utilise hooks React/Next et Shadcn Select pour UI élégante).

'use client'; // Marque comme Client Component.

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
} from "@/components/ui/select"; // Import Shadcn Select (chemin standard si installé via Shadcn CLI).
import { useEffect } from 'react'; // Pour écouter les changements d'URL.

export default function StatutFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedStatut, setSelectedStatut] = useState(searchParams.get('statut') || 'tous');

  useEffect(() => {
  // Sync l'état local avec l'URL actuelle (reset à 'tous' si param absent).
  const currentValue = searchParams.get('statut') || 'tous'; // Remplace 'statut' par 'age' ou 'type' selon le filtre.
  setSelectedStatut(currentValue); // Met à jour l'état si URL changée (ex. : après reset).
}, [searchParams]); // Dépend de searchParams pour re-run sur changements.

  const handleChange = (value: string) => {
    const newStatut = value === 'tous' ? '' : value.toLowerCase();
    setSelectedStatut(value); // Mise à jour état local.
    const params = new URLSearchParams(searchParams.toString());
    if (newStatut) {
      params.set('statut', newStatut);
    } else {
      params.delete('statut');
    }
    router.push(`?${params.toString()}`); // Met à jour URL et recharge data server-side.
  };

  return (
    <Select onValueChange={handleChange} value={selectedStatut}>
      <SelectTrigger className="w-48 hover:bg-gray-100 hover:border-blue-300 transition-colors duration-200"> {/* Largeur max comme dans l'exemple pour compacité. */}
        <SelectValue placeholder="Sélectionner un statut" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Statuts</SelectLabel> {/* Label groupe comme dans l'exemple. */}
          <SelectItem value="tous">Tous les statuts</SelectItem>
          <SelectItem value="en_cours">En cours</SelectItem>
          <SelectItem value="promulguee">Promulguée</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}