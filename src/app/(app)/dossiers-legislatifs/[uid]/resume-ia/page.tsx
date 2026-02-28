// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Server Component : fetch initial des données, puis passe au client pour l'interactivité IA

import { supabase } from '@/lib/supabase';
import { MODEL_RESUME_LOI } from '@/lib/prompts';
import { STEP_CONFIG, MILESTONE_CODES } from '@/lib/legislative-steps';
import ResumeIAClient from './ResumeIAClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  other: {
    // Marquage machine-readable (Article 50 AI Act)
    'ai-generated': 'true',
    'ai-model': MODEL_RESUME_LOI,
    'ai-provider': 'xAI (Grok)',
  },
};

export default async function ResumeIAPage({ params, searchParams }: { params: Promise<{ uid: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { uid } = await params;
  const resolvedSearchParams = await searchParams;
  const initialTexteUid = typeof resolvedSearchParams.texte === 'string' ? resolvedSearchParams.texte : null;

  // Fetch textes, dossier complet, et actes législatifs en parallèle
  const [textesResult, dossierResult, actesResult] = await Promise.all([
    supabase
      .from('textes')
      .select('uid, date_creation, date_publication, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, provenance, organe_auteur:organe_auteur_ref(libelle)')
      .eq('dossier_ref', uid)
      .not('uid', 'ilike', '%TAP%')
      .order('date_creation', { ascending: true }),
    supabase
      .from('dossiers_legislatifs')
      .select('titre, statut_final, procedure_libelle, date_depot, date_promulgation, initiateur_acteur_ref(uid, nom, prenom, groupe:organes(uid, libelle))')
      .eq('uid', uid)
      .limit(1),
    supabase
      .from('actes_legislatifs')
      .select('code_acte')
      .eq('dossier_uid', uid)
      .is('parent_uid', null)
      .in('code_acte', MILESTONE_CODES),
  ]);

  // Normalise organe_auteur : Supabase renvoie un array pour les joins, on prend le premier élément
  const textes = (textesResult.data || []).map((t: any) => ({
    ...t,
    organe_auteur: Array.isArray(t.organe_auteur) ? t.organe_auteur[0] || null : t.organe_auteur,
  }));

  const dossier = dossierResult.data?.[0];
  const titreDossier = dossier?.titre || 'Titre indisponible';

  // Timeline : codes des actes présents, triés par priorité
  const actesCodes = new Set((actesResult.data ?? []).map((a: any) => a.code_acte));
  const timelineSteps = MILESTONE_CODES
    .filter(code => actesCodes.has(code))
    .sort((a, b) => STEP_CONFIG[a].priority - STEP_CONFIG[b].priority)
    .map(code => STEP_CONFIG[code].label);

  // Scrutins associés aux textes via actes_legislatifs
  // Un acte peut avoir textes_associes (→ texte uid) ET vote_refs (→ scrutin uid)
  const { data: actesAvecVote } = await supabase
    .from('actes_legislatifs')
    .select('textes_associes, vote_refs')
    .eq('dossier_uid', uid)
    .not('vote_refs', 'is', null);

  const voteRefsSet = new Set((actesAvecVote ?? []).flatMap(a => a.vote_refs ?? []));
  const voteRefs = [...voteRefsSet];

  let scrutinsParTexte: Record<string, {
    sortLibelle: string; type: string; pour: number; contre: number;
    abstentions: number; votants: number; nonVotants: number; suffragesRequis: number; date: string;
  }> = {};

  if (voteRefs.length > 0) {
    const { data: scrutinsData } = await supabase
      .from('scrutins')
      .select('uid, sort_libelle, type_vote_libelle, synthese_pour, synthese_contre, synthese_abstentions, synthese_nombre_votants, synthese_non_votants, synthese_suffrages_requis, date_scrutin')
      .in('uid', voteRefs);

    const scrutinsMap = new Map((scrutinsData ?? []).map(s => [s.uid, s]));

    for (const acte of actesAvecVote ?? []) {
      const firstVoteRef = acte.vote_refs?.[0];
      const firstTexteAssocie = acte.textes_associes?.[0];
      const s = firstVoteRef ? scrutinsMap.get(firstVoteRef) : undefined;
      if (s && firstTexteAssocie) {
        scrutinsParTexte[firstTexteAssocie] = {
          sortLibelle: s.sort_libelle ?? '',
          type: s.type_vote_libelle ?? '',
          pour: s.synthese_pour ?? 0,
          contre: s.synthese_contre ?? 0,
          abstentions: s.synthese_abstentions ?? 0,
          votants: s.synthese_nombre_votants ?? 0,
          nonVotants: s.synthese_non_votants ?? 0,
          suffragesRequis: s.synthese_suffrages_requis ?? 0,
          date: s.date_scrutin ?? '',
        };
      }
    }
  }

  // Auteur : initiateur direct ou fallback via les textes
  // Supabase renvoie les joins comme des arrays, on normalise
  function normalizeActeur(raw: any): { prenom: string | null; nom: string | null; groupe: { uid: string; libelle: string } | null } | null {
    if (!raw) return null;
    const a = Array.isArray(raw) ? raw[0] : raw;
    if (!a) return null;
    return {
      prenom: a.prenom ?? null,
      nom: a.nom ?? null,
      groupe: Array.isArray(a.groupe) ? a.groupe[0] ?? null : a.groupe ?? null,
    };
  }

  let auteur = normalizeActeur(dossier?.initiateur_acteur_ref);

  if (!auteur) {
    // Fallback : chercher l'auteur du premier texte associé
    const { data: textesWithAuthors } = await supabase
      .from('textes')
      .select('auteurs_refs')
      .eq('dossier_ref', uid)
      .not('auteurs_refs', 'is', null)
      .limit(1);

    const firstRef = textesWithAuthors?.[0]?.auteurs_refs?.split(',')?.[0]?.trim();
    if (firstRef) {
      const { data: acteurData } = await supabase
        .from('acteurs')
        .select('uid, nom, prenom, groupe:organes(uid, libelle)')
        .eq('uid', firstRef)
        .limit(1);
      auteur = normalizeActeur(acteurData?.[0]);
    }
  }

  return (
    <ResumeIAClient
      uid={uid}
      titreDossier={titreDossier}
      initialTextes={textes}
      statutFinal={dossier?.statut_final ?? null}
      procedureLibelle={dossier?.procedure_libelle ?? null}
      dateDepot={dossier?.date_depot ?? null}
      datePromulgation={dossier?.date_promulgation ?? null}
      auteurNom={auteur ? `${auteur.prenom ?? ''} ${auteur.nom ?? ''}`.trim() : null}
      auteurGroupe={auteur?.groupe?.libelle ?? null}
      timelineSteps={timelineSteps}
      scrutinsParTexte={scrutinsParTexte}
      initialTexteUid={initialTexteUid}
    />
  );
}
