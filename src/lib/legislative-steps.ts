// Ordre canonique des étapes clés du parcours législatif
// Partagé entre la liste des dossiers et la page résumé IA

export const STEP_CONFIG: Record<string, { labelKey: string; priority: number }> = {
  'AN1':      { labelKey: 'AN1',      priority: 10 },
  'SN1':      { labelKey: 'SN1',      priority: 20 },
  'ANLUNI':   { labelKey: 'ANLUNI',   priority: 10 },
  'CMP':      { labelKey: 'CMP',      priority: 25 },
  'AN2':      { labelKey: 'AN2',      priority: 30 },
  'SN2':      { labelKey: 'SN2',      priority: 40 },
  'ANNLEC':   { labelKey: 'ANNLEC',   priority: 50 },
  'SNNLEC':   { labelKey: 'SNNLEC',   priority: 60 },
  'ANLDEF':   { labelKey: 'ANLDEF',   priority: 70 },
  'CC':       { labelKey: 'CC',       priority: 80 },
  'PROM':     { labelKey: 'PROM',     priority: 90 },
  'DECAPP':   { labelKey: 'DECAPP',   priority: 100 },
  'AN-APPLI': { labelKey: 'AN-APPLI', priority: 110 },
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
