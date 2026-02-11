// ──────────────────────────────────────────────────────────────────────────────
// Imports pour la route API : On utilise l'AI SDK de Vercel pour Grok (léger, compatible Next.js).
// Choix : AI SDK unifie les providers IA (xAI inclus), gère les clés et les erreurs automatiquement.
// Optimisations : Factorisation du fetch/extract ; imports ESM ; tout server-side pour sécurité.
// ──────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai'; // Core AI SDK (Vercel) pour appels IA unifiés
import { createXai } from '@ai-sdk/xai'; // Provider xAI/Grok spécifique
import * as cheerio from 'cheerio'; // Parser HTML ESM
import { SYSTEM_PROMPT_RESUME_LOI, USER_PROMPT_TEMPLATE_RESUME_LOI, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts'; // Centralisés.

// Crée le provider xAI avec ta clé (de .env.local).
const xai = createXai({ apiKey: process.env.XAI_API_KEY });

// Fonction factorisée pour fetch et extraire texte (HTML ou PDF).
async function fetchAndExtractText(lien: string): Promise<string> {
  const response = await fetch(lien);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error('Erreur fetch du lien texte.');
  }

  if (!contentType.includes('text/html') && !contentType.includes('application/pdf') && !contentType.includes('text/plain')) {
    throw new Error('Contenu non supporté.');
  }

  const { default: pdfParse } = await import('pdf-parse');

  if (lien.endsWith('.pdf') || contentType.includes('application/pdf')) {
    try {
      const buffer = await response.arrayBuffer();
      const pdfData = await pdfParse(Buffer.from(buffer));
      let texte = pdfData.text.trim();
      if (!texte) {
        console.warn('PDF extrait vide pour lien:', lien);
        return 'Texte PDF non extractible automatiquement. Consultez le lien original pour détails.'; // Fallback.
      }
      return texte.slice(0, MAX_INPUT_CHARS_RESUME_LOI);
    } catch (pdfError: any) {
      console.error('Erreur parse PDF:', pdfError.message, 'Lien:', lien);
      return 'Erreur extraction PDF : format invalide ou non supporté. Consultez le lien original.'; // Fallback.
    }
  } else {
    const html = await response.text();
    const $ = cheerio.load(html);
    return $('body').text().replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT_CHARS_RESUME_LOI);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titre_texte, lien } = body;

    let lienUtilise = lien; // Priorité au lien direct.
    let texteComplet = '';

    // Fetch et extract si lien disponible.
    if (lienUtilise) {
      texteComplet = await fetchAndExtractText(lienUtilise);
      if (!texteComplet) {
        return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Aucun lien fourni ou extrait.' }, { status: 400 });
    }

    // Génération résumé loi.
    const { text: resume } = await generateText({
      model: xai(MODEL_RESUME_LOI),
      system: SYSTEM_PROMPT_RESUME_LOI,
      prompt: USER_PROMPT_TEMPLATE_RESUME_LOI
        .replace('{titre_texte}', titre_texte || 'Titre inconnu')
        .replace('{texteComplet}', texteComplet || 'Texte non disponible'),
      ...PARAMS_RESUME_LOI,
    });


    return NextResponse.json({ resume, lien: lienUtilise });
  } catch (error: any) {
    console.error(`Erreur génération résumé:`, error.message);
    return NextResponse.json({ error: 'Désolé, une erreur est survenue lors de la génération du résumé IA. Réessayez plus tard.' }, { status: 500 });
  }
}