"""
import_application_lois.py
Importe les données d'application des lois depuis le baromètre de l'Assemblée Nationale.

Phase 1 : CSV baromètre AN → table application_lois (stats par loi)
Phase 2 : API Légifrance → tables textes + actes_legislatifs (contenu des décrets)

Usage : python import_application_lois.py
"""

import os
import csv
import io
import re
import time
import requests
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Configuration ─────────────────────────────────────────────────────────────

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Légifrance API (optionnel — si absent, on skip l'import des décrets)
LEGIFRANCE_CLIENT_ID = os.getenv("LEGIFRANCE_CLIENT_ID")
LEGIFRANCE_CLIENT_SECRET = os.getenv("LEGIFRANCE_CLIENT_SECRET")
OAUTH_URL = "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
API_BASE = "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"
RATE_LIMIT_PAUSE = 0.6

CSV_LOIS_URL = "https://barometre.assemblee-nationale.fr/barometre_application_lois_assemblee.csv"
CSV_MESURES_URL = "https://barometre.assemblee-nationale.fr/barometre_application_mesures_assemblee.csv"


# ── Téléchargement des CSV ────────────────────────────────────────────────────

def download_csv(url: str) -> list[dict]:
    """Télécharge un CSV et retourne une liste de dictionnaires."""
    print(f"  Téléchargement : {url.split('/')[-1]}...")
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    # Détecter l'encodage (UTF-8 ou latin-1)
    text = response.content.decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    rows = list(reader)
    print(f"  → {len(rows)} lignes lues")
    return rows


# ── Calcul des délais depuis le CSV mesures ───────────────────────────────────

def compute_delays(mesures_rows: list[dict]) -> dict:
    """
    Calcule les délais d'application par loi (JORFTEXT).
    Retourne {jorftext_id: {moyen, min, max}} en jours.
    """
    delays_by_law: dict[str, list[int]] = defaultdict(list)

    for row in mesures_rows:
        jorftext = row.get("Identifiant loi", "").strip()
        delai_str = row.get("Délai d'application (en jours)", "").strip()
        etat = row.get("État", "").strip().lower()

        # On ne compte que les mesures appliquées avec un délai valide
        if not jorftext or not delai_str or etat != "appliqué":
            continue

        try:
            delai = int(delai_str)
            if delai >= 0:
                delays_by_law[jorftext].append(delai)
        except ValueError:
            continue

    result = {}
    for jorftext, delays in delays_by_law.items():
        result[jorftext] = {
            "moyen": round(sum(delays) / len(delays)),
            "min": min(delays),
            "max": max(delays),
        }

    print(f"  → Délais calculés pour {len(result)} lois")
    return result


# ── Lookup dossier_uid ────────────────────────────────────────────────────────

def build_dossier_lookup() -> tuple[dict, dict]:
    """
    Construit deux tables de lookup pour matcher CSV → dossier_uid :
    1. uid_lookup : {uid: uid} — match direct par Identifiant Assemblée
    2. jorftext_lookup : {JORFTEXT_ID: dossier_ref} — match via textes.lien_texte
    """
    # 1. Tous les UIDs de dossiers
    print("  Chargement des dossiers depuis Supabase...")
    uid_set = set()
    offset = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table("dossiers_legislatifs")
            .select("uid")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        for row in resp.data:
            uid_set.add(row["uid"])
        if len(resp.data) < page_size:
            break
        offset += page_size

    print(f"  → {len(uid_set)} dossiers en base")

    # 2. Textes LOI avec lien_texte contenant JORFTEXT → dossier_ref
    print("  Chargement des textes LOI depuis Supabase...")
    jorftext_lookup = {}
    offset = 0
    while True:
        resp = (
            supabase.table("textes")
            .select("lien_texte, dossier_ref")
            .eq("type_code", "LOI")
            .not_.is_("lien_texte", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        for row in resp.data:
            lien = row.get("lien_texte", "") or ""
            dossier_ref = row.get("dossier_ref", "")
            # Extraire le JORFTEXT ID de l'URL
            match = re.search(r"(JORFTEXT\d+)", lien)
            if match and dossier_ref:
                jorftext_lookup[match.group(1)] = dossier_ref
        if len(resp.data) < page_size:
            break
        offset += page_size

    print(f"  → {len(jorftext_lookup)} liens JORFTEXT → dossier trouvés")

    return uid_set, jorftext_lookup


# ── Calcul du statut ──────────────────────────────────────────────────────────

def compute_statut(row: dict) -> str:
    """Détermine le statut d'application d'une loi à partir des données CSV."""
    if row.get("Loi d'application directe", "").strip().lower() == "oui":
        return "application_directe"

    if row.get("Loi autorisant la ratification d'accords internationaux", "").strip().lower() == "oui":
        return "sans_objet"

    nb_attendues = parse_int(row.get("Nombre de mesures à appliquer", "0"))
    nb_appliquees = parse_int(row.get("Nombre de mesures appliquées", "0"))

    if nb_attendues == 0:
        return "sans_objet"

    if nb_appliquees >= nb_attendues:
        return "appliquee"
    elif nb_appliquees > 0:
        return "partiellement_appliquee"
    else:
        return "non_appliquee"


def parse_int(val: str) -> int:
    """Parse un entier depuis le CSV, retourne 0 si invalide."""
    try:
        return int(val.strip())
    except (ValueError, AttributeError):
        return 0


def parse_float(val: str) -> float:
    """Parse un float depuis le CSV (gère la virgule française)."""
    try:
        return float(val.strip().replace(",", "."))
    except (ValueError, AttributeError):
        return 0.0


def parse_date(val: str):
    """Parse une date DD/MM/YYYY ou YYYY-MM-DD."""
    val = val.strip()
    if not val:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(val, fmt).date().isoformat()
        except ValueError:
            continue
    return None


# ── Auth Légifrance ───────────────────────────────────────────────────────────

def get_legifrance_token() -> str | None:
    """Authentification OAuth2 Légifrance. Retourne le token ou None si clés absentes."""
    if not LEGIFRANCE_CLIENT_ID or not LEGIFRANCE_CLIENT_SECRET:
        return None
    resp = requests.post(OAUTH_URL, data={
        "grant_type": "client_credentials",
        "client_id": LEGIFRANCE_CLIENT_ID,
        "client_secret": LEGIFRANCE_CLIENT_SECRET,
        "scope": "openid",
    })
    resp.raise_for_status()
    return resp.json()["access_token"]


# ── Import des décrets ───────────────────────────────────────────────────────

def extract_decrets_from_mesures(mesures_rows: list[dict], loi_dossier_map: dict) -> dict:
    """
    Extrait les JORFTEXT uniques des décrets depuis le CSV mesures.
    Ne garde que les décrets dont la loi est matchée avec un dossier.
    Retourne {decret_jorftext: dossier_uid}
    """
    decret_to_dossier = {}
    for row in mesures_rows:
        loi_jorftext = row.get("Identifiant loi", "").strip()
        decret_jorftext = row.get("Identifiant décret", "").strip()
        if not decret_jorftext or not loi_jorftext:
            continue
        if loi_jorftext in loi_dossier_map:
            decret_to_dossier[decret_jorftext] = loi_dossier_map[loi_jorftext]
    return decret_to_dossier


def get_existing_decrets() -> set:
    """Retourne les UIDs des décrets déjà en base."""
    existing = set()
    offset = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table("textes")
            .select("uid")
            .eq("type_code", "DECRET")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        for row in resp.data:
            existing.add(row["uid"])
        if len(resp.data) < page_size:
            break
        offset += page_size
    return existing


def extract_articles_html(data: dict) -> str:
    """Extrait le contenu HTML de tous les articles d'un texte JORF."""
    parts = []

    def _collect(sections):
        for s in sections:
            for a in s.get("articles", []):
                num = a.get("num", "")
                content = a.get("content", "")
                if content:
                    parts.append(f"<h3>{num}</h3>\n{content}")
            _collect(s.get("sections", []))

    _collect(data.get("sections", []))
    for a in data.get("articles", []):
        num = a.get("num", "")
        content = a.get("content", "")
        if content:
            parts.append(f"<h3>{num}</h3>\n{content}")

    return "\n".join(parts)


def import_decrets(mesures_rows: list[dict], loi_dossier_map: dict):
    """Phase 5 : importer le contenu des décrets via l'API Légifrance."""
    print("\n5. Import des décrets d'application...")

    # 5a. Auth
    token = get_legifrance_token()
    if not token:
        print("  ⚠ Clés Légifrance absentes — import des décrets ignoré")
        return
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 5b. Extraire les décrets uniques
    decret_to_dossier = extract_decrets_from_mesures(mesures_rows, loi_dossier_map)
    print(f"  → {len(decret_to_dossier)} décrets uniques pour les dossiers matchés")

    # 5c. Filtrer ceux déjà en base
    existing = get_existing_decrets()
    new_decrets = {
        jorf: dossier
        for jorf, dossier in decret_to_dossier.items()
        if f"DECRET_{jorf}" not in existing
    }
    print(f"  → {len(existing)} décrets déjà en base, {len(new_decrets)} nouveaux à importer")

    if not new_decrets:
        print("  Rien à importer.")
        return

    # 5d-5f. Récupérer et insérer chaque décret
    stats = {"textes_ok": 0, "actes_ok": 0, "api_errors": 0, "db_errors": 0}
    etapes_creees = set()

    for i, (jorftext_id, dossier_uid) in enumerate(new_decrets.items()):
        # Appel API
        try:
            resp = requests.post(
                f"{API_BASE}/consult/jorf",
                headers=headers,
                json={"textCid": jorftext_id},
            )
            if resp.status_code != 200:
                print(f"  API erreur {jorftext_id}: {resp.status_code}")
                stats["api_errors"] += 1
                time.sleep(RATE_LIMIT_PAUSE)
                continue
        except Exception as e:
            print(f"  API exception {jorftext_id}: {e}")
            stats["api_errors"] += 1
            time.sleep(RATE_LIMIT_PAUSE)
            continue

        data = resp.json()
        title = data.get("title", "")
        nor = data.get("nor", "")
        contenu = extract_articles_html(data)

        # Date de parution (timestamp ms → datetime)
        date_parution = None
        if data.get("dateParution"):
            date_parution = datetime.fromtimestamp(
                data["dateParution"] / 1000, tz=timezone.utc
            ).strftime("%Y-%m-%d %H:%M:%S")

        # Extraire le numéro du dossier pour l'UID de l'étape (ex: 51222 de DLR5L17N51222)
        num_dossier = re.search(r"N(\d+)$", dossier_uid)
        num_dossier = num_dossier.group(1) if num_dossier else dossier_uid

        # 5e. Insérer dans textes
        texte_uid = f"DECRET_{jorftext_id}"
        try:
            supabase.table("textes").upsert({
                "uid": texte_uid,
                "type_code": "DECRET",
                "type_libelle": "Décret d'application",
                "titre_principal": title,
                "date_publication": date_parution,
                "lien_texte": f"https://www.legifrance.gouv.fr/jorf/id/{jorftext_id}",
                "contenu_legifrance": contenu,
                "dossier_ref": dossier_uid,
                "legislature": 17,
                "provenance": "Légifrance",
                "denomination": nor,
                "url_accessible": True,
            }, on_conflict="uid").execute()
            stats["textes_ok"] += 1
        except Exception as e:
            print(f"  DB erreur texte {texte_uid}: {e}")
            stats["db_errors"] += 1

        # 5f. Insérer dans actes_legislatifs
        # Étape parente (une seule par dossier)
        etape_uid = f"L17-DECAPP-{num_dossier}"
        if etape_uid not in etapes_creees:
            try:
                supabase.table("actes_legislatifs").upsert({
                    "uid": etape_uid,
                    "dossier_uid": dossier_uid,
                    "code_acte": "DECAPP",
                    "libelle_acte": "Décrets d'application",
                    "type_acte": "Etape_Type",
                }, on_conflict="uid,dossier_uid").execute()
                etapes_creees.add(etape_uid)
            except Exception as e:
                print(f"  DB erreur étape {etape_uid}: {e}")

        # Acte du décret
        acte_uid = f"L17-DECAPP-{jorftext_id}"
        try:
            supabase.table("actes_legislatifs").upsert({
                "uid": acte_uid,
                "dossier_uid": dossier_uid,
                "code_acte": "DECAPP-PUB",
                "libelle_acte": "Publication d'un décret d'application",
                "type_acte": "PublicationDecret_Type",
                "date_acte": date_parution,
                "parent_uid": etape_uid,
                "texte_adopte": texte_uid,
                "titre_loi": title,
            }, on_conflict="uid,dossier_uid").execute()
            stats["actes_ok"] += 1
        except Exception as e:
            print(f"  DB erreur acte {acte_uid}: {e}")
            stats["db_errors"] += 1

        if (i + 1) % 10 == 0:
            print(f"  ... {i + 1}/{len(new_decrets)} décrets traités")

        time.sleep(RATE_LIMIT_PAUSE)

    print(f"  Textes insérés  : {stats['textes_ok']}")
    print(f"  Actes insérés   : {stats['actes_ok']}")
    print(f"  Erreurs API     : {stats['api_errors']}")
    print(f"  Erreurs DB      : {stats['db_errors']}")


# ── Import principal ──────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("IMPORT APPLICATION DES LOIS — Baromètre AN")
    print("=" * 60)

    # 1. Télécharger les CSV
    print("\n1. Téléchargement des CSV...")
    lois_rows = download_csv(CSV_LOIS_URL)
    mesures_rows = download_csv(CSV_MESURES_URL)

    # 2. Calculer les délais depuis le CSV mesures
    print("\n2. Calcul des délais d'application...")
    delays = compute_delays(mesures_rows)

    # 3. Construire les lookups dossier
    print("\n3. Construction des lookups dossier...")
    uid_set, jorftext_lookup = build_dossier_lookup()

    # 4. Traiter chaque loi
    print("\n4. Traitement des lois...")
    stats = {
        "total": 0,
        "matched": 0,
        "unmatched": 0,
        "upserted": 0,
        "errors": 0,
    }
    # Mapping JORFTEXT loi → dossier_uid (pour la phase 5)
    loi_dossier_map = {}

    for row in lois_rows:
        stats["total"] += 1
        jorftext = row.get("Identifiant Légifrance de la loi", "").strip()
        if not jorftext:
            continue

        # Chercher le dossier_uid
        an_id = row.get("Identifiant Assemblée du dossier législatif", "").strip()
        dossier_uid = None

        # Match 1 : ID Assemblée direct
        if an_id and an_id in uid_set:
            dossier_uid = an_id
        # Match 2 : via JORFTEXT → textes → dossier_ref
        elif jorftext in jorftext_lookup:
            ref = jorftext_lookup[jorftext]
            if ref in uid_set:
                dossier_uid = ref

        if dossier_uid:
            stats["matched"] += 1
            loi_dossier_map[jorftext] = dossier_uid
        else:
            stats["unmatched"] += 1

        # Données CSV
        nb_attendues = parse_int(row.get("Nombre de mesures à appliquer", "0"))
        nb_appliquees = parse_int(row.get("Nombre de mesures appliquées", "0"))
        taux = parse_float(row.get("Taux d'application des mesures", "0"))
        legislature = parse_int(row.get("Législature", "0")) or None

        # Délais depuis CSV mesures
        law_delays = delays.get(jorftext, {})

        record = {
            "jorftext_id": jorftext,
            "dossier_uid": dossier_uid,
            "titre": row.get("Titre de la loi", "").strip() or None,
            "legislature": legislature,
            "date_publication": parse_date(row.get("Date de publication de la loi", "")),
            "application_directe": row.get("Loi d'application directe", "").strip().lower() == "oui",
            "sans_echeancier": row.get("Loi sans échéancier", "").strip().lower() == "oui",
            "ratification_accord": row.get("Loi autorisant la ratification d'accords internationaux", "").strip().lower() == "oui",
            "habilitation_ordonnances": row.get("Loi d'habilitation (ordonnances)", "").strip().lower() == "oui",
            "ratification_ordonnances": row.get("Loi de ratification (ordonnances)", "").strip().lower() == "oui",
            "nb_mesures_attendues": nb_attendues,
            "nb_mesures_appliquees": nb_appliquees,
            "taux_application": taux,
            "delai_moyen_jours": law_delays.get("moyen"),
            "delai_min_jours": law_delays.get("min"),
            "delai_max_jours": law_delays.get("max"),
            "statut_application": compute_statut(row),
            "derniere_maj": datetime.now(tz=timezone.utc).isoformat(),
        }

        try:
            supabase.table("application_lois").upsert(
                record, on_conflict="jorftext_id"
            ).execute()
            stats["upserted"] += 1
        except Exception as e:
            stats["errors"] += 1
            print(f"  Erreur upsert {jorftext}: {e}")

    # 5. Import des décrets d'application via API Légifrance
    import_decrets(mesures_rows, loi_dossier_map)

    # 6. Résumé
    print(f"\n{'=' * 60}")
    print("RÉSUMÉ")
    print(f"{'=' * 60}")
    print(f"  Total lois dans le CSV  : {stats['total']}")
    print(f"  Matchées avec dossier   : {stats['matched']}")
    print(f"  Non matchées (pas en DB): {stats['unmatched']}")
    print(f"  Upsertées               : {stats['upserted']}")
    print(f"  Erreurs                  : {stats['errors']}")

    print("\nDistribution par statut :")
    for statut in ["appliquee", "partiellement_appliquee", "non_appliquee",
                    "application_directe", "sans_objet", "inconnu"]:
        try:
            resp = (
                supabase.table("application_lois")
                .select("id", count="exact")
                .eq("statut_application", statut)
                .execute()
            )
            print(f"  {statut}: {resp.count}")
        except Exception:
            pass


if __name__ == "__main__":
    main()
