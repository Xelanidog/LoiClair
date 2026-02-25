// Ordre canonique des étapes clés du parcours législatif
// Partagé entre la liste des dossiers et la page résumé IA

export const STEP_CONFIG: Record<string, { label: string; priority: number }> = {
  'AN1':    { label: 'Ass. nat.',      priority: 10 },
  'SN1':    { label: 'Sénat',          priority: 20 },
  'ANLUNI': { label: 'AN (unique)',    priority: 10 },
  'CMP':    { label: 'CMP',            priority: 25 },
  'AN2':    { label: 'AN (2ᵉ)',       priority: 30 },
  'SN2':    { label: 'Sénat (2ᵉ)',    priority: 40 },
  'ANNLEC': { label: 'AN (nouv.)',     priority: 50 },
  'SNNLEC': { label: 'Sénat (nouv.)', priority: 60 },
  'ANLDEF': { label: 'AN (déf.)',      priority: 70 },
  'CC':     { label: 'Cons. const.',  priority: 80 },
  'PROM':   { label: 'Promulguée',    priority: 90 },
};

export const MILESTONE_CODES = Object.keys(STEP_CONFIG);
