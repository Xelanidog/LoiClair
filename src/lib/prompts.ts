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
Résume ce texte en moins de 500 mots.
`; // Fin du prompt système – multiligne pour lisibilité.


export const USER_PROMPT_TEMPLATE_RESUME_LOI = `
Résume ce texte de loi intitulé "{titre_texte}" : {texteComplet}.
`; // Template avec placeholders {var} – on remplace par .replace() dans route.ts pour interpolation sécurisée.

export const PARAMS_RESUME_LOI = {
  maxTokens: 500, // Limite pour réponses concises (ajuste pour coût/perf).
  temperature: 0.7, // Équilibré : factuel sans créativité excessive (0=strict, 1=créatif).
};

// Modèle IA par défaut pour les résumés (change ici pour tester d'autres versions Grok sans toucher l'API).
export const MODEL_RESUME_LOI = 'grok-4-1-fast-non-reasoning'; // Optimisation : Choisis 'fast' pour UX rapide ; passe à 'grok-4-advanced' si besoin de plus de précision.

// Limite max pour l'input (texteComplet) en caractères (≈ tokens/4). Ajuste pour équilibrer qualité et perf.
export const MAX_INPUT_CHARS_RESUME_LOI = 20000; // Ex. : 8000 chars ≈ 2000 tokens ≈ 1000-1300 mots ; évite perte de contexte sur lois longues.


// Prompt pour le résumé de la chronologie (parcours de la loi : étapes franchies + suivante).
export const SYSTEM_PROMPT_RESUME_CHRONO = `
Tu es un expert en processus législatif français. Analyse le JSON de chronologie fourni pour extraire l'ordre chronologique réel basé sur les dates et codes_acte (ex. : dépôt AN1-DEPOT toujours avant commissions ou débats).  
Ne fournit pas les code_actes ou référence du texte (exemple: PNREANR5L17B2348). Fourni les dates importantes si disponible. Résume en 2 lignes de façon ultra-lisible avec ce format textuel exact:  
**Parcours du texte:** Synthèse des étapes franchies, dans l'ordre réel (pas l'ordre JSON si illogique), avec dates clés et impacts concrets courts. 
**Prochaine étape:** Étape suivante probable avant adoption/promulgation.  
Reste neutre, factuel ; restructure légèrement pour clarté sans inventer ; max 100 mots total.
`; // Prompt système renforcé pour factualité et brièveté.

export const USER_PROMPT_TEMPLATE_RESUME_CHRONO = `
Voici la chronologie JSON de la loi "{titre_texte}" : {chronologie_complete}.
`; // Template user simplifié, avec focus sur le JSON brut pour analyse précise.


export const PARAMS_RESUME_CHRONO = {
  maxTokens: 200, // Légèrement plus que résumé loi pour couvrir les étapes ; ajuste pour coût/perf.
  temperature: 0.5, // Plus factuel que créatif pour les processus institutionnels (0=strict, 1=créatif).
};

// Modèle IA par défaut pour les chronos (change ici pour tester d'autres versions Grok sans toucher l'API).
export const MODEL_RESUME_CHRONO = 'grok-4-1-fast-non-reasoning'; // Même que résumé loi pour cohérence ; 'fast' pour UX rapide.

export const MAX_INPUT_CHARS_RESUME_CHRONO = 12000; // Plus large pour chronos JSON longues ; ≈ 3000 tokens.