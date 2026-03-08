// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Server Component : fetch initial des données, puis passe au client pour l'interactivité IA

import { supabase } from '@/lib/supabase';
import { MODEL_RESUME_LOI, PROMPT_VERSION_RESUME_LOI } from '@/lib/prompts';
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

  const KPI_ACTE_CODES = [
    'AN1-DEPOT', 'AN2-DEPOT', 'ANLDEF-DEPOT', 'ANLUNI-DEPOT', 'ANNLEC-DEPOT',
    'AN1-DEBATS-DEC', 'AN2-DEBATS-DEC', 'ANLDEF-DEBATS-DEC', 'ANLUNI-DEBATS-DEC', 'ANNLEC-DEBATS-DEC',
    'CMP-DEBATS-AN-DEC',
    'SN1-DEPOT', 'SN2-DEPOT', 'SNNLEC-DEPOT',
    'PROM-PUB',
    'SN1-DEBATS-DEC', 'SN2-DEBATS-DEC', 'SNNLEC-DEBATS-DEC',
    'CMP-DEBATS-SN-DEC',
  ];

  // Fetch textes, dossier complet, actes législatifs et actes KPI en parallèle
  const [textesResult, dossierResult, actesResult, actesKPIResult] = await Promise.all([
    supabase
      .from('textes')
      .select('uid, date_creation, date_publication, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, provenance, url_accessible, organe_auteur:organe_auteur_ref(libelle), resume_ia, resume_ia_prompt_version')
      .eq('dossier_ref', uid)
      .not('uid', 'ilike', '%TAP%')
      .order('date_creation', { ascending: true }),
    supabase
      .from('dossiers_legislatifs')
      .select('titre, statut_final, procedure_libelle, date_depot, date_promulgation, lien_an, lien_senat, url_legifrance, initiateur_acteur_ref(uid, nom, prenom, groupe:organes(uid, libelle))')
      .eq('uid', uid)
      .limit(1),
    supabase
      .from('actes_legislatifs')
      .select('code_acte')
      .eq('dossier_uid', uid)
      .is('parent_uid', null)
      .in('code_acte', MILESTONE_CODES),
    supabase
      .from('actes_legislatifs')
      .select('code_acte, date_acte')
      .eq('dossier_uid', uid)
      .in('code_acte', KPI_ACTE_CODES)
      .not('date_acte', 'is', null),
  ]);

  // Normalise organe_auteur : Supabase renvoie un array pour les joins, on prend le premier élément
  const textes = (textesResult.data || []).map((t: any) => ({
    ...t,
    organe_auteur: Array.isArray(t.organe_auteur) ? t.organe_auteur[0] || null : t.organe_auteur,
  }));

  const dossier = dossierResult.data?.[0];
  const titreDossier = dossier?.titre || 'Titre indisponible';

  // Cache : map uid → resume markdown pour les textes dont le prompt est à jour
  const cachedResumes: Record<string, string> = {};
  for (const t of textes) {
    if (t.resume_ia && t.resume_ia_prompt_version === PROMPT_VERSION_RESUME_LOI) {
      cachedResumes[t.uid] = t.resume_ia;
    }
  }

  // Calcul des durées par chambre (aligné sur la logique de la page KPI)
  let depotAN: Date | null = null, decisionAN: Date | null = null;
  let depotSN: Date | null = null, decisionSN: Date | null = null;
  const milestoneDateMap = new Map<string, Date>();
  for (const acte of actesKPIResult.data ?? []) {
    const d = new Date(acte.date_acte);
    const code: string = acte.code_acte;
    if (code.startsWith('AN') && code.endsWith('-DEPOT')) {
      if (!depotAN || d < depotAN) depotAN = d;
    }
    if ((code.startsWith('AN') && code.endsWith('-DEBATS-DEC')) || code === 'CMP-DEBATS-AN-DEC') {
      if (!decisionAN || d > decisionAN) decisionAN = d;
    }
    if (code.startsWith('SN') && code.endsWith('-DEPOT')) {
      if (!depotSN || d < depotSN) depotSN = d;
    }
    if ((code.startsWith('SN') && code.endsWith('-DEBATS-DEC')) || code === 'CMP-DEBATS-SN-DEC') {
      if (!decisionSN || d > decisionSN) decisionSN = d;
    }
    // Map milestone code → earliest date (pour tri chronologique)
    for (const milestone of MILESTONE_CODES) {
      if (code.startsWith(milestone + '-')) {
        const existing = milestoneDateMap.get(milestone);
        if (!existing || d < existing) milestoneDateMap.set(milestone, d);
        break;
      }
    }
  }
  const toDays = (from: Date | null, to: Date | null) =>
    from && to && to >= from ? Math.round((to.getTime() - from.getTime()) / 86400000) : null;
  const today = new Date();
  const dateDepotDate = dossier?.date_depot ? new Date(dossier.date_depot) : null;
  const datePromDate = dossier?.date_promulgation ? new Date(dossier.date_promulgation) : null;
  const dureeTotal = toDays(dateDepotDate, datePromDate ?? today);
  const dureeAN = toDays(depotAN, decisionAN ?? (depotAN ? today : null));
  const dureeANEnCours = depotAN !== null && decisionAN === null;
  const dureeSenat = toDays(depotSN, decisionSN ?? (depotSN ? today : null));
  const dureeSNEnCours = depotSN !== null && decisionSN === null;

  // Timeline : codes des actes présents, triés par date réelle (fallback : priority)
  const actesCodes = new Set((actesResult.data ?? []).map((a: any) => a.code_acte));
  const timelineSteps = MILESTONE_CODES
    .filter(code => actesCodes.has(code))
    .sort((a, b) => {
      const da = milestoneDateMap.get(a)?.getTime() ?? (1e15 + STEP_CONFIG[a].priority);
      const db = milestoneDateMap.get(b)?.getTime() ?? (1e15 + STEP_CONFIG[b].priority);
      return da - db;
    })
    .map(code => STEP_CONFIG[code].label);
  const passageCMP = actesCodes.has('CMP');

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

    const auteursRefs = textesWithAuthors?.[0]?.auteurs_refs;
    const firstRef = Array.isArray(auteursRefs) ? auteursRefs[0] : auteursRefs?.split(',')?.[0]?.trim();
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
      lienAN={dossier?.lien_an ?? null}
      lienSenat={dossier?.lien_senat ?? null}
      lienLegifrance={dossier?.url_legifrance ?? null}
      dureeTotal={dureeTotal}
      dureeAN={dureeAN}
      dureeANEnCours={dureeANEnCours}
      dureeSenat={dureeSenat}
      dureeSNEnCours={dureeSNEnCours}
      passageCMP={passageCMP}
      nbVotes={voteRefs.length}
      auteurNom={auteur ? `${auteur.prenom ?? ''} ${auteur.nom ?? ''}`.trim() : null}
      auteurGroupe={auteur?.groupe?.libelle ?? null}
      timelineSteps={timelineSteps}
      scrutinsParTexte={scrutinsParTexte}
      initialTexteUid={initialTexteUid}
      cachedResumes={cachedResumes}
    />
  );
}
