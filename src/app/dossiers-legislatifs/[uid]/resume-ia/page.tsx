// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Page dynamique pour le résumé IA d'un dossier (basée sur uid).
// Pour l'instant vide ; on ajoutera l'appel xAI plus tard.
"use client";

import { useParams } from 'next/navigation'; // Pour récupérer l'uid des params.

export default function ResumeIAPage() {
  const params = useParams(); // Récupère l'uid du URL.
  const uid = params.uid as string; // Typage simple.

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Résumé IA pour le dossier {uid}</h1>
      <p>Contenu IA à venir (appel xAI, etc.).</p>
    </div>
  );
}