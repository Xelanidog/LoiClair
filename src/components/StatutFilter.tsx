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

export default function StatutFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Valeur actuelle dans l'URL (ou 'tous' par défaut)
  const [selectedStatut, setSelectedStatut] = useState(
    searchParams.get('statut') || 'tous'
  );

  useEffect(() => {
    const current = searchParams.get('statut') || 'tous';
    setSelectedStatut(current);
  }, [searchParams]);

  const handleChange = (value: string) => {
    setSelectedStatut(value);
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'tous') {
      params.delete('statut');
    } else {
      params.set('statut', value);
    }

    params.delete('page'); // On revient à la page 1 quand on change le filtre
    router.push(`?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleChange} value={selectedStatut}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Filtrer par statut" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Statut du dossier</SelectLabel>
          <SelectItem value="tous">Tous les statuts</SelectItem>
          <SelectItem value="en_cours_d_examen">En cours d'examen</SelectItem>
          <SelectItem value="adopte_par_assemblee">Adopté par l'Assemblée nationale</SelectItem>
          <SelectItem value="adopte_par_senat">Adopté par le Sénat</SelectItem>
          <SelectItem value="adopte_par_parlement">Adopté par le Parlement</SelectItem>
          <SelectItem value="promulguee">Promulguée</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}