# import_scrutins_cloud.py
# Script pour importer les scrutins (votes) de l'AN 17e législature dans Supabase
# et calculer des statistiques de vote par député (acteurs) et par groupe (organes).
#
# Source : https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip
# Exécuter avec : python import_scrutins_cloud.py

import json
import os
import traceback
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import io
import zipfile
from tqdm import tqdm

# --- Connexion Supabase ---
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)


# ===================================================================
# Utilitaires généraux
# ===================================================================

def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge un ZIP en mémoire depuis l'URL et renvoie l'objet ZipFile."""
    print(f"Téléchargement de {url} ...")
    response = requests.get(url, timeout=180)
    response.raise_for_status()
    print("Téléchargement terminé.")
    return zipfile.ZipFile(io.BytesIO(response.content))


def upsert_batch(table: str, rows: list, conflict: str, batch_size: int = 500):
    """Upsert une liste de dicts dans une table Supabase par batch de `batch_size`, avec retry sur timeout."""
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        _upsert_single_batch(table, batch, conflict)


def _upsert_single_batch(table: str, batch: list, conflict: str) -> None:
    """Upsert un seul batch avec retry automatique en cas de timeout."""
    try:
        supabase.table(table).upsert(batch, on_conflict=conflict).execute()
    except Exception as e:
        error_msg = str(e)
        if "timeout" in error_msg.lower() or "time-out" in error_msg.lower() or "57014" in error_msg or '"code": 504' in error_msg or "'code': 504" in error_msg:
            if len(batch) > 50:
                mid = len(batch) // 2
                tqdm.write(f"⏱️  Timeout {table} ({len(batch)} rows) — retry en 2x{mid}")
                _upsert_single_batch(table, batch[:mid], conflict)
                _upsert_single_batch(table, batch[mid:], conflict)
                return
        tqdm.write(f"❌ Erreur upsert {table} ({len(batch)} rows): {type(e).__name__}: {e}")


def fetch_all_rows(table: str, columns: str) -> list:
    """Récupère toutes les lignes d'une table Supabase (pagination 1000 lignes/page)."""
    all_rows = []
    page_size = 1000
    offset = 0
    while True:
        resp = supabase.table(table).select(columns).range(offset, offset + page_size - 1).execute()
        if not resp.data:
            break
        all_rows.extend(resp.data)
        if len(resp.data) < page_size:
            break
        offset += page_size
    return all_rows


def safe_int(value, default=0) -> int:
    """Convertit une valeur en entier. Retourne `default` si impossible."""
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


# ===================================================================
# Extraction des votes nominatifs
# ===================================================================

def extraire_acteur_refs(bucket) -> list:
    """
    Extrait la liste des acteurRef depuis un bucket de vote.
    Un bucket correspond à "pours", "contres", "abstentions" ou "nonVotants".
    Gère tous les formats possibles : null, dict unique, liste de dicts.
    """
    if bucket is None:
        return []
    votants = bucket.get("votant")
    if votants is None:
        return []
    if isinstance(votants, dict):
        ref = votants.get("acteurRef")
        return [ref] if ref else []
    if isinstance(votants, list):
        return [
            v.get("acteurRef")
            for v in votants
            if isinstance(v, dict) and v.get("acteurRef")
        ]
    return []


# ===================================================================
# Parsing d'un scrutin
# ===================================================================

def parser_scrutin(data: dict) -> tuple:
    """
    Parse un dict JSON de scrutin.

    Retourne un tuple de 3 éléments :
    - payload_scrutin (dict)     : données à insérer dans la table `scrutins`
    - votes_par_acteur (dict)    : {acteurRef: {"position": str, "groupe_ref": str}}
    - votes_par_organe (dict)    : {organeRef: {"positionMajoritaire": str, "pour": int, ...}}

    Retourne (None, {}, {}) si le JSON est invalide.
    """
    scrutin = data.get("scrutin", {})
    uid = scrutin.get("uid")
    if not uid:
        return None, {}, {}

    synthese = scrutin.get("syntheseVote") or {}
    decompte = synthese.get("decompte") or {}

    payload_scrutin = {
        "uid": uid,
        "numero": safe_int(scrutin.get("numero")),
        "organe_ref": scrutin.get("organeRef"),
        "legislature": safe_int(scrutin.get("legislature")),
        "session_ref": scrutin.get("sessionRef"),
        "seance_ref": scrutin.get("seanceRef"),
        "date_scrutin": scrutin.get("dateScrutin"),
        "quantieme_jour_seance": safe_int(scrutin.get("quantiemeJourSeance")),
        "type_vote_code": (scrutin.get("typeVote") or {}).get("codeTypeVote"),
        "type_vote_libelle": (scrutin.get("typeVote") or {}).get("libelleTypeVote"),
        "type_majorite": (scrutin.get("typeVote") or {}).get("typeMajorite"),
        "sort_code": (scrutin.get("sort") or {}).get("code"),
        "sort_libelle": (scrutin.get("sort") or {}).get("libelle"),
        "titre": scrutin.get("titre", ""),
        "demandeur_texte": (scrutin.get("demandeur") or {}).get("texte"),
        "objet_libelle": (scrutin.get("objet") or {}).get("libelle"),
        "synthese_nombre_votants": safe_int(synthese.get("nombreVotants")),
        "synthese_suffrages_exprimes": safe_int(synthese.get("suffragesExprimes")),
        "synthese_suffrages_requis": safe_int(synthese.get("nbrSuffragesRequis")),
        "synthese_annonce": synthese.get("annonce"),
        "synthese_pour": safe_int(decompte.get("pour")),
        "synthese_contre": safe_int(decompte.get("contre")),
        "synthese_abstentions": safe_int(decompte.get("abstentions")),
        "synthese_non_votants": safe_int(decompte.get("nonVotants")),
        "lieu_vote": scrutin.get("lieuVote"),
    }

    # --- Ventilation par groupe politique ---
    votes_par_acteur = {}  # {acteurRef: {"position": "pour"|"contre"|"abstention"|"nonVotant", "groupe_ref": str}}
    votes_par_organe = {}  # {organeRef: {"positionMajoritaire": str, "pour": int, "contre": int, ...}}

    ventilation = scrutin.get("ventilationVotes") or {}
    organe_ventilation = ventilation.get("organe") or {}
    groupes_data = organe_ventilation.get("groupes") or {}
    groupes = groupes_data.get("groupe") or []

    # L'API renvoie parfois un dict unique au lieu d'une liste
    if isinstance(groupes, dict):
        groupes = [groupes]

    for groupe in groupes:
        if not isinstance(groupe, dict):
            continue

        organe_ref = groupe.get("organeRef")
        if not organe_ref or organe_ref == "PO0":
            continue

        nombre_membres = safe_int(groupe.get("nombreMembresGroupe"))
        vote = groupe.get("vote") or {}
        position_majoritaire = vote.get("positionMajoritaire")
        decompte_voix = vote.get("decompteVoix") or {}

        votes_par_organe[organe_ref] = {
            "positionMajoritaire": position_majoritaire,
            "pour": safe_int(decompte_voix.get("pour")),
            "contre": safe_int(decompte_voix.get("contre")),
            "abstentions": safe_int(decompte_voix.get("abstentions")),
            "nonVotants": safe_int(decompte_voix.get("nonVotants")),
            "nombreMembres": nombre_membres,
        }

        # Extraction des votes nominatifs (qui a voté quoi)
        nominatif = vote.get("decompteNominatif") or {}
        buckets = [
            ("pour", "pours"),
            ("contre", "contres"),
            ("abstention", "abstentions"),
            ("nonVotant", "nonVotants"),
        ]
        for position, bucket_key in buckets:
            for acteur_ref in extraire_acteur_refs(nominatif.get(bucket_key)):
                votes_par_acteur[acteur_ref] = {
                    "position": position,
                    "groupe_ref": organe_ref,
                }

    return payload_scrutin, votes_par_acteur, votes_par_organe


# ===================================================================
# Correspondances de groupes renommés
# ===================================================================
# Certains groupes politiques ont été renommés en cours de législature.
# Les scrutins anciens référencent l'UID de l'ancien groupe, les nouveaux
# l'UID du nouveau groupe. Cette table d'alias permet de cumuler leurs
# statistiques sous l'UID du groupe actif (le plus récent).
#
# Format : { "uid_ancien": "uid_actif" }
GROUPE_ALIAS: dict[str, str] = {
    "PO847173": "PO872880",  # UDR → UDDPLR (renommé le 5 sept. 2025)
}


# ===================================================================
# Boucle principale
# ===================================================================

def importer_scrutins_from_zip(zip_ref: zipfile.ZipFile):
    """
    Boucle sur tous les JSON de scrutins du ZIP.

    Étapes :
    1. Parcourt chaque scrutin et accumule les stats en mémoire
    2. Insère les données brutes dans la table `scrutins`
    3. Met à jour les colonnes de stats dans `acteurs` et `organes`
    """

    # --- Pré-chargement depuis Supabase pour éviter N+1 requêtes ---
    print("Chargement des données existantes depuis Supabase...")
    acteurs_rows = fetch_all_rows("acteurs", "uid,groupe,date_debut_mandat,date_fin_mandat,periodes_mandat_assemblee")
    known_acteur_uids = {row["uid"] for row in acteurs_rows}
    acteur_to_groupe = {row["uid"]: row["groupe"] for row in acteurs_rows if row.get("groupe")}
    # Fenêtre de mandat par acteur : (date_debut, date_fin) — date_fin = None si encore en exercice
    acteur_mandate_range = {
        row["uid"]: (row.get("date_debut_mandat"), row.get("date_fin_mandat"))
        for row in acteurs_rows
        if row.get("date_debut_mandat")
    }
    # Périodes multi-mandat (ex-ministres revenus) — liste [{debut, fin}] ou None
    acteur_periods_list = {
        row["uid"]: row.get("periodes_mandat_assemblee")
        for row in acteurs_rows
        if row.get("periodes_mandat_assemblee")
    }

    organes_rows = fetch_all_rows("organes", "uid")
    known_organe_uids = {row["uid"] for row in organes_rows}

    print(f"  → {len(known_acteur_uids)} acteurs, {len(known_organe_uids)} organes chargés.\n")

    # --- Détection des fichiers scrutin dans le ZIP ---
    # Les fichiers de scrutin ont un nom du type VTANR5L17Vxxx.json
    all_files = zip_ref.namelist()
    json_files = [
        f for f in all_files
        if f.endswith(".json") and os.path.basename(f).startswith("VTANR")
    ]
    if not json_files:
        # Fallback : on prend tous les .json
        json_files = [f for f in all_files if f.endswith(".json")]

    print(f"Nombre de scrutins à traiter : {len(json_files)}\n")

    # --- Structures d'accumulation en mémoire ---
    # Par acteur :
    #   votes_total                : nombre de scrutins où l'acteur apparaît (présent ou absent officiel)
    #   votes_pour/contre/abstentions : votes effectifs (acteur = PRÉSENT)
    #   votes_absent               : nonVotant (absent officiel : ministre, délégation…)
    #   taux_presence              : (votes_pour + votes_contre + votes_abstentions) / total_scrutins × 100
    #                                ↳ abstention = PRÉSENT (choix délibéré), nonVotant = ABSENT
    #                                ↳ les absents de l'hémicycle n'apparaissent pas du tout dans le JSON
    #                                ↳ dénominateur = `success` (tous les scrutins parsés)
    #   votes_actifs_solennels     : votes actifs (pour/contre/abstention) sur scrutins MOC ou SPS uniquement
    #   taux_presence_solennels    : votes_actifs_solennels / success_importants × 100
    #                                ↳ dénominateur = `success_importants` (scrutins MOC + SPS uniquement)
    #   cohesion_eligible          : scrutins où l'acteur était présent et son groupe a une position connue
    #   cohesion_accord            : parmi les éligibles, ceux où il a voté comme la position majoritaire du groupe
    stats_acteurs = {}

    # Par organe (groupe politique) :
    #   scrutins_total                    : nombre de scrutins où le groupe a participé
    #   membres_presents_cumul            : somme des membres présents sur tous scrutins
    #   membres_totaux_cumul              : somme du nombre de membres déclarés par scrutin
    #   membres_presents_solennels_cumul  : idem, restreint aux scrutins MOC + SPS
    #   membres_totaux_solennels_cumul    : idem, restreint aux scrutins MOC + SPS
    #   cohesion_votes_cumul              : somme des membres ayant voté comme la position majoritaire
    #   cohesion_eligible_cumul           : somme des membres présents (éligibles à la cohésion)
    stats_organes = {}

    BATCH_SIZE = 500
    pending_scrutins = []  # buffer pour le streaming d'upserts
    success = 0            # total de scrutins parsés avec succès
    success_importants = 0 # parmi eux : scrutins MOC (motion de censure) ou SPS (solennel)
    failed = 0
    # Collecte des dates de scrutins pour calculer les dénominateurs personnels par mandat
    # Chaque entrée : (date_scrutin: str | None, is_important: bool)
    scrutin_dates: list[tuple[str | None, bool]] = []

    # --- Boucle de parsing ---
    for file_path in tqdm(json_files, desc="Parsing scrutins", unit="scrutin"):
        try:
            with zip_ref.open(file_path) as f:
                data = json.load(f)

            payload_scrutin, votes_par_acteur, votes_par_organe = parser_scrutin(data)

            if payload_scrutin is None:
                failed += 1
                continue

            pending_scrutins.append(payload_scrutin)
            success += 1

            # Flush par batch pendant le parsing pour éviter l'accumulation mémoire
            if len(pending_scrutins) >= BATCH_SIZE:
                upsert_batch("scrutins", pending_scrutins, "uid", BATCH_SIZE)
                pending_scrutins = []

            # Détection scrutin "important" (Motion de Censure ou Scrutin Public Solennel)
            is_scrutin_important = payload_scrutin.get("type_vote_code") in ("MOC", "SPS")
            if is_scrutin_important:
                success_importants += 1

            # Enregistrer la date pour calculer les dénominateurs personnels par mandat
            scrutin_dates.append((payload_scrutin.get("date_scrutin"), is_scrutin_important))

            # Accumulation stats organes
            for organe_ref, stats in votes_par_organe.items():
                # Redirection : si ce groupe a été renommé, on cumule sous le nouveau nom
                organe_ref = GROUPE_ALIAS.get(organe_ref, organe_ref)
                if organe_ref not in stats_organes:
                    stats_organes[organe_ref] = {
                        "scrutins_total": 0,
                        "membres_presents_cumul": 0,
                        "membres_totaux_cumul": 0,
                        "membres_presents_solennels_cumul": 0,
                        "membres_totaux_solennels_cumul": 0,
                        "cohesion_votes_cumul": 0,
                        "cohesion_eligible_cumul": 0,
                    }
                s = stats_organes[organe_ref]
                s["scrutins_total"] += 1
                s["membres_totaux_cumul"] += stats["nombreMembres"]

                # Membres présents = ceux qui ont voté (pour + contre + abstentions)
                membres_presents = stats["pour"] + stats["contre"] + stats["abstentions"]
                s["membres_presents_cumul"] += membres_presents

                # Présence sur scrutins importants (MOC + SPS) uniquement
                if is_scrutin_important:
                    s["membres_presents_solennels_cumul"] += membres_presents
                    s["membres_totaux_solennels_cumul"] += stats["nombreMembres"]

                # Cohésion interne : % de membres qui votent comme la position majoritaire du groupe
                pm = stats["positionMajoritaire"]
                if pm and membres_presents > 0:
                    if pm == "pour":
                        votes_en_accord = stats["pour"]
                    elif pm == "contre":
                        votes_en_accord = stats["contre"]
                    elif pm == "abstention":
                        votes_en_accord = stats["abstentions"]
                    else:
                        votes_en_accord = 0
                    s["cohesion_votes_cumul"] += votes_en_accord
                    s["cohesion_eligible_cumul"] += membres_presents

            # Accumulation stats acteurs
            for acteur_ref, vote_info in votes_par_acteur.items():
                if acteur_ref not in stats_acteurs:
                    stats_acteurs[acteur_ref] = {
                        "votes_total": 0,
                        "votes_pour": 0,
                        "votes_contre": 0,
                        "votes_abstentions": 0,
                        "votes_absent": 0,
                        "votes_actifs_solennels": 0,
                        "cohesion_eligible": 0,
                        "cohesion_accord": 0,
                        "vote_dates": [],  # [(date, position, is_important)] — pour filtrage par mandat
                    }
                s = stats_acteurs[acteur_ref]
                position = vote_info["position"]
                groupe_ref_scrutin = vote_info["groupe_ref"]

                s["votes_total"] += 1
                if position == "pour":
                    s["votes_pour"] += 1
                elif position == "contre":
                    s["votes_contre"] += 1
                elif position == "abstention":
                    s["votes_abstentions"] += 1
                elif position == "nonVotant":
                    s["votes_absent"] += 1

                # Présence sur scrutins importants (MOC + SPS) : acteur présent et vote actif
                if is_scrutin_important and position != "nonVotant":
                    s["votes_actifs_solennels"] += 1

                # Enregistrer la date de vote pour filtrage par mandat (numérateur cohérent)
                if position != "nonVotant":
                    s["vote_dates"].append((payload_scrutin.get("date_scrutin"), position, is_scrutin_important))

                # Cohésion : compare la position de l'acteur avec la position majoritaire de son groupe
                # On n'inclut pas les absents dans le calcul de cohésion
                if position != "nonVotant" and groupe_ref_scrutin in votes_par_organe:
                    pm = votes_par_organe[groupe_ref_scrutin]["positionMajoritaire"]
                    if pm:
                        s["cohesion_eligible"] += 1
                        if position == pm:
                            s["cohesion_accord"] += 1

        except Exception as e:
            tqdm.write(f"❌ Erreur sur {file_path}: {type(e).__name__}: {e}")
            traceback.print_exc()
            failed += 1

    # ===================================================================
    # Upsert des scrutins bruts (flush du buffer restant)
    # ===================================================================
    if pending_scrutins:
        print(f"\nInsertion des {len(pending_scrutins)} derniers scrutins dans Supabase...")
        upsert_batch("scrutins", pending_scrutins, "uid", BATCH_SIZE)
    else:
        print("\nTous les scrutins ont déjà été streamés vers Supabase.")

    # ===================================================================
    # Mise à jour des stats acteurs
    # ===================================================================
    print(f"\nMise à jour des stats pour {len(stats_acteurs)} acteurs...")
    batch_acteurs = []
    skipped_acteurs = 0

    for acteur_ref, s in stats_acteurs.items():
        # On ne met à jour que les acteurs déjà présents dans notre base
        if acteur_ref not in known_acteur_uids:
            skipped_acteurs += 1
            continue

        # Calcul du dénominateur personnalisé selon la fenêtre de mandat
        # → on ne compte que les scrutins qui se sont déroulés pendant le(s) mandat(s) du député
        debut, fin = acteur_mandate_range.get(acteur_ref, (None, None))
        periods = acteur_periods_list.get(acteur_ref)  # [{debut, fin}] ou None (multi-périodes)

        # Fonction de test : la date tombe-t-elle dans un mandat actif ?
        if periods:
            # Multi-période : ex-ministre revenu (ex: Rist) — on additionne ses deux mandats ASSEMBLEE
            in_period = lambda d: d and any(
                d >= p["debut"] and (p["fin"] is None or d <= p["fin"])
                for p in periods
            )
        elif debut:
            # Période unique : fenêtre debut → fin (ou aujourd'hui)
            in_period = lambda d: d and d >= debut and (fin is None or d <= fin)
        else:
            # Pas de date de mandat connue → tout compter
            in_period = lambda d: bool(d)

        # Dénominateur : scrutins pendant le(s) mandat(s)
        scrutins_en_mandat = sum(1 for d, _ in scrutin_dates if in_period(d))
        scrutins_solennels_en_mandat = sum(1 for d, imp in scrutin_dates if in_period(d) and imp)

        # Numérateur : votes pendant le(s) mandat(s) — garantit votes_actifs ≤ scrutins_pendant_mandat
        vd = [(d, p, imp) for d, p, imp in s["vote_dates"] if in_period(d)]
        votes_pour_m = sum(1 for _, p, _ in vd if p == "pour")
        votes_contre_m = sum(1 for _, p, _ in vd if p == "contre")
        votes_abstentions_m = sum(1 for _, p, _ in vd if p == "abstention")
        votes_actifs_solennels_m = sum(1 for _, _, imp in vd if imp)

        votes_actifs = votes_pour_m + votes_contre_m + votes_abstentions_m
        taux_presence = (
            round(votes_actifs / scrutins_en_mandat * 100, 2) if scrutins_en_mandat > 0 else None
        )
        taux_presence_solennels = (
            round(votes_actifs_solennels_m / scrutins_solennels_en_mandat * 100, 2)
            if scrutins_solennels_en_mandat > 0 else None
        )
        ce = s["cohesion_eligible"]
        taux_cohesion = round(s["cohesion_accord"] / ce * 100, 2) if ce > 0 else None

        batch_acteurs.append({
            "uid": acteur_ref,
            "votes_total": s["votes_total"],
            "votes_pour": votes_pour_m,
            "votes_contre": votes_contre_m,
            "votes_abstentions": votes_abstentions_m,
            "votes_absent": s["votes_absent"],
            "votes_actifs_solennels": votes_actifs_solennels_m,
            "scrutins_pendant_mandat": scrutins_en_mandat,
            "scrutins_pendant_mandat_solennels": scrutins_solennels_en_mandat,
            "taux_presence": taux_presence,
            "taux_presence_solennels": taux_presence_solennels,
            "taux_cohesion_groupe": taux_cohesion,
        })

    upsert_batch("acteurs", batch_acteurs, "uid", BATCH_SIZE)
    print(f"  → {len(batch_acteurs)} acteurs mis à jour, {skipped_acteurs} ignorés (non trouvés en base).")

    # ===================================================================
    # Mise à jour des stats organes
    # ===================================================================
    print(f"\nMise à jour des stats pour {len(stats_organes)} organes...")

    # Calcul des moyennes de présence des groupes depuis les taux corrigés par mandat
    # → cohérent avec les taux individuels affichés dans le tableau des députés
    groupe_presence: dict[str, list[float]] = {}
    groupe_presence_sol: dict[str, list[float]] = {}
    for a in batch_acteurs:
        groupe_uid = acteur_to_groupe.get(a["uid"])
        if not groupe_uid:
            continue
        groupe_uid = GROUPE_ALIAS.get(groupe_uid, groupe_uid)
        if a.get("taux_presence") is not None:
            groupe_presence.setdefault(groupe_uid, []).append(a["taux_presence"])
        if a.get("taux_presence_solennels") is not None:
            groupe_presence_sol.setdefault(groupe_uid, []).append(a["taux_presence_solennels"])

    batch_organes = []
    skipped_organes = 0

    for organe_ref, s in stats_organes.items():
        # On ne met à jour que les organes déjà présents dans notre base
        if organe_ref not in known_organe_uids:
            print(f"  ⚠️  Organe ignoré (non trouvé en base) : {organe_ref}")
            skipped_organes += 1
            continue

        # Moyennes de présence : calculées depuis les taux corrigés par mandat
        vals = groupe_presence.get(organe_ref, [])
        taux_presence_moyen = round(sum(vals) / len(vals), 2) if vals else None
        vals_sol = groupe_presence_sol.get(organe_ref, [])
        taux_presence_solennels_moyen = round(sum(vals_sol) / len(vals_sol), 2) if vals_sol else None

        ce = s["cohesion_eligible_cumul"]
        taux_cohesion = round(s["cohesion_votes_cumul"] / ce * 100, 2) if ce > 0 else None

        batch_organes.append({
            "uid": organe_ref,
            "scrutins_total": s["scrutins_total"],
            "taux_presence_moyen": taux_presence_moyen,
            "taux_presence_solennels_moyen": taux_presence_solennels_moyen,
            "taux_cohesion_interne": taux_cohesion,
        })

    upsert_batch("organes", batch_organes, "uid", BATCH_SIZE)
    print(f"  → {len(batch_organes)} organes mis à jour, {skipped_organes} ignorés (non trouvés en base).")

    # ===================================================================
    # Rapport final
    # ===================================================================
    print(f"\n{'='*60}")
    print(f"           IMPORT SCRUTINS TERMINÉ")
    print(f"{'='*60}")
    print(f"   Scrutins importés  : {success}")
    print(f"   dont MOC + SPS     : {success_importants}")
    print(f"   Scrutins en erreur : {failed}")
    print(f"   Total traités      : {success + failed} / {len(json_files)}")
    print(f"   Acteurs mis à jour : {len(batch_acteurs)}")
    print(f"   Organes mis à jour : {len(batch_organes)}")
    print(f"{'='*60}")


# ===================================================================
# Exécution
# ===================================================================

if __name__ == "__main__":
    URL_SCRUTINS = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip"
    zip_ref = download_zip(URL_SCRUTINS)
    importer_scrutins_from_zip(zip_ref)
    print("Import terminé !")
