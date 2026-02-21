// ──────────────────────────────────────────────────────────────────────────────
// Imports pour la route API : On utilise l'AI SDK de Vercel pour Grok (léger, compatible Next.js).
// Choix : AI SDK unifie les providers IA (xAI inclus), gère les clés et les erreurs automatiquement.
// Optimisations : Factorisation du fetch/extract ; imports ESM ; tout server-side pour sécurité.
// ──────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai'; // Core AI SDK (Vercel) pour appels IA unifiés (seul import nécessaire pour streaming)
import { createXai } from '@ai-sdk/xai'; // Provider xAI/Grok spécifique
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { SYSTEM_PROMPT_RESUME_LOI, USER_PROMPT_TEMPLATE_RESUME_LOI, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts';

const xai = createXai({ apiKey: process.env.XAI_API_KEY });

async function fetchAndExtractText(lien: string): Promise<string> {
  const response = await fetch(lien);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error('Erreur fetch du lien texte.');
  }

  if (!contentType.includes('text/html') && !contentType.includes('application/pdf') && !contentType.includes('text/plain')) {
    throw new Error('Contenu non supporté.');
  }

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
    const raw = await request.json(); // Renomme 'body' en 'raw' pour clarté.

    let lien: string | undefined = raw.lien; // Typé pour sécurité.
    let titre_texte: string | undefined = raw.titre_texte;

    // Support pour useCompletion : parse si 'prompt' est un JSON stringifié.
    if (typeof raw.prompt === 'string') {
      try {
        const parsed = JSON.parse(raw.prompt);
        lien = parsed.lien || lien;
        titre_texte = parsed.titre_texte || titre_texte;
      } catch (parseError) {
        console.error('Erreur parse prompt:', parseError);
        return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
      }
    }


    // Guard précoce : si pas de lien après parsing, erreur immédiate.
    if (!lien) {
      return NextResponse.json({ error: 'Aucun lien fourni ou extrait.' }, { status: 400 });
    }

    // Priorité au lien direct.
    let lienUtilise = lien; // Déclaration manquante dans ton code !
    let texteComplet = ''; // Déclaration manquante dans ton code !

    // Fetch et extract si lien disponible.
    texteComplet = await fetchAndExtractText(lienUtilise);
    if (!texteComplet) {
      return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 500 });
    }

    // Génération résumé loi en streaming.
    const result = await streamText({
      model: xai(MODEL_RESUME_LOI),
      system: SYSTEM_PROMPT_RESUME_LOI,
      prompt: USER_PROMPT_TEMPLATE_RESUME_LOI
        .replace('{titre_texte}', titre_texte || 'Titre inconnu')
        .replace('{texteComplet}', texteComplet || 'Texte non disponible'),
      ...PARAMS_RESUME_LOI,
    });

    return result.toTextStreamResponse(); // Retourne le stream pour le frontend.
  } catch (error: any) {
    console.error('Erreur génération résumé:', error?.message || error || 'Erreur inconnue'); // Fixé pour éviter "error is not defined" (plus robuste).
    return NextResponse.json({ error: 'Désolé, une erreur est survenue lors de la génération du résumé IA. Réessayez plus tard.' }, { status: 500 });
  }
}