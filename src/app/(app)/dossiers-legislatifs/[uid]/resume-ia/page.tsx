// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Server Component : fetch initial des données, puis passe au client pour l'interactivité IA

import { supabase } from '@/lib/supabase';
import ResumeIAClient from './ResumeIAClient';

export default async function ResumeIAPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  // Fetch textes ET titre du dossier en parallèle côté serveur
  const [textesResult, dossierResult] = await Promise.all([
    supabase
      .from('textes')
      .select('uid, date_creation, date_publication, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, provenance, organe_auteur:organe_auteur_ref(libelle)')
      .eq('dossier_ref', uid)
      .not('uid', 'ilike', '%TAP%')
      .order('date_creation', { ascending: true }),
    supabase
      .from('dossiers_legislatifs')
      .select('titre')
      .eq('uid', uid)
      .limit(1),
  ]);

  // Normalise organe_auteur : Supabase renvoie un array pour les joins, on prend le premier élément
  const textes = (textesResult.data || []).map((t: any) => ({
    ...t,
    organe_auteur: Array.isArray(t.organe_auteur) ? t.organe_auteur[0] || null : t.organe_auteur,
  }));
  const titreDossier = dossierResult.data?.[0]?.titre || 'Titre indisponible';

  return (
    <ResumeIAClient
      uid={uid}
      titreDossier={titreDossier}
      initialTextes={textes}
    />
  );
}
