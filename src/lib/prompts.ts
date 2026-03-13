// ──────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DES PROMPTS IA POUR LOICLAIR
// ──────────────────────────────────────────────────────────────────────────────
// Ce fichier centralise tous les prompts et params IA pour une itération facile.
// Chaque prompt est une constante exportée : modifie ici sans toucher au code API.
// Structure :
// - SYSTEM_PROMPT_XXX : Prompt système statique (rôle de l'IA).
// - USER_PROMPT_TEMPLATE_XXX : Template pour le prompt utilisateur (avec placeholders comme ${variable}).
// - PARAMS_XXX : Objet avec maxTokens, temperature, etc.
// ──────────────────────────────────────────────────────────────────────────────

// Prompt pour le résumé de loi (vulgarisation accessible, ton conversationnel, 3 sections).
export const SYSTEM_PROMPT_RESUME_LOI = `
Tu es un assistant citoyen qui explique les textes de loi français en langage courant.
Tu tutoies le lecteur. Tu es direct, concret, neutre.
Réponds en 3 sections structurées avec ces titres EXACTS :

## Ce que dit ce texte
[Explique en 2-3 phrases simples, comme si tu parlais à un ami. Maximum 60 mots.]

## Ce qui change concrètement
[3-5 bullet points courts. Chaque point commence par un verbe d'action (crée, supprime, renforce, oblige, autorise…). Maximum 80 mots au total.]

## À retenir
[1 seule phrase de conclusion — le takeaway essentiel pour un citoyen. Maximum 25 mots.]

Pas de jargon juridique. Pas de formules creuses. Va droit au but.
`; // Fin du prompt système – ton conversationnel, tutoiement.


export const USER_PROMPT_TEMPLATE_RESUME_LOI = `
Résume ce texte de loi intitulé "{titre_texte}" : {texteComplet}.
`; // Template avec placeholders {var} – on remplace par .replace() dans route.ts pour interpolation sécurisée.

// English version of the law summary prompt.
export const SYSTEM_PROMPT_RESUME_LOI_EN = `
You are a citizen assistant that explains French legislative texts in plain language.
You address the reader directly ("you"). You are direct, concrete, and neutral.
Answer in 3 structured sections with these EXACT headings:

## What this text says
[Explain in 2-3 simple sentences, as if talking to a friend. Maximum 60 words.]

## What concretely changes
[3-5 short bullet points. Each point starts with an action verb (creates, removes, strengthens, requires, allows…). Maximum 80 words total.]

## Key takeaway
[1 single concluding sentence — the essential takeaway for a citizen. Maximum 25 words.]

No legal jargon. No empty phrases. Get straight to the point.
`; // English system prompt – direct tone, "you" address.

export const USER_PROMPT_TEMPLATE_RESUME_LOI_EN = `
Summarize this legislative text titled "{titre_texte}": {texteComplet}.
`; // EN template with {var} placeholders – replaced via .replace() in route.ts.

export const PARAMS_RESUME_LOI = {
  maxTokens: 600, // 3 sections : Ce que dit (60 mots) + Ce qui change (80 mots) + À retenir (25 mots) ≈ 400-500 tokens.
  temperature: 0.7, // Équilibré : factuel sans créativité excessive (0=strict, 1=créatif).
};

// Modèle IA par défaut pour les résumés (change ici pour tester d'autres versions Grok sans toucher l'API).
export const MODEL_RESUME_LOI = 'grok-4-1-fast-non-reasoning'; // Optimisation : Choisis 'fast' pour UX rapide ; passe à 'grok-4-advanced' si besoin de plus de précision.

// Limite max pour l'input (texteComplet) en caractères (≈ tokens/4). Ajuste pour équilibrer qualité et perf.
export const MAX_INPUT_CHARS_RESUME_LOI = 20000; // Ex. : 8000 chars ≈ 2000 tokens ≈ 1000-1300 mots ; évite perte de contexte sur lois longues.

// Version du prompt – hash auto-calculé à partir du contenu (prompt + modèle + params).
// Toute modification ci-dessus invalide automatiquement le cache, sans bump manuel.
import { createHash } from 'crypto';
export const PROMPT_VERSION_RESUME_LOI = createHash('md5')
  .update(SYSTEM_PROMPT_RESUME_LOI + USER_PROMPT_TEMPLATE_RESUME_LOI + MODEL_RESUME_LOI + JSON.stringify(PARAMS_RESUME_LOI))
  .digest('hex')
  .slice(0, 8);

// Locale-aware getters — use these in API routes and client components.
export function getSystemPrompt(locale: string): string {
  return locale === 'en' ? SYSTEM_PROMPT_RESUME_LOI_EN : SYSTEM_PROMPT_RESUME_LOI;
}

export function getUserPromptTemplate(locale: string): string {
  return locale === 'en' ? USER_PROMPT_TEMPLATE_RESUME_LOI_EN : USER_PROMPT_TEMPLATE_RESUME_LOI;
}

export function getPromptVersion(locale: string): string {
  if (locale === 'en') {
    return createHash('md5')
      .update(SYSTEM_PROMPT_RESUME_LOI_EN + USER_PROMPT_TEMPLATE_RESUME_LOI_EN + MODEL_RESUME_LOI + JSON.stringify(PARAMS_RESUME_LOI))
      .digest('hex')
      .slice(0, 8);
  }
  return PROMPT_VERSION_RESUME_LOI;
}
