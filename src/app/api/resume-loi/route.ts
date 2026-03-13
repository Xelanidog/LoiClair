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
import { getSystemPrompt, getUserPromptTemplate, getPromptVersion, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts';
import { supabase } from '@/lib/supabase';

const xai = createXai({ apiKey: process.env.XAI_API_KEY });

async function fetchAndExtractText(lien: string): Promise<string> {
  const response = await fetch(lien, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  });
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
    let texte_uid: string | undefined = raw.texte_uid;
    let contenu_legifrance: string | undefined = raw.contenu_legifrance;
    let locale: string = raw.locale || 'fr';

    // Support pour useCompletion : parse si 'prompt' est un JSON stringifié.
    if (typeof raw.prompt === 'string') {
      try {
        const parsed = JSON.parse(raw.prompt);
        lien = parsed.lien || lien;
        titre_texte = parsed.titre_texte || titre_texte;
        texte_uid = parsed.texte_uid || texte_uid;
        contenu_legifrance = parsed.contenu_legifrance || contenu_legifrance;
        locale = parsed.locale || locale;
      } catch (parseError) {
        console.error('Erreur parse prompt:', parseError);
        return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 });
      }
    }

    // Normalise locale: only 'en' or 'fr' accepted.
    if (locale !== 'en') locale = 'fr';

    // Guard : il faut au moins un contenu ou un lien.
    if (!lien && !contenu_legifrance) {
      return NextResponse.json({ error: 'Aucun lien ou contenu fourni.' }, { status: 400 });
    }

    // Priorité au contenu Légifrance pré-stocké (évite le fetch URL fragile).
    let texteComplet = '';

    if (contenu_legifrance) {
      texteComplet = contenu_legifrance.slice(0, MAX_INPUT_CHARS_RESUME_LOI);
    } else if (lien) {
      texteComplet = await fetchAndExtractText(lien);
    }

    if (!texteComplet) {
      return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 500 });
    }

    // Cache column depends on locale: 'resume_ia' for FR, 'resume_ia_en' for EN.
    const cacheColumn = locale === 'en' ? 'resume_ia_en' : 'resume_ia';
    const promptVersion = getPromptVersion(locale);

    // Génération résumé loi en streaming + sauvegarde cache après complétion.
    const result = await streamText({
      model: xai(MODEL_RESUME_LOI),
      system: getSystemPrompt(locale),
      prompt: getUserPromptTemplate(locale)
        .replace('{titre_texte}', titre_texte || 'Titre inconnu')
        .replace('{texteComplet}', texteComplet || 'Texte non disponible'),
      ...PARAMS_RESUME_LOI,
      onFinish: async ({ text }) => {
        if (texte_uid && text) {
          try {
            await supabase.from('textes').update({
              [cacheColumn]: text,
              resume_ia_prompt_version: promptVersion,
              resume_ia_created_at: new Date().toISOString(),
            }).eq('uid', texte_uid);
          } catch (err) {
            console.error('Erreur sauvegarde cache resume_ia:', err);
          }
        }
      },
    });

    return result.toTextStreamResponse(); // Retourne le stream pour le frontend.
  } catch (error: any) {
    console.error('Erreur génération résumé:', error?.message || error || 'Erreur inconnue'); // Fixé pour éviter "error is not defined" (plus robuste).
    return NextResponse.json({ error: 'Désolé, une erreur est survenue lors de la génération du résumé IA. Réessayez plus tard.' }, { status: 500 });
  }
}
