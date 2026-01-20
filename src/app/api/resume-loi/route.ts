// ──────────────────────────────────────────────────────────────────────────────
// Imports pour la route API : On utilise l'AI SDK de Vercel pour Grok (léger, compatible Next.js).
// Choix : AI SDK unifie les providers IA (xAI inclus), gère les clés et les erreurs automatiquement.
// Optimisations depuis v1 : Ajout de cheerio/pdf-parse pour extraction contenu ; imports ajustés pour ESM/Turbopack.
// Pas de dépendances lourdes ; tout server-side pour sécurité (clé API cachée).
// ──────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai'; // Core AI SDK (Vercel) pour appels IA unifiés
import { createXai } from '@ai-sdk/xai'; // Provider xAI/Grok spécifique
import * as cheerio from 'cheerio'; // Import ESM correct pour parser HTML (évite erreur default export)

// Crée le provider xAI avec ta clé (de .env.local).
// Optimisation : Sécurisé server-side ; modèle Grok-4 par défaut pour vulgarisation précise.
const xai = createXai({ apiKey: process.env.XAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { chronologie_complete, titre_texte } = await request.json(); // Reçoit la chrono JSON et titre

    // Étape 1 : Parser chronologie_complete (JSON string) pour trouver le texte le plus récent
    // On trie par date descendante et prend le dernier avec un lien texte (priorité HTML > PDF)
    const chronologie = JSON.parse(chronologie_complete);
    const etapesAvecTextes = chronologie
      .filter((etape: any) => etape.infos_brutes?.liens_textes && Object.keys(etape.infos_brutes.liens_textes).length > 0)
      .sort((a: any, b: any) => new Date(b.infos_brutes.date).getTime() - new Date(a.infos_brutes.date).getTime()); // Plus récent d'abord

    if (etapesAvecTextes.length === 0) {
      return NextResponse.json({ error: 'Aucun texte récent trouvé pour cette loi.' }, { status: 404 });
    }

    // Prend le premier (plus récent), et priorise HTML si dispo, sinon PDF
    const dernierTexte = etapesAvecTextes[0].infos_brutes.liens_textes[Object.keys(etapesAvecTextes[0].infos_brutes.liens_textes)[0]];
    const lien = dernierTexte.html || dernierTexte.pdf; // HTML prioritaire
    if (!lien) {
      return NextResponse.json({ error: 'Lien texte invalide.' }, { status: 400 });
    }
    // ──────────────────────────────────────────────────────────────────────────────
// Check lien valide pré-fetch : Évite throw sur liens vides ou malformés (ex. CSV test).
// Choix d'optimisation cumulée : Plus robuste pour données réelles LoiClair ; fallback précoce pour perf (évite appel réseau inutile) ; message clair pour UX panneau.
// ──────────────────────────────────────────────────────────────────────────────
if (!lien || !lien.startsWith('http')) { // Vérifie lien non vide et format URL basique
  throw new Error('Lien texte invalide ou manquant.'); // Throw pour catch ; message loggé
}

  // Étape 2 : Fetcher et extraire le contenu texte
const response = await fetch(lien);
const contentType = response.headers.get('content-type') || ''; // Récupère le type MIME pour check

// Nouveau check : Vérifie si c'est bien un HTML ou PDF ; sinon, error spécifique sans throw
if (
  !contentType.includes('text/html') && 
  !contentType.includes('application/pdf') && 
  !contentType.includes('text/plain') // Tolère plain pour fallback rare
) {
  return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 400 }); // Retour JSON user-friendly ; status 400 pour "bad request"
}

if (!response.ok) {
  throw new Error('Erreur fetch du lien texte.'); // Throw seulement sur vrais échecs HTTP (ex. 404, 500)
}

const pdfParse = (await import('pdf-parse')).default; // Import ESM dynamique – utilise le default named pour parse PDF

let texteComplet = '';
if (lien.endsWith('.pdf') || contentType.includes('application/pdf')) { // Check doublé sur extension + type pour sécurité
  // Extraction PDF : buffer → texte
  const buffer = await response.arrayBuffer();
  const pdfData = await pdfParse(Buffer.from(buffer));
  texteComplet = pdfData.text.slice(0, 5000); // Limite à ~5000 chars pour API (optimisation coût)
} else {
  // Extraction HTML : body text propre
  const html = await response.text();
  const $ = cheerio.load(html);
  texteComplet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Nettoyage + limite
}

if (!texteComplet) {
  return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 500 }); // Fallback si extraction vide
}

const { text: resume } = await generateText({ // Ouverture de l'objet passé à generateText
  model: xai('grok-4-1-fast-reasoning'), // Modèle Grok-4 (ajuste si nouveau modèle dispo en 2026)
  system: 'Tu es un expert en vulgarisation du droit français. Résume ce texte de loi en français courant, accessible : objectif principal, implications concrètes pour les citoyens, neutre et factuel. Structure : "Objectif principal :", "Ce que ça change concrètement :". Limite à 300 mots.', // Prompt système (statique)
  prompt: `Résume ce texte de loi intitulé "${titre_texte}" : ${texteComplet}`, // Prompt utilisateur avec interpolation
  maxTokens: 500, // Limite pour réponses concises
  temperature: 0.7, // Équilibré : factuel sans créativité excessive
}); // Fermeture correcte de l'appel generateText (parenthèse + point-virgule pour équilibre)

return NextResponse.json({ resume, lien }); // Retour avec résumé et lien officiel utilisé par IA
} // Fermeture du try – équilibre pour attacher le catch directement

catch (error) { 
  console.error(`Erreur génération résumé pour lien "${lien}":`, error); // Log avec lien pour context ; backticks pour interpolation
  return NextResponse.json({ error: 'Désolé, une erreur est survenue lors de la génération du résumé IA. Réessayez plus tard.' }, { status: 500 }); // Retour JSON user-friendly ; statut pour monitoring
}} // Fin du bloc catch – erreurs gérées, équilibre syntaxe pour éviter parse errors