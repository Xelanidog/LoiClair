// src/lib/statusMapping.ts

export interface StatusInfo {
  label: string;
  stepNumber?: number;
  totalSteps?: number;
  explanation: string;
  color: string;
}

export const statusMapping: Record<string, StatusInfo> = {
  // Depot initial
  'Texte Deposé': {
    label: 'Déposé',
    explanation: "Le texte vient d'être déposé par le Gouvernement ou un parlementaire. Il est en attente d'examen en commission.",
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
  },
  'INITDEP': {
    label: 'Déposé',
    explanation: "Le texte vient d'être déposé par le Gouvernement ou un parlementaire. Il est en attente d'examen en commission.",
    color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
  },

  // Apres commission
  'ADOPTCOM': {
    label: 'Adopté en commission',
    stepNumber: 2,
    explanation: "La commission permanente saisie a adopté le texte (souvent modifié). Prochaine étape : discussion en séance publique.",
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
  },

  // Apres seance pleniere
  'ADOPTSEANCE': {
    label: 'Adopté en séance',
    stepNumber: 3,
    explanation: "Le texte a été adopté en séance publique par l'Assemblée (ou le Sénat). Il est transmis à l'autre assemblée pour la suite de la navette.",
    color: 'bg-[#27AE60]/15 text-[#27AE60] dark:bg-[#27AE60]/20 dark:text-[#2ECC71]'
  },

  // Navette / lectures suivantes
  'Navette': {
    label: 'En navette',
    explanation: "Le texte fait l'objet d'une navette entre l'Assemblée nationale et le Sénat (2e lecture, 3e lecture, etc.). Les deux chambres ne sont pas encore d'accord.",
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200'
  },

  // CMP
  'CMP': {
    label: 'En Commission mixte paritaire',
    explanation: "Une CMP (7 députés + 7 sénateurs) tente de trouver un texte de compromis acceptable par les deux assemblées.",
    color: 'bg-[#F39C12]/15 text-[#F39C12] dark:bg-[#F39C12]/20 dark:text-[#F1C40F]'
  },

  // Promulgation
  'Promulguée': {
    label: 'Promulguée',
    stepNumber: 10,
    explanation: "Le texte a été promulgué par le Président de la République et est devenu loi (publié au Journal Officiel).",
    color: 'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary font-semibold'
  },
  'PROMULG': {
    label: 'Promulguée',
    stepNumber: 10,
    explanation: "Le texte a été promulgué par le Président de la République et est devenu loi (publié au Journal Officiel).",
    color: 'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary font-semibold'
  },

  // Rejet / echec
  'Rejeté': {
    label: 'Rejeté',
    explanation: "Le texte a été rejeté par l'une des assemblées (ou procédure abandonnée). Il n'aboutira pas sous cette forme.",
    color: 'bg-[#E74C3C]/15 text-[#E74C3C] dark:bg-[#E74C3C]/20 dark:text-[#E74C3C]'
  },

  // Par defaut : tout ce qui est intermediaire ou inconnu
  'default': {
    label: 'En cours',
    explanation: "Le texte est en cours d'examen. L'étape exacte n'est pas clairement identifiée dans les données disponibles.",
    color: 'bg-[#F39C12]/15 text-[#F39C12] dark:bg-[#F39C12]/20 dark:text-[#F1C40F]'
  }
};
