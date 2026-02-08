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

export default function StatutFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedStatut, setSelectedStatut] = useState(searchParams.get('statut') || 'tous');

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
      <SelectTrigger className="w-48"> {/* Largeur max comme dans l'exemple pour compacité. */}
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