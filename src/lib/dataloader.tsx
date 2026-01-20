// src/lib/dataLoader.ts
// ──────────────────────────────────────────────────────────────────────────────
// Utilitaire pour charger et parser le CSV des dossiers législatifs
// Choix d'optimisation :
// - Utilisation de fetch + PapaParse → pas de dépendance webpack complexe
// - Chargement côté client uniquement (pour l'instant)
// - Parsing du champ chronologie_complete qui est une string JSON
// - Erreurs gérées avec fallback [] pour ne jamais casser l'UI

import Papa from 'papaparse';

export interface Loi {
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
  delai_jours?: string | number;
  themes: string;
  chronologie_complete: {
    etape_uid: string;
    infos_brutes?: any;
    vulgarisation: string;
  }[];
}

export async function loadAllLaws(): Promise<Loi[]> {
  try {
    // On fetch depuis /public/data/lois.csv
    const response = await fetch('/data/lois.csv');

    if (!response.ok) {
      throw new Error(`Erreur lors du chargement du CSV : ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<Loi>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,          // Convertit automatiquement les nombres, booléens...
        transformHeader: (header) => header.trim(), // Nettoie les noms de colonnes

        complete: (result) => {
          // Transformation clé : le champ chronologie_complete est une string JSON dans le CSV
          const parsedLaws = result.data.map((row) => {
            let chronologie = [];
            try {
              if (row.chronologie_complete && typeof row.chronologie_complete === 'string') {
                chronologie = JSON.parse(row.chronologie_complete);
              }
            } catch (parseError) {
              console.warn(`Erreur parsing chronologie pour ${row.numero_dossier} :`, parseError);
            }

            return {
              ...row,
              chronologie_complete: chronologie,
            } as Loi;
          });

          resolve(parsedLaws);
        },

        error: (error) => {
          console.error('Erreur PapaParse :', error);
          reject(error);
        },
      });
    });
  } catch (err) {
    console.error('Échec total chargement CSV :', err);
    return []; // On renvoie un tableau vide pour ne pas casser l'UI
  }
}