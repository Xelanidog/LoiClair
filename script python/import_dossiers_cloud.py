# import_dossiers_cloud.py
# Script pour importer TOUS les JSON dossiers législatifs (AN Jan 2026) dans Supabase table 'dossiers_legislatifs' depuis URL AN
# Exécute avec : python import_dossiers.py


import json
import os
import sys
import traceback
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import io
import zipfile
from tqdm import tqdm
from datetime import datetime

# Ajouter le dossier du script au path pour importer classify_themes (même dossier)
sys.path.insert(0, str(Path(__file__).resolve().parent))
from classify_themes import classify_themes

# Charger .env.local (chemin relatif au script, portable sur toutes les machines)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)


# ===================================================================
# Fonctions utilitaires
# ===================================================================

def parse_date_acte(s: str | None):
    """Parse une date d'acte (YYYY-MM-DD ou ISO) en datetime. Retourne None si invalide."""
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00") if "T" in s else s + "T00:00:00")
    except (ValueError, AttributeError):
        return None


def reconstruire_lien_an(legislature, titre_chemin):
    """Reconstruit le lien Assemblée nationale."""
    if legislature and titre_chemin:
        return f"https://www.assemblee-nationale.fr/dyn/{legislature}/dossiers/{titre_chemin}"
    return None


def extraire_refs_recursif(actes, key, result_set, sub_key=None):
    """Extrait récursivement les références texteAssocie / texteAdopte / voteRefs.
    Amélioration : gère les refs nichées dans 'textesAssocies' (ex. : list de dicts avec 'refTexteAssocie').
    """
    if actes is None:
        return
    if isinstance(actes, list):
        for item in actes:
            extraire_refs_recursif(item, key, result_set, sub_key)
    elif isinstance(actes, dict):
        value = actes.get(key)
        if value:
            if isinstance(value, str):
                result_set.add(value)
            elif isinstance(value, list):
                for v in value:
                    if isinstance(v, str):
                        result_set.add(v)
                    elif isinstance(v, dict) and sub_key and sub_key in v:
                        result_set.add(v[sub_key])
            elif isinstance(value, dict) and sub_key and sub_key in value:
                result_set.add(value[sub_key])

        # Ajout : plonge dans 'textesAssocies' si key est texte-related (avec sub_key adapté pour refs imbriquées)
        if key in ["texteAssocie", "texteAdopte"]:
            textes_associes = actes.get("textesAssocies")
            if textes_associes:
                extraire_refs_recursif(
                    textes_associes, key, result_set, "refTexteAssocie"
                )

        # Récursion sur sous-actes (normalisé comme dans version fonctionnelle)
        sous = actes.get("actesLegislatifs")
        if sous is not None:
            extraire_refs_recursif(sous.get("acteLegislatif"), key, result_set, sub_key)


def extraire_statut_final_et_prom(actes):
    """Extrait statut_final, date_promulgation, code_loi, titre_loi, url_legifrance de façon ultra-robuste."""
    statut_final = "en_cours"
    date_promulgation = None
    code_loi = None
    titre_loi = None
    url_legifrance = None
    if actes is None:
        return statut_final, date_promulgation, code_loi, titre_loi, url_legifrance
    # Normalisation : on veut toujours une liste d'actes
    if isinstance(actes, dict):
        actes = actes.get("acteLegislatif") or []
    if not isinstance(actes, list):
        actes = [actes] if actes else []
    for acte in actes:
        if not isinstance(acte, dict):
            continue
        code_acte = acte.get("codeActe")
        # === Cas PROM (promulgation) ===
        if code_acte == "PROM":
            statut_final = "promulguee"
            sub = acte.get("actesLegislatifs")
            # Gestion ultra-robuste du sous-acte PROM (peut être dict, list, ou dict dans dict)
            prom = {}
            if sub is not None:
                if isinstance(sub, dict):
                    prom = sub.get("acteLegislatif", {})
                elif isinstance(sub, list) and sub:
                    prom = sub[0] if isinstance(sub[0], dict) else {}
            if not isinstance(prom, dict):
                prom = {}
            date_promulgation = prom.get("dateActe")
            code_loi = prom.get("codeLoi")
            titre_loi = prom.get("titreLoi")
            url_legifrance = prom.get("infoJO", {}).get("urlLegifrance")
        # === Cas DEC adoptée ou rejetée ===
        elif code_acte == "DEC":
            conclusion = acte.get("statutConclusion", {})
            libelle = conclusion.get("libelle", "").lower()
            fam_code = conclusion.get("fam_code", "")
            if fam_code in ["TSORTF01", "TSORTF18"] or "adopté" in libelle:
                statut_final = "adoptee"
            elif "rejet" in libelle:
                statut_final = "rejetee"
        # Récursion sur sous-actes (normalisé comme dans version fonctionnelle)
        sous_actes = acte.get("actesLegislatifs")
        if sous_actes is not None:
            sub_statut, sub_date, sub_code, sub_titre, sub_url = (
                extraire_statut_final_et_prom(sous_actes.get("acteLegislatif"))
            )
            if sub_statut != "en_cours":
                statut_final = sub_statut
                date_promulgation = sub_date or date_promulgation
                code_loi = sub_code or code_loi
                titre_loi = sub_titre or titre_loi
                url_legifrance = sub_url or url_legifrance
    return statut_final, date_promulgation, code_loi, titre_loi, url_legifrance

def determiner_statut_final_precis(actes) -> str:
    """
    Version améliorée : prend en compte la DERNIÈRE décision (DEC) en date
    pour chaque assemblée. Gère les rejets suivis d'une nouvelle lecture.
    """
    if not actes:
        return "En cours d'examen"

    # Stocke les décisions par assemblée avec leur date
    decisions_an = []   # liste de (date, est_adopte)
    decisions_sn = []

    def recurse(acte_list):
        if isinstance(acte_list, dict):
            acte_list = [acte_list]
        if not isinstance(acte_list, list):
            return

        for acte in acte_list:
            if not isinstance(acte, dict):
                continue

            code_acte = acte.get("codeActe", "")
            date_acte = acte.get("dateActe")
            conclusion = acte.get("statutConclusion") or {}
            libelle = str(conclusion.get("libelle", "")).lower()

            is_decision = "DEC" in code_acte
            is_adopte = "adopt" in libelle
            is_rejete = "rejet" in libelle

            if is_decision and date_acte and (is_adopte or is_rejete):
                dt = parse_date_acte(date_acte)
                if dt:
                    if "AN" in code_acte:
                        decisions_an.append((dt, is_adopte))
                    elif "SN" in code_acte:
                        decisions_sn.append((dt, is_adopte))

            # Récursion
            sous = acte.get("actesLegislatifs")
            if sous:
                if isinstance(sous, dict) and "acteLegislatif" in sous:
                    recurse(sous["acteLegislatif"])
                elif isinstance(sous, list):
                    recurse(sous)

    recurse(actes)

    # === Prendre la décision la plus récente par assemblée ===
    latest_an_adopte = None
    if decisions_an:
        latest_an = max(decisions_an, key=lambda x: x[0])  # tri par date
        latest_an_adopte = latest_an[1]

    latest_sn_adopte = None
    if decisions_sn:
        latest_sn = max(decisions_sn, key=lambda x: x[0])
        latest_sn_adopte = latest_sn[1]

    # === Application des règles ===
    if latest_an_adopte is True and latest_sn_adopte is True:
        return "Adopté par le Parlement"
    elif latest_an_adopte is True:
        return "Adopté par l'Assemblée nationale"
    elif latest_sn_adopte is True:
        return "Adopté par le Sénat"
    elif latest_an_adopte is False and latest_sn_adopte is False:
        return "Rejeté"
    
    return "En cours d'examen"


def determiner_statut_final_chambre_unique(actes) -> str:
    """
    Pour les procédures à chambre unique (codes 8, 13, 22).
    Seul le dernier vote DEC trouvé est pris en compte (tout se passe à l'AN).
    """
    if not actes:
        return "En cours d'examen"

    decisions = []

    def recurse(acte_list):
        if isinstance(acte_list, dict):
            acte_list = [acte_list]
        if not isinstance(acte_list, list):
            return
        for acte in acte_list:
            if not isinstance(acte, dict):
                continue
            code_acte = acte.get("codeActe", "")
            date_acte = acte.get("dateActe")
            conclusion = acte.get("statutConclusion") or acte.get("decision") or {}
            libelle = str(conclusion.get("libelle", "")).lower()
            is_adopte = "adopt" in libelle
            is_rejete = "rejet" in libelle
            if ("DEC" in code_acte or "VOTE" in code_acte) and date_acte and (is_adopte or is_rejete):
                dt = parse_date_acte(date_acte)
                if dt:
                    decisions.append((dt, is_adopte))
            sous = acte.get("actesLegislatifs")
            if sous:
                if isinstance(sous, dict) and "acteLegislatif" in sous:
                    recurse(sous["acteLegislatif"])
                elif isinstance(sous, list):
                    recurse(sous)

    recurse(actes)

    if not decisions:
        return "En cours d'examen"

    latest = max(decisions, key=lambda x: x[0])
    return "Adopté par l'Assemblée nationale" if latest[1] else "Rejeté"


def extraire_date_depot_min(actes):
    """Retourne la dateActe la plus ancienne trouvée de façon récursive."""
    if not actes:
        return None
    
    dates = []
    
    def recurse(obj):
        if isinstance(obj, dict):
            date_str = obj.get("dateActe")
            if date_str and isinstance(date_str, str):
                dt = parse_date_acte(date_str)
                if dt:
                    dates.append(dt)
            # Récursion sur toutes les sous-clés
            for v in obj.values():
                recurse(v)
        elif isinstance(obj, list):
            for item in obj:
                recurse(item)
    
    recurse(actes)
    
    return min(dates) if dates else None


# def ajouter_acteur_si_manquant(uid_acteur):
#    """Ajoute un acteur manquant avec placeholders si absent (pour éviter FK violations)."""
#   if not uid_acteur:
#      return
#  response = supabase.table('acteurs').select('uid').eq('uid', uid_acteur).execute()
#  if not response.data:
#      payload_acteur = {
#          'uid': uid_acteur,
#          'nom': 'Inconnu',  # Placeholder
#         'prenom': 'Inconnu',  # Placeholder
#        # Ajoute d'autres colonnes obligatoires avec defaults/None
#   }
#  supabase.table('acteurs').insert(payload_acteur).execute()
# tqdm.write(f"Acteur {uid_acteur} ajouté avec placeholders.")

# def ajouter_organe_si_manquant(uid_organe):
#    """Ajoute un organe manquant avec placeholders si absent (pour éviter FK violations)."""
#   if not uid_organe:
#      return
# response = supabase.table('organes').select('uid').eq('uid', uid_organe).execute()
# if not response.data:
#    payload_organe = {
#       'uid': uid_organe,
#      'libelle': 'Inconnu',  # Placeholder
#     # Ajoute d'autres colonnes obligatoires avec defaults/None (basé sur ton schéma : code_type, etc.)
# }
# supabase.table('organes').insert(payload_organe).execute()
# tqdm.write(f"Organe {uid_organe} ajouté avec placeholders.")


# ===================================================================
# Utilitaires Supabase
# ===================================================================
def fetch_all_rows(table: str, columns: str) -> list:
    """Récupère toutes les lignes d'une table Supabase en gérant la pagination (limite 1000/page)."""
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


# ===================================================================
# Téléchargement du ZIP
# ===================================================================
def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge le ZIP en mémoire depuis l'URL et renvoie l'objet ZipFile ouvert.
    Gère les erreurs HTTP pour robustesse.
    """
    response = requests.get(url, timeout=120)
    response.raise_for_status()  # Lève une exception si code HTTP != 200 (ex. : lien mort)
    return zipfile.ZipFile(
        io.BytesIO(response.content)
    )  # Tout en RAM pour éviter I/O disque


# ===================================================================
# Boucle sur les JSON du ZIP  → VERSION CORRIGÉE
# ===================================================================
def importer_dossiers_from_zip(
    zip_ref: zipfile.ZipFile, dossier_prefix: str = "json/dossierParlementaire/"
):
    """Boucle sur tous les .json avec batch upsert + résumé final à la fin seulement"""

    # --- Pré-chargement des lookups (évite N+1 requêtes dans la boucle) ---
    print("Chargement des acteurs et organes en mémoire...")
    acteurs_rows = fetch_all_rows("acteurs", "uid,groupe")
    acteur_to_groupe = {
        row["uid"]: row["groupe"]
        for row in acteurs_rows
        if row.get("groupe")
    }

    groupe_uids = list(set(acteur_to_groupe.values()))
    organe_to_libelle: dict = {}
    if groupe_uids:
        chunk_size = 500
        for i in range(0, len(groupe_uids), chunk_size):
            chunk = groupe_uids[i : i + chunk_size]
            resp = supabase.table("organes").select("uid,libelle").in_("uid", chunk).execute()
            if resp.data:
                for row in resp.data:
                    organe_to_libelle[row["uid"]] = row["libelle"]

    print(f"  → {len(acteur_to_groupe)} acteurs, {len(organe_to_libelle)} organes chargés.")

    # Chargement des gouvernements (pour attribuer le bon gouvernement selon la date de dépôt)
    gvt_rows = supabase.table("organes").select("uid,libelle_abrege,date_debut,date_fin").eq("code_type", "GOUVERNEMENT").execute()
    gouvernements = []  # liste de (date_debut, date_fin_ou_None, uid)
    gouvernements_uids = set()
    for g in (gvt_rows.data or []):
        if not g.get("date_debut"):
            continue
        deb = parse_date_acte(g["date_debut"])
        fin = parse_date_acte(g["date_fin"]) if g.get("date_fin") else None
        if not deb:
            continue
        gouvernements.append((deb, fin, g["uid"]))
        gouvernements_uids.add(g["uid"])
    gouvernements.sort(key=lambda x: x[0])
    print(f"  → {len(gouvernements)} gouvernements chargés.\n")
    # ----------------------------------------------------------------------

    success = 0
    failed = 0

    json_files = [
        f
        for f in zip_ref.namelist()
        if f.startswith(dossier_prefix) and f.endswith(".json")
    ]
    print(f"Nombre total de JSON à traiter : {len(json_files)}\n")

    batch_size = 500
    batch = []

    def flush_batch(b: list, idx: int = -1) -> tuple[int, int]:
        """Envoie un batch avec retry automatique en cas de timeout."""
        try:
            resp = (
                supabase.table("dossiers_legislatifs")
                .upsert(b, on_conflict="uid")
                .execute()
            )
            if getattr(resp, "error", None):
                label = f"idx {idx}" if idx >= 0 else "final"
                tqdm.write(f"❌ Erreur batch ({label}): {resp.error}")
                return 0, len(b)
            return len(b), 0
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower() or "time-out" in error_msg.lower() or "57014" in error_msg or '"code": 504' in error_msg or "'code': 504" in error_msg:
                if len(b) > 50:
                    mid = len(b) // 2
                    tqdm.write(f"⏱️  Timeout dossiers ({len(b)} rows) — retry en 2x{mid}")
                    s1, f1 = flush_batch(b[:mid], idx)
                    s2, f2 = flush_batch(b[mid:], idx)
                    return s1 + s2, f1 + f2
            tqdm.write(f"❌ Erreur batch: {e}")
            return 0, len(b)

    # Boucle principale
    parsed = 0
    for idx, file_path in enumerate(
        tqdm(json_files, desc="Import dossiers législatifs", unit="dossier")
    ):
        with zip_ref.open(file_path) as json_stream:
            dossier_data = json.load(json_stream)

            payload = importer_dossier(dossier_data, file_path, acteur_to_groupe, organe_to_libelle, gouvernements, gouvernements_uids)

            if payload is not None:
                batch.append(payload)
                parsed += 1
            else:
                failed += 1

            # Upsert par batch
            if len(batch) >= batch_size:
                s, f = flush_batch(batch, idx)
                success += s
                failed += f
                batch = []

    if batch:  # Envoi final du batch restant
        s, f = flush_batch(batch)
        success += s
        failed += f

    # ←══════════════════════════════════════════════════════════════
    #                  RAPPORT FINAL (Une seule fois !)
    # ←══════════════════════════════════════════════════════════════
    print(f"\n{'='*60}")
    print(f"                  IMPORT TERMINÉ")
    print(f"{'='*60}")
    print(f"   Parsés  : {parsed}")
    print(f"   Upserts : {success}")
    print(f"   Échecs  : {failed}")
    print(f"   Total   : {parsed + failed} / {len(json_files)}")
    print(f"{'='*60}")


# ===================================================================
# Import d'un seul dossier
# ===================================================================
def importer_dossier(data: dict, file_path: str = "unknown.json", acteur_to_groupe: dict = None, organe_to_libelle: dict = None, gouvernements: list = None, gouvernements_uids: set = None):

    try:
        dossier = data.get("dossierParlementaire", {})
        if not dossier:
            tqdm.write(f"⚠️  Format invalide → {file_path}")
            return None

        uid = dossier.get("uid")
        if not uid:
            tqdm.write(f"⚠️  UID manquant → {file_path}")
            return None

        legislature = (
            int(dossier.get("legislature")) if dossier.get("legislature") else None
        )
        titre_dossier = dossier.get("titreDossier") or {}
        titre = titre_dossier.get("titre")
        titre_chemin = titre_dossier.get("titreChemin")
        senat_chemin = titre_dossier.get("senatChemin")
        procedure = dossier.get("procedureParlementaire") or {}
        procedure_code = procedure.get("code")
        procedure_libelle = procedure.get("libelle")
        initiateur = dossier.get("initiateur") or {}
        # Acteurs (gère liste multiple)
        acteurs_data = initiateur.get("acteurs") or {}
        acteurs_list = acteurs_data.get("acteur") or []
        if not isinstance(acteurs_list, list):
            acteurs_list = [acteurs_list] if acteurs_list else []
        # Premier comme initiateur principal
        initiateur_acteur_ref = None
        initiateur_mandat_ref = None
        if acteurs_list:
            premier = acteurs_list[0] if isinstance(acteurs_list[0], dict) else {}
            initiateur_acteur_ref = premier.get("acteurRef")
            initiateur_mandat_ref = premier.get("mandatRef")
        # Reste comme co-auteurs (liste d'UIDs acteurRef pour query facile via = ANY())
        co_auteurs = [
            a.get("acteurRef")
            for a in acteurs_list[1:]
            if isinstance(a, dict) and a.get("acteurRef")
        ]
        # Organes (inchangé, par sécurité)
        organes_data = initiateur.get("organes") or {}
        organe = organes_data.get("organe") or {}
        if isinstance(organe, list) and organe:
            organe = organe[0] if isinstance(organe[0], dict) else {}
        if not isinstance(organe, dict):
            organe = {}
        organe_ref = organe.get("organeRef") or {}
        initiateur_organe_ref = (
            organe_ref.get("uid") if isinstance(organe_ref, dict) else organe_ref
        )
        # Ajoute acteurs manquants (principal + co-auteurs)
        # ajouter_acteur_si_manquant(initiateur_acteur_ref)
        # for co in co_auteurs:
        # ajouter_acteur_si_manquant(co['acteurRef'])
        # Ajoute organe manquant
        # ajouter_organe_si_manquant(initiateur_organe_ref)


        # Lookup groupe depuis les dicts pré-chargés (pas de requête Supabase ici)
        initiateur_groupe_uid = None
        initiateur_groupe_libelle = None

        # 1. Cas gouvernemental : l'initiateur est un organe gouvernement
        #    → on utilise initiateur_organe_ref s'il est directement un gouvernement connu,
        #      sinon on retrouve le bon gouvernement via la date de dépôt.
        if gouvernements_uids and initiateur_organe_ref and initiateur_organe_ref in gouvernements_uids:
            initiateur_groupe_uid = initiateur_organe_ref
            initiateur_groupe_libelle = "Gouvernement"

        # 2. Cas parlementaire (proposition de loi) : lookup via l'acteur initiateur
        #    On exclut les UIDs de gouvernements pour éviter que des ministres-députés
        #    contaminent le résultat avec leur ancien groupe ou le gouvernement actuel.
        elif initiateur_acteur_ref and acteur_to_groupe:
            groupe_uid = acteur_to_groupe.get(initiateur_acteur_ref)
            if groupe_uid and (gouvernements_uids is None or groupe_uid not in gouvernements_uids):
                initiateur_groupe_uid = groupe_uid
                if organe_to_libelle:
                    initiateur_groupe_libelle = organe_to_libelle.get(initiateur_groupe_uid)

        actes_legislatifs = (
            dossier.get("actesLegislatifs", {}).get("acteLegislatif", []) or []
        )
        fusion_dossier = dossier.get("fusionDossier")
        # Extraction textes et votes
        textes_set = set()
        votes_set = set()
        extraire_refs_recursif(actes_legislatifs, "texteAssocie", textes_set)
        extraire_refs_recursif(actes_legislatifs, "texteAdopte", textes_set)
        extraire_refs_recursif(actes_legislatifs, "voteRefs", votes_set, "voteRef")
        textes_associes_refs = list(textes_set)
        votes_refs = list(votes_set)

        date_depot = extraire_date_depot_min(actes_legislatifs)
        date_depot = date_depot.isoformat() if date_depot else None

        # 3. Fallback gouvernemental : pas de groupe trouvé, on cherche le gouvernement actif à la date de dépôt
        if not initiateur_groupe_uid and gouvernements and date_depot:
            dt = parse_date_acte(date_depot)
            if dt:
                for deb, fin, gvt_uid in gouvernements:
                    if deb <= dt and (fin is None or fin >= dt):
                        initiateur_groupe_uid = gvt_uid
                        initiateur_groupe_libelle = "Gouvernement"
                        break

        # Statut de base (promulgation + rejets simples via ancienne fonction)
        statut_base, date_promulgation, code_loi, titre_loi, url_legifrance = (
            extraire_statut_final_et_prom(actes_legislatifs)
        )

        # === NOUVELLE LOGIQUE PRINCIPALE (plus précise) ===
        PROCEDURES_CHAMBRE_UNIQUE = {"8", "13", "22"}

        if statut_base == "promulguee":
            statut_final = "Promulguée"
        elif str(procedure_code or "") in PROCEDURES_CHAMBRE_UNIQUE:
            statut_final = determiner_statut_final_chambre_unique(actes_legislatifs)
        else:
            statut_final = determiner_statut_final_precis(actes_legislatifs)


        # Lien AN
        lien_an = reconstruire_lien_an(legislature, titre_chemin)
        # Préparation payload Supabase
        payload = {
            "uid": uid,
            "legislature": legislature,
            "titre": titre,
            "titre_chemin": titre_chemin,
            "lien_senat": senat_chemin,
            "procedure_code": procedure_code,
            "procedure_libelle": procedure_libelle,
            "initiateur_acteur_ref": initiateur_acteur_ref,
            "initiateur_mandat_ref": initiateur_mandat_ref,
            "initiateur_organe_ref": initiateur_organe_ref,
            "co_auteurs": co_auteurs or None,  # text[] — queryable via = ANY()
            "actes_legislatifs": actes_legislatifs or [],
            "fusion_dossier": fusion_dossier or None,
            "statut_final": statut_final,
            "date_depot": date_depot,
            "date_promulgation": date_promulgation,
            "code_loi": code_loi,
            "titre_loi": titre_loi,
            "url_legifrance": url_legifrance,
            "textes_associes_refs": textes_associes_refs,
            "votes_refs": votes_refs,
            "lien_an": lien_an,
            "initiateur_groupe_uid": initiateur_groupe_uid,
            "initiateur_groupe_libelle": initiateur_groupe_libelle,
            "themes": classify_themes(titre) or None,
        }

        return payload

    except Exception as e:
        tqdm.write(f"🔥 ERREUR CRITIQUE dans {file_path}")
        tqdm.write(f"   → {type(e).__name__}: {e}")
        traceback.print_exc()
        return None


# ===================================================================
# Exécution
# ===================================================================

if __name__ == "__main__":
    URL_DOSSIERS = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"
    zip_ref = download_zip(URL_DOSSIERS)
    importer_dossiers_from_zip(zip_ref)
    print("Import terminé !")
