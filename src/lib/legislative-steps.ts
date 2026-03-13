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
  'DECAPP':    { label: 'Décrets d\'application', priority: 100 },
  'AN-APPLI':  { label: 'Application',          priority: 110 },
};

export const MILESTONE_CODES = Object.keys(STEP_CONFIG);

// Codes d'actes détaillés utilisés pour les KPIs et le mapping timeline
export const KPI_ACTE_CODES = [
  'AN1-DEPOT', 'AN2-DEPOT', 'ANLDEF-DEPOT', 'ANLUNI-DEPOT', 'ANNLEC-DEPOT',
  'AN1-DEBATS-DEC', 'AN2-DEBATS-DEC', 'ANLDEF-DEBATS-DEC', 'ANLUNI-DEBATS-DEC', 'ANNLEC-DEBATS-DEC',
  'CMP-DEBATS-AN-DEC', 'CMP-SAISIE', 'CMP-DEC',
  'SN1-DEPOT', 'SN2-DEPOT', 'SNNLEC-DEPOT',
  'PROM-PUB',
  'SN1-DEBATS-DEC', 'SN2-DEBATS-DEC', 'SNNLEC-DEBATS-DEC',
  'CMP-DEBATS-SN-DEC',
  'CC-SAISIE-PM', 'CC-SAISIE-AN', 'CC-SAISIE-SN', 'CC-SAISIE-DROIT', 'CC-CONCLUSION',
  'DECAPP-PUB', 'AN-APPLI-RAPPORT', 'AN-APPLI-DIRECTE', 'AN-APPLI-COMPLETE',
];
