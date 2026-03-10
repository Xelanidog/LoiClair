"""
import_legifrance_cloud.py
Récupère le texte complet des lois promulguées depuis l'API Légifrance (PISTE)
et stocke le contenu dans Supabase (colonne contenu_legifrance de la table textes).

Deux passes :
1. JORF : récupère le texte original publié au Journal Officiel (via getJoWithNor)
2. Version consolidée : crée une entrée séparée avec l'URL de la version en vigueur (via recherche LODA)

Prérequis :
- Variables d'environnement LEGIFRANCE_CLIENT_ID et LEGIFRANCE_CLIENT_SECRET dans .env.local
- Variables SUPABASE_URL et SUPABASE_KEY dans .env.local
"""

import os
import re
import time
import json
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

# ── Configuration ──────────────────────────────────────────────────────────────

# Charger les variables d'environnement depuis .env.local (projet parent)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
LEGIFRANCE_CLIENT_ID = os.getenv("LEGIFRANCE_CLIENT_ID")
LEGIFRANCE_CLIENT_SECRET = os.getenv("LEGIFRANCE_CLIENT_SECRET")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
if not LEGIFRANCE_CLIENT_ID or not LEGIFRANCE_CLIENT_SECRET:
    raise ValueError("LEGIFRANCE_CLIENT_ID ou LEGIFRANCE_CLIENT_SECRET manquant dans .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# URLs API Légifrance — sandbox pour dev, production sans préfixe "sandbox-"
# Pour passer en prod : retirer "sandbox-" des deux URLs ci-dessous
OAUTH_URL = "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
API_BASE = "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app"

# Pause entre chaque appel API (en secondes) — quota : 2 req/s par endpoint
RATE_LIMIT_PAUSE = 0.6


# ── Authentification OAuth 2.0 ────────────────────────────────────────────────

def get_access_token() -> str:
    """Obtient un token d'accès via OAuth 2.0 Client Credentials."""
    response = requests.post(
        OAUTH_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": LEGIFRANCE_CLIENT_ID,
            "client_secret": LEGIFRANCE_CLIENT_SECRET,
            "scope": "openid",
        },
        timeout=30,
    )
    response.raise_for_status()
    token = response.json().get("access_token")
    if not token:
        raise ValueError(f"Pas de access_token dans la réponse OAuth : {response.json()}")
    return token


# ── Appels API Légifrance ─────────────────────────────────────────────────────

def fetch_jorf_by_nor(nor: str, token: str) -> dict | None:
    """Récupère un texte JORF via son numéro NOR."""
    response = requests.post(
        f"{API_BASE}/consult/getJoWithNor",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"nor": nor},
        timeout=30,
    )
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def fetch_jorf_by_id(jorftext_id: str, token: str) -> dict | None:
    """Récupère un texte JORF via son identifiant JORFTEXT (fallback)."""
    response = requests.post(
        f"{API_BASE}/consult/jorf",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"id": jorftext_id},
        timeout=30,
    )
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def fetch_loda_latest_date(nor: str, token: str) -> str | None:
    """Récupère la date de la dernière version consolidée via recherche LODA par NOR.
    Retourne une date ISO (YYYY-MM-DD) ou None."""
    if not nor:
        return None
    response = requests.post(
        f"{API_BASE}/search",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "recherche": {
                "champs": [{"typeChamp": "NOR", "criteres": [{"typeRecherche": "EXACTE", "valeur": nor, "operateur": "ET"}], "operateur": "ET"}],
                "filtres": [{"facette": "TEXT_LEGAL_STATUS", "valeurs": ["VIGUEUR"]}],
                "pageNumber": 1,
                "pageSize": 10,
                "typePagination": "DEFAUT",
            },
            "fond": "LODA_DATE",
        },
        timeout=30,
    )
    if response.status_code != 200:
        return None
    latest = None
    for r in response.json().get("results", []):
        for t in r.get("titles", []):
            m = re.search(r"(\d{2})-(\d{2})-(\d{4})$", t.get("id", ""))
            if m:
                iso = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
                if not latest or iso > latest:
                    latest = iso
    return latest


def build_loda_url(jorf_url: str) -> str | None:
    """Construit l'URL de la version consolidée depuis l'URL JORF.
    Ex: /jorf/id/JORFTEXT000051586300 → /loda/id/JORFTEXT000051586300"""
    if not jorf_url:
        return None
    jorftext_id = re.search(r"(JORFTEXT\d+)", jorf_url)
    if not jorftext_id:
        return None
    return f"https://www.legifrance.gouv.fr/loda/id/{jorftext_id.group(1)}"


# ── Extraction du texte ───────────────────────────────────────────────────────

def extract_jorftext_id(url: str) -> str | None:
    """Extrait un identifiant JORFTEXT depuis une URL Légifrance (nouveau format)."""
    match = re.search(r"(JORFTEXT\d+)", url)
    return match.group(1) if match else None


def extract_text_content(jorf_data: dict) -> str | None:
    """
    Extrait le contenu textuel depuis la réponse JSON de l'API Légifrance.
    Structure API : { articles: [...], sections: [{ articles: [...], sections: [...] }] }
    Les articles ont un champ "content" (HTML) et "num" (numéro d'article).
    """
    if not jorf_data:
        return None

    parts = []

    # Titre de la loi
    title = jorf_data.get("title")
    if title:
        parts.append(title)

    # Visa (préambule)
    visa = jorf_data.get("visa")
    if visa:
        parts.append(_clean_html(visa))

    # Articles au niveau racine (ex: article liminaire)
    for article in jorf_data.get("articles", []):
        _append_article(article, parts)

    # Articles dans les sections (récursif)
    for section in jorf_data.get("sections", []):
        _extract_section(section, parts)

    # Signataires
    signers = jorf_data.get("signers")
    if signers:
        parts.append(_clean_html(signers))

    if len(parts) <= 1:  # Seulement le titre ou rien
        return None

    return "\n\n".join(parts).strip()


def extract_canonical_url(jorf_data: dict) -> str | None:
    """Extrait l'URL canonique Légifrance depuis la réponse API."""
    cid = jorf_data.get("cid")
    if cid and isinstance(cid, str) and cid.startswith("JORFTEXT"):
        return f"https://www.legifrance.gouv.fr/jorf/id/{cid}"
    return None


def _extract_section(section: dict, parts: list):
    """Extrait récursivement les articles d'une section et de ses sous-sections."""
    title = section.get("title")
    if title:
        parts.append(f"--- {title} ---")

    for article in section.get("articles", []):
        _append_article(article, parts)

    for sub_section in section.get("sections", []):
        _extract_section(sub_section, parts)


def _append_article(article: dict, parts: list):
    """Ajoute un article nettoyé à la liste des parties."""
    content = article.get("content", "")
    if not content:
        return
    num = article.get("num", "")
    clean = _clean_html(content)
    if num:
        parts.append(f"Article {num}\n{clean}")
    else:
        parts.append(clean)


def _clean_html(text: str) -> str:
    """Nettoie les balises HTML basiques d'un texte."""
    # Retirer les balises HTML
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    # Décoder les entités HTML courantes
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " ")
    # Normaliser les espaces
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ── Supabase : récupération et mise à jour ────────────────────────────────────

def fetch_loi_textes_sans_contenu() -> list:
    """Récupère les textes LOI originaux sans contenu OU sans lien_texte (avec pagination)."""
    all_rows = []
    seen_uids = set()
    # 1. Sans contenu (enrichissement complet)
    offset = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table("textes")
            .select("uid, lien_texte, num_notice, denomination")
            .eq("type_code", "LOI")
            .eq("is_version_consolidee", False)
            .is_("contenu_legifrance", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        for row in resp.data:
            seen_uids.add(row["uid"])
        all_rows.extend(resp.data)
        if len(resp.data) < page_size:
            break
        offset += page_size
    # 2. Avec contenu mais sans lien_texte (rattrapage URL uniquement)
    offset = 0
    while True:
        resp = (
            supabase.table("textes")
            .select("uid, lien_texte, num_notice, denomination")
            .eq("type_code", "LOI")
            .eq("is_version_consolidee", False)
            .not_.is_("contenu_legifrance", "null")
            .is_("lien_texte", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        for row in resp.data:
            if row["uid"] not in seen_uids:
                all_rows.append(row)
        if len(resp.data) < page_size:
            break
        offset += page_size
    return all_rows


def fetch_loi_textes_pour_consolidee() -> list:
    """Récupère les textes LOI originaux enrichis (avec contenu_legifrance) pour créer les versions consolidées."""
    all_rows = []
    offset = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table("textes")
            .select("uid, num_notice, denomination, dossier_ref, lien_texte, date_publication")
            .eq("type_code", "LOI")
            .eq("is_version_consolidee", False)
            .not_.is_("contenu_legifrance", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        all_rows.extend(resp.data)
        if len(resp.data) < page_size:
            break
        offset += page_size
    return all_rows


def fetch_existing_vc_uids() -> set:
    """Récupère les UIDs des versions consolidées existantes."""
    all_uids = set()
    offset = 0
    page_size = 1000
    while True:
        resp = (
            supabase.table("textes")
            .select("uid")
            .eq("is_version_consolidee", True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not resp.data:
            break
        all_uids.update(row["uid"] for row in resp.data)
        if len(resp.data) < page_size:
            break
        offset += page_size
    return all_uids


def update_texte(uid: str, contenu: str, new_lien: str | None = None):
    """Met à jour le contenu Légifrance (et optionnellement le lien) d'un texte."""
    update_data = {"contenu_legifrance": contenu}
    if new_lien:
        update_data["lien_texte"] = new_lien
        update_data["url_accessible"] = True
    try:
        supabase.table("textes").update(update_data).eq("uid", uid).execute()
    except Exception as e:
        tqdm.write(f"  Erreur update Supabase pour {uid}: {e}")


# ── Script principal ──────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("IMPORT LÉGIFRANCE — Récupération des textes promulgués")
    print("=" * 60)

    # 1. Authentification OAuth
    print("\n1. Authentification OAuth...")
    try:
        token = get_access_token()
        print("   Token obtenu.")
    except Exception as e:
        print(f"   ERREUR authentification : {e}")
        return

    # ── Passe 1 : Enrichissement JORF (texte original) ──────────────────────

    print("\n2. Chargement des textes LOI sans contenu JORF...")
    textes = fetch_loi_textes_sans_contenu()
    print(f"   {len(textes)} texte(s) LOI à traiter.")

    success_jorf = 0
    skip_jorf = 0

    if textes:
        print("\n3. Récupération des textes JORF depuis l'API Légifrance...\n")

        for texte in tqdm(textes, desc="Textes JORF"):
            uid = texte["uid"]
            nor = texte.get("num_notice")
            lien = texte.get("lien_texte", "")

            # Essai 1 : par NOR (approche principale)
            jorf_data = None
            if nor:
                try:
                    jorf_data = fetch_jorf_by_nor(nor, token)
                except requests.exceptions.HTTPError as e:
                    if e.response is not None and e.response.status_code == 401:
                        tqdm.write(f"  Token expiré, renouvellement...")
                        token = get_access_token()
                        try:
                            jorf_data = fetch_jorf_by_nor(nor, token)
                        except Exception as e2:
                            tqdm.write(f"  Erreur API pour {uid} (NOR={nor}): {e2}")
                    else:
                        tqdm.write(f"  Erreur API pour {uid} (NOR={nor}): {e}")
                except Exception as e:
                    tqdm.write(f"  Erreur API pour {uid} (NOR={nor}): {e}")

            # Essai 2 : par JORFTEXT ID (si présent dans l'URL)
            if not jorf_data:
                jorftext_id = extract_jorftext_id(lien)
                if jorftext_id:
                    try:
                        jorf_data = fetch_jorf_by_id(jorftext_id, token)
                    except Exception as e:
                        tqdm.write(f"  Erreur API fallback pour {uid} (ID={jorftext_id}): {e}")

            # Extraction du contenu textuel
            if jorf_data:
                contenu = extract_text_content(jorf_data)
                if contenu and len(contenu) > 100:
                    canonical_url = extract_canonical_url(jorf_data)
                    update_texte(uid, contenu, new_lien=canonical_url)
                    success_jorf += 1
                else:
                    tqdm.write(f"  Contenu trop court ou vide pour {uid} (NOR={nor})")
                    skip_jorf += 1
            else:
                tqdm.write(f"  Aucun résultat API pour {uid} (NOR={nor})")
                skip_jorf += 1

            time.sleep(RATE_LIMIT_PAUSE)

        print(f"\n   JORF : {success_jorf} enrichi(s), {skip_jorf} ignoré(s)")
    else:
        print("   Aucun texte JORF à traiter.")

    # ── Passe 2 : Versions consolidées ──────────────────────────────────────

    print("\n4. Création des versions consolidées...")
    textes_pour_vc = fetch_loi_textes_pour_consolidee()
    existing_vc = fetch_existing_vc_uids()

    # Filtrer : ne garder que ceux sans version consolidée existante
    textes_a_traiter = [t for t in textes_pour_vc if f"{t['uid']}-VC" not in existing_vc]
    print(f"   {len(textes_a_traiter)} version(s) consolidée(s) à créer ({len(existing_vc)} déjà existante(s)).")

    success_vc = 0
    skip_vc = 0

    if textes_a_traiter:
        print()

        for texte in textes_a_traiter:
            uid = texte["uid"]
            lien_original = texte.get("lien_texte", "")
            dossier_ref = texte.get("dossier_ref")
            denomination = texte.get("denomination", "")
            nor = texte.get("num_notice", "")

            loda_url = build_loda_url(lien_original)
            if not loda_url:
                tqdm.write(f"  Pas de JORFTEXT dans lien_texte pour {uid}, skip")
                skip_vc += 1
                continue

            vc_uid = f"{uid}-VC"
            vc_denomination = f"Version consolidée — {denomination}" if denomination else "Version consolidée"

            # Récupérer la date de dernière modification via recherche LODA
            latest_date = None
            try:
                latest_date = fetch_loda_latest_date(nor, token)
            except Exception as e:
                tqdm.write(f"  Erreur recherche LODA pour {vc_uid}: {e}")
            time.sleep(RATE_LIMIT_PAUSE)

            row = {
                "uid": vc_uid,
                "dossier_ref": dossier_ref,
                "type_code": "LOI",
                "denomination": vc_denomination,
                "lien_texte": loda_url,
                "url_accessible": True,
                "is_version_consolidee": True,
                "provenance": "Légifrance",
            }
            if latest_date:
                row["date_publication"] = f"{latest_date} 00:00:00"

            try:
                supabase.table("textes").insert(row).execute()
                success_vc += 1
            except Exception as e:
                tqdm.write(f"  Erreur insert VC pour {vc_uid}: {e}")
                skip_vc += 1

        # Rattrapage : mettre à jour la date des VC existantes sans date
        existing_vc_sans_date = []
        offset_vc = 0
        while True:
            resp_vc = (
                supabase.table("textes")
                .select("uid, lien_texte")
                .eq("is_version_consolidee", True)
                .is_("date_publication", "null")
                .range(offset_vc, offset_vc + 999)
                .execute()
            )
            if not resp_vc.data:
                break
            existing_vc_sans_date.extend(resp_vc.data)
            if len(resp_vc.data) < 1000:
                break
            offset_vc += 1000

        if existing_vc_sans_date:
            print(f"   + {len(existing_vc_sans_date)} VC existante(s) sans date à enrichir.")
            # Construire un mapping VC uid → NOR depuis la loi originale
            vc_base_uids = [r["uid"].replace("-VC", "") for r in existing_vc_sans_date]
            nor_map = {}
            for i in range(0, len(vc_base_uids), 100):
                batch = vc_base_uids[i:i+100]
                resp_nor = (
                    supabase.table("textes")
                    .select("uid, num_notice")
                    .in_("uid", batch)
                    .execute()
                )
                for row in (resp_nor.data or []):
                    if row.get("num_notice"):
                        nor_map[row["uid"]] = row["num_notice"]

            enriched_dates = 0
            for vc_row in existing_vc_sans_date:
                vc_uid = vc_row["uid"]
                base_uid = vc_uid.replace("-VC", "")
                nor = nor_map.get(base_uid)
                if not nor:
                    continue
                try:
                    latest_date = fetch_loda_latest_date(nor, token)
                    if latest_date:
                        supabase.table("textes").update({
                            "date_publication": f"{latest_date} 00:00:00",
                        }).eq("uid", vc_uid).execute()
                        enriched_dates += 1
                except Exception as e:
                    tqdm.write(f"  Erreur date VC {vc_uid}: {e}")
                time.sleep(RATE_LIMIT_PAUSE)

            if enriched_dates:
                print(f"   VC enrichies (date) : {enriched_dates}")

        print(f"\n   Consolidées : {success_vc} créée(s), {skip_vc} ignorée(s)")
    else:
        print("   Aucune version consolidée à créer.")

    # ── Résumé final ────────────────────────────────────────────────────────

    print("\n" + "=" * 60)
    print(f"RÉSULTAT JORF : {success_jorf} enrichi(s), {skip_jorf} ignoré(s)")
    print(f"RÉSULTAT CONSOLIDÉES : {success_vc} créée(s), {skip_vc} ignorée(s)")
    print("=" * 60)


if __name__ == "__main__":
    main()
