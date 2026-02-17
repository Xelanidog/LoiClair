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

export default function StatutFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const isActive = selectedStatut !== 'tous';

  return (
   <TooltipProvider>
  <Tooltip>
    <Select onValueChange={handleChange} value={selectedStatut}>
      <TooltipTrigger asChild>
        <SelectTrigger
          className={`
            max-w-56 transition-colors duration-200
            ${isActive
              ? 'border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-100'
              : 'border-input hover:bg-gray-100 hover:border-blue-300'}
          `}
        >
          <SelectValue placeholder="Filtrer par statut" />
          {isActive && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Actif
            </span>
          )}
        </SelectTrigger>
      </TooltipTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Statut du dossier</SelectLabel>
          <SelectItem value="tous">Tous les statuts</SelectItem>
          <SelectItem value="en_cours_d_examen">En cours d'examen</SelectItem>
          <SelectItem value="adopte_par_assemblee">Adopté par l'Assemblée nationale</SelectItem>
          <SelectItem value="adopte_par_senat">Adopté par le Sénat</SelectItem>
          <SelectItem value="adopte_par_parlement">Adopté par le Parlement</SelectItem>
          <SelectItem value="rejetee">Rejeté</SelectItem>
          <SelectItem value="promulguee">Promulguée</SelectItem>
        </SelectGroup>
      </SelectContent>

      {/* TooltipContent doit être à l'intérieur du Tooltip, mais en dehors du Select */}
      <TooltipContent side="bottom" align="start" className="max-w-xs text-base leading-relaxed">
        <p className="font-medium">Filtre par statut du dossier</p>
        <p className="text-muted-foreground mt-1">
          Affiche uniquement les dossiers dans l’état choisi (en cours, adopté, promulgué, rejeté…).
        </p>
      </TooltipContent>
    </Select>
  </Tooltip>
</TooltipProvider>
  );
}