// src/app/dossiers-legislatifs/[uid]/resume-ia/page.tsx
// Server Component : fetch initial des données, puis passe au client pour l'interactivité IA

import { supabase } from '@/lib/supabase';
import { MODEL_RESUME_LOI, PROMPT_VERSION_RESUME_LOI } from '@/lib/prompts';
import { STEP_CONFIG, MILESTONE_CODES, KPI_ACTE_CODES } from '@/lib/legislative-steps';
import ResumeIAClient from './ResumeIAClient';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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

  const allActeCodes = [...MILESTONE_CODES, ...KPI_ACTE_CODES];

  // Fetch textes, dossier complet et actes législatifs en parallèle
  const [textesResult, dossierResult, actesResult] = await Promise.all([
    supabase
      .from('textes')
      .select('uid, date_creation, date_publication, denomination, titre_principal_court, lien_texte, libelle_statut_adoption, provenance, url_accessible, contenu_legifrance, organe_auteur:organe_auteur_ref(libelle), resume_ia, resume_ia_prompt_version')
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
      .select('code_acte, date_acte, parent_uid, vote_refs, textes_associes')
      .eq('dossier_uid', uid)
      .or(`code_acte.in.(${allActeCodes.join(',')}),vote_refs.not.is.null`),
  ]);

  // Erreur Supabase sur la requête principale
  if (dossierResult.error) throw new Error('db_unavailable');

  // Dossier introuvable (UID inexistant)
  if (!dossierResult.data || dossierResult.data.length === 0) {
    notFound();
  }

  // Normalise organe_auteur : Supabase renvoie un array pour les joins, on prend le premier élément
  const textes = (textesResult.data || []).map((t: any) => ({
    ...t,
    organe_auteur: Array.isArray(t.organe_auteur) ? t.organe_auteur[0] || null : t.organe_auteur,
  })).sort((a: any, b: any) => {
    const dateA = a.date_creation || a.date_publication || '';
    const dateB = b.date_creation || b.date_publication || '';
    if (!dateA && dateB) return 1;
    if (dateA && !dateB) return -1;
    return dateA.localeCompare(dateB);
  });

  const dossier = dossierResult.data?.[0];
  const titreDossier = dossier?.titre || 'Titre indisponible';

  // Cache : map uid → resume markdown pour les textes dont le prompt est à jour
  const cachedResumes: Record<string, string> = {};
  for (const t of textes) {
    if (t.resume_ia && t.resume_ia_prompt_version === PROMPT_VERSION_RESUME_LOI) {
      cachedResumes[t.uid] = t.resume_ia;
    }
  }

  // Single-pass sur les actes : milestones, codes, dates, votes
  const milestoneDateMap = new Map<string, Date>();
  const actesCodes = new Set<string>();
  const allActesCodes = new Set<string>();
  const actesAvecVote: { vote_refs: string[]; textes_associes: string[] }[] = [];
  let decappLastDate: Date | null = null;
  const depotDate = dossier?.date_depot ? new Date(dossier.date_depot) : null;

  for (const acte of actesResult.data ?? []) {
    const code: string = acte.code_acte;
    allActesCodes.add(code);

    // Collecter les actes avec votes
    if (acte.vote_refs?.length > 0) {
      actesAvecVote.push({ vote_refs: acte.vote_refs, textes_associes: acte.textes_associes ?? [] });
    }

    // Milestone parent codes (actes racines uniquement)
    if (acte.parent_uid === null && MILESTONE_CODES.includes(code)) {
      actesCodes.add(code);
    }

    // Date mapping : ignorer les dates antérieures au dépôt (données erronées)
    if (!acte.date_acte) continue;
    const d = new Date(acte.date_acte);
    if (!depotDate || d >= depotDate) {
      if (code === 'DECAPP-PUB') {
        if (!decappLastDate || d > decappLastDate) decappLastDate = d;
      }
      for (const milestone of MILESTONE_CODES) {
        if (code.startsWith(milestone + '-')) {
          const existing = milestoneDateMap.get(milestone);
          if (!existing || d < existing) milestoneDateMap.set(milestone, d);
          break;
        }
      }
    }
  }

  const toDays = (from: Date | null, to: Date | null) =>
    from && to && to >= from ? Math.round((to.getTime() - from.getTime()) / 86400000) : null;
  const today = new Date();
  const dateDepotDate = dossier?.date_depot ? new Date(dossier.date_depot) : null;
  const datePromDate = dossier?.date_promulgation ? new Date(dossier.date_promulgation) : null;
  const dureeTotal = toDays(dateDepotDate, datePromDate ?? today);

  const isProm = actesCodes.has('PROM');
  const isRejected = dossier?.statut_final === 'Rejeté';
  const isAppDirecte = allActesCodes.has('AN-APPLI-DIRECTE');
  const isAppAppliquee = allActesCodes.has('AN-APPLI-COMPLETE');
  const dureeApplication = isAppAppliquee && !isAppDirecte && dateDepotDate && decappLastDate
    ? toDays(dateDepotDate, decappLastDate)
    : null;

  const isLectureUnique = actesCodes.has('ANLUNI');
  const hasANSteps = [...actesCodes].some(c => c.startsWith('AN') && MILESTONE_CODES.includes(c));
  const hasSNSteps = [...actesCodes].some(c => c.startsWith('SN') && MILESTONE_CODES.includes(c));
  const bothChambersPresent = (hasANSteps || isLectureUnique) && (hasSNSteps || isLectureUnique);
  const proc = (dossier?.procedure_libelle ?? '').toLowerCase();
  const canBePromulgated = proc.includes('loi') || proc.includes('ratification');

  const timelineSteps = MILESTONE_CODES
    .filter(code => {
      if (code === 'PROM') return isProm || (!isRejected && canBePromulgated && bothChambersPresent);
      if (code === 'DECAPP') return isProm && !isAppDirecte;
      if (code === 'AN-APPLI') return isProm && !isAppDirecte;
      if (code === 'SN1' && !actesCodes.has('SN1')) return !isRejected && hasANSteps && !hasSNSteps && !isLectureUnique;
      if (code === 'AN1' && !actesCodes.has('AN1')) return !isRejected && hasSNSteps && !hasANSteps;
      return actesCodes.has(code);
    })
    .sort((a, b) => {
      const da = milestoneDateMap.get(a)?.getTime() ?? (1e15 + STEP_CONFIG[a].priority);
      const db = milestoneDateMap.get(b)?.getTime() ?? (1e15 + STEP_CONFIG[b].priority);
      return da - db;
    })
    .map(code => {
      let detail: string | null = null;
      if (code === 'DECAPP' && milestoneDateMap.has('DECAPP')) {
        const firstDecapp = milestoneDateMap.get('DECAPP')!;
        if (isAppAppliquee && decappLastDate && decappLastDate > firstDecapp) {
          const days = Math.round((decappLastDate.getTime() - firstDecapp.getTime()) / 86400000);
          detail = days > 60 ? `tous publiés en ${Math.round(days / 30)} mois` : `tous publiés en ${days} j`;
        } else if (!isAppAppliquee) {
          const days = Math.round((today.getTime() - firstDecapp.getTime()) / 86400000);
          detail = days > 60 ? `en cours depuis ${Math.round(days / 30)} mois` : `en cours depuis ${days} j`;
        }
      }
      return {
        code,
        label: code === 'PROM' && isAppDirecte ? 'Promulguée (application directe)' : STEP_CONFIG[code].label,
        date: milestoneDateMap.get(code)?.toISOString().slice(0, 10) ?? null,
        done: (code === 'AN-APPLI' && (isAppDirecte || isAppAppliquee)) ? true : actesCodes.has(code),
        detail,
      };
    });
  timelineSteps.unshift({ code: 'DEPOT', label: 'Dépôt', date: dossier?.date_depot?.slice(0, 10) ?? null, done: true, detail: null });

  // Scrutins : extraire vote_refs depuis les actes déjà chargés (pas de requête supplémentaire)
  const voteRefsSet = new Set(actesAvecVote.flatMap(a => a.vote_refs));
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

    for (const acte of actesAvecVote) {
      const firstVoteRef = acte.vote_refs[0];
      const firstTexteAssocie = acte.textes_associes[0];
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
      dureeApplication={dureeApplication}
      isAppDirecte={isAppDirecte}
      auteurNom={auteur ? `${auteur.prenom ?? ''} ${auteur.nom ?? ''}`.trim() : null}
      auteurGroupe={auteur?.groupe?.libelle ?? null}
      timelineSteps={timelineSteps}
      scrutinsParTexte={scrutinsParTexte}
      initialTexteUid={initialTexteUid}
      cachedResumes={cachedResumes}
    />
  );
}
