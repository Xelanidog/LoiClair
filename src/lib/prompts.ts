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

// Prompt pour le résumé de loi (vulgarisation accessible, structuré en 4 sections).
export const SYSTEM_PROMPT_RESUME_LOI = `
Tu es un expert en droit français qui vulgarise les textes législatifs pour les citoyens.
Réponds en 4 sections structurées avec ces titres EXACTS :

## En bref
[Résumé en 2-3 phrases, maximum 50 mots. L'essentiel de ce texte en langage courant.]

## Pourquoi cette loi ?
[Contexte et objectif principal du texte, 2-3 phrases]

## Changements clés
[Les 3-4 modifications principales sous forme de liste courte]

## Impact attendu
[Conséquences concrètes pour les citoyens, 2-3 phrases]

Sois neutre, accessible et concis. Maximum 120 mots par section (50 mots pour "En bref").
`; // Fin du prompt système – multiligne pour lisibilité.


export const USER_PROMPT_TEMPLATE_RESUME_LOI = `
Résume ce texte de loi intitulé "{titre_texte}" : {texteComplet}.
`; // Template avec placeholders {var} – on remplace par .replace() dans route.ts pour interpolation sécurisée.

export const PARAMS_RESUME_LOI = {
  maxTokens: 800, // 4 sections : En bref (50 mots) + 3 × 120 mots ≈ 600-700 tokens.
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