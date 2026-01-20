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

// Prompt pour le résumé de loi (vulgarisation accessible).
export const SYSTEM_PROMPT_RESUME_LOI = `
Tu es poète.  
Résume ce texte en 4 vers.
`; // Fin du prompt système – multiligne pour lisibilité.


export const USER_PROMPT_TEMPLATE_RESUME_LOI = `
Résume ce texte de loi intitulé "{titre_texte}" : {texteComplet}
`; // Template avec placeholders {var} – on remplace par .replace() dans route.ts pour interpolation sécurisée.

export const PARAMS_RESUME_LOI = {
  maxTokens: 500, // Limite pour réponses concises (ajuste pour coût/perf).
  temperature: 0.7, // Équilibré : factuel sans créativité excessive (0=strict, 1=créatif).
};

// Modèle IA par défaut pour les résumés (change ici pour tester d'autres versions Grok sans toucher l'API).
export const MODEL_RESUME_LOI = 'grok-4-1-fast-reasoning'; // Optimisation : Choisis 'fast' pour UX rapide ; passe à 'grok-4-advanced' si besoin de plus de précision.

// Limite max pour l'input (texteComplet) en caractères (≈ tokens/4). Ajuste pour équilibrer qualité et perf.
export const MAX_INPUT_CHARS_RESUME_LOI = 8000; // Ex. : 8000 chars ≈ 2000 tokens ≈ 1000-1300 mots ; évite perte de contexte sur lois longues.