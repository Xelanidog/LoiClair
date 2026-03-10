# import_actes_legislatifs_cloud.py
# Script pour importer tous les actes législatifs nested des JSON dossiers commençant par 'DLR'
# depuis le ZIP AN dans Supabase table 'actes_legislatifs'.
# Exécute avec : python import_actes_legislatifs_cloud.py

import json
import os
import re
from datetime import datetime
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import io
import zipfile
from tqdm import tqdm


# ==================== DÉPENDANCES (batch insert) ====================

def batch_insert_textes(textes_refs: dict):
    """textes_refs = {texte_uid: dossier_uid}"""
    if not textes_refs:
        return
    data = [{"uid": uid, "dossier_ref": dossier_uid} for uid, dossier_uid in textes_refs.items()]
    supabase.table("textes").upsert(data, on_conflict="uid", ignore_duplicates=True).execute()
    print(f"✅ {len(data)} textes traités (déjà existants ignorés)")


def batch_insert_organes(organe_uids: set):
    if not organe_uids:
        return
    data = [{"uid": uid} for uid in organe_uids]
    supabase.table("organes").upsert(data, on_conflict="uid", ignore_duplicates=True).execute()
    print(f"✅ {len(data)} organes traités (déjà existants ignorés)")


def chunk_list(lst, size=1000):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def fetch_all_paginated(query_fn, page_size: int = 1000) -> list:
    """Récupère toutes les lignes d'une requête Supabase via pagination (contourne la limite de 1000)."""
    result = []
    offset = 0
    while True:
        page = query_fn(offset, offset + page_size - 1)
        result.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    return result


def download_zip(url: str) -> zipfile.ZipFile:
    print(f"Téléchargement du ZIP depuis : {url}")
    response = requests.get(url)
    response.raise_for_status()
    return zipfile.ZipFile(io.BytesIO(response.content))


# ==================== CONNEXION SUPABASE ====================

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)


# ==================== PARSING ====================

def extraire_vote_refs_recursif(acte, result_list):
    """Extrait récursivement les voteRefs/voteRef de l'acte et de ses sous-actes."""
    vote_raw = acte.get("voteRefs") or acte.get("voteRef")
    if vote_raw:
        if isinstance(vote_raw, str):
            result_list.append(vote_raw)
        elif isinstance(vote_raw, dict):
            ref = vote_raw.get("voteRef")
            if ref:
                result_list.append(ref)
        elif isinstance(vote_raw, list):
            for item in vote_raw:
                if isinstance(item, dict):
                    ref = item.get("voteRef")
                    if ref:
                        result_list.append(ref)
                elif isinstance(item, str):
                    result_list.append(item)
    # Récursion sur enfants
    actes_legis = acte.get("actesLegislatifs")
    if actes_legis:
        enfants_raw = actes_legis.get("acteLegislatif", [])
        enfants = [enfants_raw] if not isinstance(enfants_raw, list) else enfants_raw
        for enfant in enfants:
            extraire_vote_refs_recursif(enfant, result_list)


def parser_acte(acte_data, dossier_uid, parent_uid=None):
    """Parse un acte et retourne liste de payloads (récursif pour enfants)."""
    payloads = []
    try:
        uid = acte_data.get("uid")
        code_acte = acte_data.get("codeActe")
        type_acte = acte_data.get("@xsi:type")
        organe_ref = acte_data.get("organeRef")
        libelle_acte = acte_data.get("libelleActe", {}).get("nomCanonique")

        # Nettoyage date ISO
        date_acte_raw = acte_data.get("dateActe")
        date_acte = None
        if date_acte_raw:
            try:
                cleaned = date_acte_raw.replace("Z", "+00:00")
                if "+" in cleaned:
                    cleaned = cleaned.split("+")[0] + "+00:00"
                date_acte = datetime.fromisoformat(cleaned).isoformat()
            except ValueError:
                date_acte = date_acte_raw

        statut_conclusion = (acte_data.get("statutConclusion") or acte_data.get("decision") or {}).get("libelle")

        # textes_associes : liste text[] — inclut TAP et BTA, exclut doublons
        try:
            textes_raw = acte_data.get("textesAssocies") or acte_data.get("texteAssocie")
            refs = []
            if textes_raw:
                if isinstance(textes_raw, dict):
                    nested = textes_raw.get("textesAssocies") or textes_raw.get("texteAssocie")
                    if nested:
                        textes_raw = nested
                items = [textes_raw] if not isinstance(textes_raw, list) else textes_raw
                for item in items:
                    if isinstance(item, dict):
                        ref = item.get("refTexteAssocie") or item.get("texteAssocie")
                        if ref:
                            refs.append(ref.strip().replace("»", ""))
                    elif isinstance(item, str):
                        refs.append(item.strip().replace("»", ""))
            textes_associes = refs if refs else None
        except Exception:
            textes_associes = None

        rapporteurs = acte_data.get("rapporteurs", {}) or None
        reunion_ref = acte_data.get("reunionRef")

        # vote_refs : liste text[] — déduplication, conserve tous les votes
        try:
            vote_refs_list: list[str] = []
            extraire_vote_refs_recursif(acte_data, vote_refs_list)
            vote_refs = sorted(set(vote_refs_list)) or None
        except Exception:
            vote_refs = None

        provenance = acte_data.get("provenance")
        texte_adopte = acte_data.get("texteAdopte")
        code_loi = acte_data.get("codeLoi")
        titre_loi = acte_data.get("titreLoi")
        # Fallback : dériver code_loi depuis l'UID texteAdopte (ex. LOI2025989 → 2025-989)
        if not code_loi and texte_adopte:
            m = re.match(r'^LOI(\d{4})(\d+)$', str(texte_adopte))
            if m:
                code_loi = f"{m.group(1)}-{int(m.group(2))}"

        autres_infos = {
            "depotInitialLectureDefinitiveRef": acte_data.get("depotInitialLectureDefinitiveRef"),
            "infoJO": acte_data.get("infoJO"),
            "urlEcheancierLoi": acte_data.get("urlEcheancierLoi"),
        }
        autres_infos = {k: v for k, v in autres_infos.items() if v is not None} or None

        payloads.append({
            "uid": uid,
            "dossier_uid": dossier_uid,
            "parent_uid": parent_uid,
            "code_acte": code_acte,
            "libelle_acte": libelle_acte,
            "organe_ref": organe_ref,
            "date_acte": date_acte,
            "type_acte": type_acte,
            "statut_conclusion": statut_conclusion,
            "textes_associes": textes_associes,
            "rapporteurs": rapporteurs,
            "reunion_ref": reunion_ref,
            "vote_refs": vote_refs,
            "provenance": provenance,
            "texte_adopte": texte_adopte,
            "code_loi": code_loi,
            "titre_loi": titre_loi,
            "autres_infos": autres_infos,
        })

        # Récursion sur enfants
        actes_legis = acte_data.get("actesLegislatifs")
        if actes_legis:
            enfants_raw = actes_legis.get("acteLegislatif", [])
            enfants = [enfants_raw] if not isinstance(enfants_raw, list) else enfants_raw
            for enfant in enfants:
                payloads.extend(parser_acte(enfant, dossier_uid, parent_uid=uid))

    except Exception as e:
        print(f"Erreur pour acte {acte_data.get('uid', 'inconnu')} dans dossier {dossier_uid}: {e}")

    return payloads


def importer_dossier(texte_data, file_name):
    """Parse un JSON dossier et extrait actes législatifs récursivement."""
    try:
        data = texte_data["dossierParlementaire"]
        dossier_uid = data.get("uid")
        actes_root = data.get("actesLegislatifs", {}).get("acteLegislatif", [])
        actes_root = [actes_root] if not isinstance(actes_root, list) else actes_root
        payloads = []
        for acte in actes_root:
            payloads.extend(parser_acte(acte, dossier_uid))
        return payloads
    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        return []


# ==================== UPSERT AVEC RETRY ====================

def upsert_avec_retry(chunks: list) -> tuple:
    """Upsert actes par batch avec retry automatique si timeout (split en 2)."""
    success = 0
    failed = 0
    i = 0
    with tqdm(total=sum(len(c) for c in chunks), desc="Upsert actes", unit="acte") as pbar:
        while i < len(chunks):
            chunk = chunks[i]
            try:
                supabase.table("actes_legislatifs").upsert(
                    chunk, on_conflict="uid,dossier_uid"
                ).execute()
                success += len(chunk)
                pbar.update(len(chunk))
                i += 1
            except Exception as e:
                err_str = str(e)
                if len(chunk) > 1 and ("57014" in err_str or "504" in err_str or "timeout" in err_str.lower()):
                    mid = len(chunk) // 2
                    chunks[i:i+1] = [chunk[:mid], chunk[mid:]]
                    pbar.total = sum(len(c) for c in chunks)
                    pbar.refresh()
                    tqdm.write(f"⚠️ Timeout, split batch en {mid} + {len(chunk)-mid}")
                else:
                    failed += len(chunk)
                    pbar.update(len(chunk))
                    tqdm.write(f"❌ Erreur batch {i+1} ({len(chunk)} actes) : {e}")
                    i += 1
    return success, failed


# ==================== IMPORT PRINCIPAL ====================

def importer_actes_from_zip(zip_ref: zipfile.ZipFile):
    # Filtre DLR directement à la construction de la liste
    json_files = [
        f for f in zip_ref.namelist()
        if f.startswith("json/dossierParlementaire/")
        and f.endswith(".json")
        and f.split("/")[-1].startswith("DLR")
    ]
    print(f"\n{len(json_files)} fichiers dossiers DLR trouvés dans le ZIP\n")

    all_payloads = []
    texte_refs: dict = {}
    organe_refs: set = set()

    # 1. Lecture + parsing (une seule passe)
    for file_name in tqdm(json_files, desc="Lecture & parsing", unit="fichier"):
        with zip_ref.open(file_name) as f:
            dossier_data = json.load(f)

        payloads = importer_dossier(dossier_data, file_name)
        if not payloads:
            continue

        # Déduplication par uid dans le dossier
        unique_payloads = {p["uid"]: p for p in payloads if p.get("uid")}
        payloads = list(unique_payloads.values())
        all_payloads.extend(payloads)

        # Collecte des dépendances pour batch insert
        dossier_uid = payloads[0]["dossier_uid"] if payloads else None
        for p in payloads:
            for t in (p.get("textes_associes") or []):
                if t not in texte_refs:
                    texte_refs[t] = dossier_uid
            if p.get("texte_adopte"):
                t = p["texte_adopte"]
                if t not in texte_refs:
                    texte_refs[t] = dossier_uid
            if p.get("organe_ref"):
                organe_refs.add(p["organe_ref"])
            if p.get("provenance"):
                organe_refs.add(p["provenance"])

    print(f"\nTotal actes à importer : {len(all_payloads)}")
    print(f"Textes uniques référencés : {len(texte_refs)}")
    print(f"Organes uniques référencés : {len(organe_refs)}")

    # 2. Insertion batch des dépendances
    batch_insert_textes(texte_refs)
    batch_insert_organes(organe_refs)

    # 3. Upsert batch des actes avec retry
    chunks = list(chunk_list(all_payloads, 1000))
    success, failed = upsert_avec_retry(chunks)

    print(f"\n{'='*60}")
    print(f"IMPORT ACTES TERMINÉ")
    print(f" Succès  : {success} actes")
    print(f" Échecs  : {failed} actes")
    print(f"{'='*60}")


# ==================== ENRICHISSEMENT vote_refs via reunion_ref ====================

# Motifs de titre qui identifient un vote final (et non un vote d'amendement)
DECISION_TITRE_PATTERNS = [
    "l'ensemble",
    "l'article unique",
    "commission mixte paritaire",
    "motion de rejet",
    "motion de renvoi",
]

# Libellés d'actes auxquels on veut relier des scrutins
DECISION_LIBELLES = [
    "Décision",
    "Décision de la CMP",
    "Conclusion du conseil constitutionnel",
]


_STOPWORDS = {
    "le", "la", "les", "de", "du", "des", "un", "une", "au", "aux",
    "en", "sur", "par", "pour", "et", "ou", "à", "l", "d", "que",
    "qui", "dans", "avec", "ce", "se", "est", "son", "sa", "ses",
    "sur", "une", "dont", "cette", "leur", "leurs", "tout", "plus",
}


def est_vote_decision(titre: str | None) -> bool:
    """Retourne True si le titre du scrutin correspond à un vote final (pas un amendement)."""
    if not titre:
        return False
    t = titre.lower()
    return any(p in t for p in DECISION_TITRE_PATTERNS)


def _tokenize(text: str) -> set[str]:
    """Extrait les mots significatifs d'un texte (≥4 chars, hors stopwords)."""
    mots = re.findall(r"[a-zàâäéèêëîïôùûüçœ]+", text.lower())
    return {m for m in mots if len(m) >= 4 and m not in _STOPWORDS}


def _score(titre_scrutin: str, titre_ref: str) -> int:
    """Nombre de tokens communs entre deux titres."""
    return len(_tokenize(titre_scrutin) & _tokenize(titre_ref))


def enrichir_vote_refs_via_reunion_ref():
    """Pour les actes DECISION sans vote_refs, peuple vote_refs via seance_ref = reunion_ref.
    - Séance avec 1 seul vote final → lien direct
    - Séance ambiguë (N votes finaux) → comparaison de titres pour trouver le bon scrutin"""
    print("\nEnrichissement vote_refs via reunion_ref (votes finaux uniquement)...")

    # 1. Charge tous les scrutins avec seance_ref + titre (pagination complète)
    scrutins_data = fetch_all_paginated(
        lambda s, e: supabase.table("scrutins")
        .select("uid, seance_ref, titre")
        .not_.is_("seance_ref", "null")
        .range(s, e)
        .execute()
        .data
    )
    # Carte uid → titre pour la comparaison
    scrutin_titre_map: dict[str, str] = {s["uid"]: (s.get("titre") or "") for s in scrutins_data}

    # Carte seance → liste des uids de votes finaux
    scrutin_by_seance: dict[str, list[str]] = {}
    for s in scrutins_data:
        if est_vote_decision(s.get("titre")):
            scrutin_by_seance.setdefault(s["seance_ref"], []).append(s["uid"])

    seances_uniques = {k for k, v in scrutin_by_seance.items() if len(v) == 1}
    seances_ambigues = {k: v for k, v in scrutin_by_seance.items() if len(v) > 1}
    print(f"  {len(scrutins_data)} scrutins chargés, {len(seances_uniques)} séances claires, {len(seances_ambigues)} ambiguës")

    # 2. Charge les actes DECISION sans vote_refs
    actes_data = (
        supabase.table("actes_legislatifs")
        .select("uid, dossier_uid, reunion_ref")
        .not_.is_("reunion_ref", "null")
        .is_("vote_refs", "null")
        .not_.is_("dossier_uid", "null")
        .in_("libelle_acte", DECISION_LIBELLES)
        .execute()
        .data
    )
    print(f"  {len(actes_data)} actes DECISION sans vote_refs avec reunion_ref")

    # 3. Charge les titres des dossiers pour les actes en séance ambiguë
    dossiers_uids_ambigus = list({
        a["dossier_uid"] for a in actes_data
        if a["reunion_ref"] in seances_ambigues
    })
    dossier_titre_map: dict[str, str] = {}
    for chunk in chunk_list(dossiers_uids_ambigus, 100):
        rows = supabase.table("dossiers_legislatifs").select("uid, titre").in_("uid", chunk).execute().data
        for d in rows:
            if d.get("titre"):
                dossier_titre_map[d["uid"]] = d["titre"]
    print(f"  {len(dossier_titre_map)} titres de dossiers chargés pour résolution des ambiguïtés")

    # 4. Construit les updates
    updates = []
    non_resolus = 0
    for a in actes_data:
        refs = scrutin_by_seance.get(a["reunion_ref"])
        if not refs:
            continue

        if len(refs) == 1:
            # Séance claire : lien direct
            updates.append({"uid": a["uid"], "dossier_uid": a["dossier_uid"], "vote_refs": refs})
            continue

        # Séance ambiguë : comparaison par titre
        titre_dossier = dossier_titre_map.get(a["dossier_uid"], "")
        if not titre_dossier:
            non_resolus += 1
            continue

        scores = sorted(
            [(ref, _score(scrutin_titre_map.get(ref, ""), titre_dossier)) for ref in refs],
            key=lambda x: x[1], reverse=True,
        )
        best_ref, best_score = scores[0]
        second_score = scores[1][1] if len(scores) > 1 else 0

        # Match retenu si score ≥ 3 mots en commun ET clairement meilleur que le suivant
        if best_score >= 3 and best_score > second_score:
            updates.append({"uid": a["uid"], "dossier_uid": a["dossier_uid"], "vote_refs": [best_ref]})
        else:
            non_resolus += 1

    print(f"  {len(updates)} actes enrichissables, {non_resolus} non résolus (ambiguïté persistante)")

    # 5. Update
    if updates:
        with tqdm(total=len(updates), desc="Enrichissement vote_refs", unit="acte") as pbar:
            for upd in updates:
                supabase.table("actes_legislatifs").update(
                    {"vote_refs": upd["vote_refs"]}
                ).eq("uid", upd["uid"]).eq("dossier_uid", upd["dossier_uid"]).execute()
                pbar.update(1)
        print(f"✅ {len(updates)} actes enrichis avec vote_refs via reunion_ref")
    else:
        print("  Aucun acte à enrichir")


# ==================== LIAISON TEXTES → ACTES PROM-PUB ====================

def lier_textes_prom_pub():
    """Lie les textes PROMULGUE aux actes PROM-PUB et DECAPP-PUB via textes_associes.

    Pour chaque texte avec statut_adoption='PROMULGUE', met à jour les actes
    PROM-PUB et DECAPP-PUB du même dossier dont textes_associes est encore null.
    Appelé après l'import des actes (les textes sont déjà en base à ce stade).
    """
    print(f"\n{'='*60}")
    print(f"   LIAISON TEXTES → ACTES PROM-PUB + DECAPP-PUB")
    print(f"{'='*60}")

    textes_prom = (
        supabase.table("textes")
        .select("uid, dossier_ref")
        .eq("statut_adoption", "PROMULGUE")
        .not_.is_("dossier_ref", "null")
        .execute()
        .data or []
    )

    nb_ok = 0
    nb_decapp_ok = 0
    nb_skip = 0
    for t in textes_prom:
        if not t.get("dossier_ref") or not t.get("uid"):
            nb_skip += 1
            continue
        supabase.table("actes_legislatifs").update(
            {"textes_associes": [t["uid"]]}
        ).eq("code_acte", "PROM-PUB").eq("dossier_uid", t["dossier_ref"]).is_(
            "textes_associes", "null"
        ).execute()
        nb_ok += 1
        supabase.table("actes_legislatifs").update(
            {"textes_associes": [t["uid"]]}
        ).eq("code_acte", "DECAPP-PUB").eq("dossier_uid", t["dossier_ref"]).is_(
            "textes_associes", "null"
        ).execute()
        nb_decapp_ok += 1

    print(f"   ✅ {nb_ok} actes PROM-PUB liés à leur texte PROMULGUE")
    print(f"   ✅ {nb_decapp_ok} actes DECAPP-PUB liés à leur texte PROMULGUE")
    if nb_skip:
        print(f"   ⚠️  {nb_skip} textes ignorés (dossier_ref ou uid manquant)")
    print(f"{'='*60}")


# ==================== EXÉCUTION ====================

if __name__ == "__main__":
    URL = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"
    zip_ref = download_zip(URL)
    importer_actes_from_zip(zip_ref)
    enrichir_vote_refs_via_reunion_ref()
    lier_textes_prom_pub()
    print("\nTout est terminé !")
