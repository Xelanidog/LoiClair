// src/lib/csvLoader.ts
import Papa from 'papaparse';

export interface LoiCSV {
  numero_dossier: string;
  type_texte: string;
  titre_texte: string;
  auteur: string;
  lien_dossier_an?: string;
  lien_dossier_senat?: string;
  lien_dossier_legifrance?: string;
  statut_final: string;
  date_depot: string;
  date_promulgation?: string;
  delai_jours?: string;
  themes: string;
  chronologie_complete: string; // ← JSON stringifié dans le CSV
}

export async function loadLoisFromCSV(): Promise<LoiCSV[]> {
  // Méthode 1 : fetch depuis public/ (plus simple pour Next.js)
  const response = await fetch('/data/loiclair_dossiers_v1.4.csv');
  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<LoiCSV>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        // Optionnel : transformer la chronologie en vrai objet JSON
        const lois = result.data.map(loi => ({
          ...loi,
          chronologie_complete: loi.chronologie_complete 
            ? JSON.parse(loi.chronologie_complete) 
            : []
        }));
        resolve(lois);
      },
      error: (error) => reject(error)
    });
  });
}