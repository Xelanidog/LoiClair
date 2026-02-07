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
import { SYSTEM_PROMPT_RESUME_LOI, USER_PROMPT_TEMPLATE_RESUME_LOI, PARAMS_RESUME_LOI, MODEL_RESUME_LOI, MAX_INPUT_CHARS_RESUME_LOI } from '@/lib/prompts'; // Centralisés.
import { SYSTEM_PROMPT_RESUME_CHRONO, USER_PROMPT_TEMPLATE_RESUME_CHRONO, PARAMS_RESUME_CHRONO, MODEL_RESUME_CHRONO, MAX_INPUT_CHARS_RESUME_CHRONO } from '@/lib/prompts';

// Crée le provider xAI avec ta clé (de .env.local).
const xai = createXai({ apiKey: process.env.XAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chronologie_complete, titre_texte, lien } = body; // Ajout 'lien' optionnel pour résumé direct.

    let texteComplet = '';
    let lienUtilise = lien; // Priorité au lien direct si fourni.

    // Si lien direct fourni, fetch/extract direct ; sinon, parse chrono comme avant.
    if (lienUtilise) {
      const response = await fetch(lienUtilise);
      const contentType = response.headers.get('content-type') || '';

      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/pdf') &&
        !contentType.includes('text/plain')
      ) {
        return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 400 });
      }

      if (!response.ok) {
        throw new Error('Erreur fetch du lien texte.');
      }

      const pdfParse = (await import('pdf-parse')).default;

      if (lienUtilise.endsWith('.pdf') || contentType.includes('application/pdf')) {
        try {
          const buffer = await response.arrayBuffer();
          const pdfData = await pdfParse(Buffer.from(buffer));
          texteComplet = pdfData.text.slice(0, MAX_INPUT_CHARS_RESUME_LOI);
          if (!texteComplet.trim()) {
            console.warn('PDF extrait vide pour lien:', lienUtilise);
            texteComplet = 'Texte PDF non extractible automatiquement. Consultez le lien original pour détails.'; // Fallback texte pour IA
          }
        } catch (pdfError: any) {
          console.error('Erreur parse PDF détaillée:', pdfError.message, pdfError.stack, 'Lien:', lienUtilise); // Log amélioré avec stack pour trace.
          texteComplet = 'Erreur extraction PDF : format invalide ou non supporté. Consultez le lien original.'; // Fallback pour continuer avec IA (neutre).
        }
      } else {
        const html = await response.text();
        const $ = cheerio.load(html);
        texteComplet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT_CHARS_RESUME_LOI);
      }

      if (!texteComplet) {
        return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 500 });
      }
    } else {
      // Mode legacy : parse chrono pour trouver lien (si pas de lien direct).
      const chronologie = JSON.parse(chronologie_complete);
      const etapesAvecTextes = chronologie
        .filter((etape: any) => etape.infos_brutes?.liens_textes && Object.keys(etape.infos_brutes.liens_textes).length > 0)
        .sort((a: any, b: any) => new Date(b.infos_brutes.date).getTime() - new Date(a.infos_brutes.date).getTime());

      if (etapesAvecTextes.length === 0) {
        return NextResponse.json({ error: 'Aucun texte récent trouvé pour cette loi.' }, { status: 404 });
      }

      const dernierTexte = etapesAvecTextes[0].infos_brutes.liens_textes[Object.keys(etapesAvecTextes[0].infos_brutes.liens_textes)[0]];
      lienUtilise = dernierTexte.html || dernierTexte.pdf;

      if (!lienUtilise || !lienUtilise.startsWith('http')) {
        throw new Error('Lien texte invalide ou manquant.');
      }

      // Fetch et extract comme ci-dessus (code dupliqué pour clarté ; refactor si besoin).
      const response = await fetch(lienUtilise);
      const contentType = response.headers.get('content-type') || '';

      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/pdf') &&
        !contentType.includes('text/plain')
      ) {
        return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 400 });
      }

      if (!response.ok) {
        throw new Error('Erreur fetch du lien texte.');
      }

      const pdfParse = (await import('pdf-parse')).default;

      if (lienUtilise.endsWith('.pdf') || contentType.includes('application/pdf')) {
        try {
          const buffer = await response.arrayBuffer();
          const pdfData = await pdfParse(Buffer.from(buffer));
          texteComplet = pdfData.text.slice(0, MAX_INPUT_CHARS_RESUME_LOI);
          if (!texteComplet.trim()) {
            console.warn('PDF extrait vide pour lien:', lienUtilise);
            texteComplet = 'Texte PDF non extractible automatiquement. Consultez le lien original pour détails.'; // Fallback texte pour IA
          }
        } catch (pdfError: any) {
          console.error('Erreur parse PDF détaillée:', pdfError.message, pdfError.stack, 'Lien:', lienUtilise); // Log amélioré avec stack pour trace.
          texteComplet = 'Erreur extraction PDF : format invalide ou non supporté. Consultez le lien original.'; // Fallback pour continuer avec IA (neutre).
        }
      } else {
        const html = await response.text();
        const $ = cheerio.load(html);
        texteComplet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT_CHARS_RESUME_LOI);
      }

      if (!texteComplet) {
        return NextResponse.json({ error: 'Lien erroné ou contenu non encore disponible.' }, { status: 500 });
      }
    }

    // Génération résumé loi (toujours, car focus ici).
    const { text: resume } = await generateText({
      model: xai(MODEL_RESUME_LOI),
      system: SYSTEM_PROMPT_RESUME_LOI,
      prompt: USER_PROMPT_TEMPLATE_RESUME_LOI
        .replace('{titre_texte}', titre_texte || 'Titre inconnu')
        .replace('{texteComplet}', texteComplet || 'Texte non disponible'),
      ...PARAMS_RESUME_LOI,
    });

    // Résumé chrono optionnel (seulement si chronologie fournie).
    let resumeChrono = '';
    if (chronologie_complete) {
      let chronoTronquee = chronologie_complete.slice(0, MAX_INPUT_CHARS_RESUME_CHRONO);
      if (chronoTronquee.length < 50) {
        console.warn(`Chrono incomplète pour titre "${titre_texte}" – résumé chrono skipped.`);
        chronoTronquee = '';
      } else {
        const { text } = await generateText({
          model: xai(MODEL_RESUME_CHRONO),
          system: SYSTEM_PROMPT_RESUME_CHRONO,
          prompt: USER_PROMPT_TEMPLATE_RESUME_CHRONO
            .replace('{titre_texte}', titre_texte || 'Titre inconnu')
            .replace('{chronologie_complete}', chronoTronquee || 'Chronologie non disponible'),
          ...PARAMS_RESUME_CHRONO,
        });
        resumeChrono = text;
      }
    }

    return NextResponse.json({ resume, resumeChrono, lien: lienUtilise });
  } catch (error: any) {
    console.error(`Erreur génération résumé:`, error.message);
    return NextResponse.json({ error: 'Désolé, une erreur est survenue lors de la génération du résumé IA. Réessayez plus tard.' }, { status: 500 });
  }
}