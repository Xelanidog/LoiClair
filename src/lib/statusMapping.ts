// src/lib/statusMapping.ts

export interface StatusInfo {
  label: string;
  stepNumber?: number;         // Optionnel : seulement quand on est sûr
  totalSteps?: number;         // Optionnel : jamais utilisé seul
  explanation: string;
  color: string;
}

export const statusMapping: Record<string, StatusInfo> = {
  // Dépôt initial
  'Texte Déposé': {
    label: 'Déposé',
    explanation: 'Le texte vient d’être déposé par le Gouvernement ou un parlementaire. Il est en attente d’examen en commission.',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  },
  'INITDEP': {
    label: 'Déposé',
    explanation: 'Le texte vient d’être déposé par le Gouvernement ou un parlementaire. Il est en attente d’examen en commission.',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  },

  // Après commission
  'ADOPTCOM': {
    label: 'Adopté en commission',
    stepNumber: 2,  // On est sûr : 1 = dépôt, 2 = commission
    explanation: 'La commission permanente saisie a adopté le texte (souvent modifié). Prochaine étape : discussion en séance publique.',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },

  // Après séance plénière
  'ADOPTSEANCE': {
    label: 'Adopté en séance',
    stepNumber: 3,
    explanation: 'Le texte a été adopté en séance publique par l’Assemblée (ou le Sénat). Il est transmis à l’autre assemblée pour la suite de la navette.',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },

  // Navette / lectures suivantes
  'Navette': {
    label: 'En navette',
    explanation: 'Le texte fait l’objet d’une navette entre l’Assemblée nationale et le Sénat (2e lecture, 3e lecture, etc.). Les deux chambres ne sont pas encore d’accord.',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },

  // CMP
  'CMP': {
    label: 'En Commission mixte paritaire',
    explanation: 'Une CMP (7 députés + 7 sénateurs) tente de trouver un texte de compromis acceptable par les deux assemblées.',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },

  // Promulgation
  'Promulguée': {
    label: 'Promulguée',
    stepNumber: 10,  // On est sûr : c'est la fin
    explanation: 'Le texte a été promulgué par le Président de la République et est devenu loi (publié au Journal Officiel).',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 font-semibold'
  },
  'PROMULG': {
    label: 'Promulguée',
    stepNumber: 10,
    explanation: 'Le texte a été promulgué par le Président de la République et est devenu loi (publié au Journal Officiel).',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 font-semibold'
  },

  // Rejet / échec
  'Rejeté': {
    label: 'Rejeté',
    explanation: 'Le texte a été rejeté par l’une des assemblées (ou procédure abandonnée). Il n’aboutira pas sous cette forme.',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  },

  // Par défaut : tout ce qui est intermédiaire ou inconnu
  'default': {
    label: 'En cours',
    explanation: 'Le texte est en cours d’examen. L’étape exacte n’est pas clairement identifiée dans les données disponibles.',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  }
};