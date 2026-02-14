# import_actes_legislatifs_cloud.py
# Script pour importer tous les actes législatifs nested des JSON dossiers commençant par 'DLR' d'une URL AN dans Supabase table 'actes_legislatifs'.
# Exécute avec : python import_actes_legislatifs.py


import json
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import io
import zipfile
from tqdm import tqdm



def check_and_insert_texte(texte_uid: str, dossier_uid: str) -> bool:
    """Vérifie si un texte existe dans la table 'textes' ; si non, l'insère minimalement avec uid et dossier_ref. Retourne True si OK."""
    if not texte_uid:
        return True  # Rien à faire

    # Vérifie existence
    response = supabase.table("textes").select("uid").eq("uid", texte_uid).execute()
    if response.data:
        print(f"Texte {texte_uid} déjà existant pour dossier {dossier_uid}.")
        return True

    # Insertion minimale
    insert_data = {
        "uid": texte_uid,
        "dossier_ref": dossier_uid,
    }
    
    insert_response = supabase.table("textes").insert(insert_data).execute()
    if insert_response.data:
        print(f"Texte {texte_uid} inséré pour dossier {dossier_uid}.")
        return True
    else:
        error = getattr(insert_response, 'error', 'Erreur inconnue')
        print(f"Erreur insertion texte {texte_uid}: {error}")
        return False



def check_and_insert_organe(organe_uid: str) -> bool:
    """Vérifie si un organe existe dans 'organes' ; si non, l'insère minimalement avec uid."""
    if not organe_uid:
        return True

    # Vérifie existence
    response = supabase.table("organes").select("uid").eq("uid", organe_uid).execute()
    if response.data:
        print(f"Organe {organe_uid} déjà existant.")
        return True

    # Insertion minimale
    insert_data = {
        "uid": organe_uid,
        # Autres champs null par défaut
    }
    insert_response = supabase.table("organes").insert(insert_data).execute()
    if insert_response.data:
        print(f"Organe {organe_uid} inséré.")
        return True
    else:
        error = getattr(insert_response, 'error', 'Erreur inconnue')
        print(f"Erreur insertion organe {organe_uid}: {error}")
        return False
    

def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge le ZIP en mémoire depuis l'URL."""
    print(f"Téléchargement du ZIP depuis : {url}")
    response = requests.get(url)
    response.raise_for_status()
    return zipfile.ZipFile(io.BytesIO(response.content))


# Section : Chargement des variables d'environnement
# Charge les clés Supabase depuis .env.local pour se connecter à la base de données.
load_dotenv(dotenv_path="/Users/algodin/Documents/LoiClair website/loiclair/.env.local")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)


# Fonction helper pour extraire vote_refs de manière récursive (correction clé pour capturer les refs nichées)
def extraire_vote_refs_recursif(acte, result_list):
    """Extrait récursivement les voteRefs / voteRef de l'acte et de ses sous-actes.
    Gère str, dict, list, et négocie les formes variées (avec ou sans 's').
    """
    vote_raw = acte.get("voteRefs") or acte.get(
        "voteRef"
    )  # Tolérance : gère 'voteRef' sans 's' si rare
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
    # Récursion sur enfants (sous-actes)
    actes_legis = acte.get("actesLegislatifs")
    enfants = []
    if actes_legis:
        enfants_raw = actes_legis.get("acteLegislatif", [])
        if not isinstance(enfants_raw, list):
            enfants = [enfants_raw] if enfants_raw else []
        else:
            enfants = enfants_raw
    for enfant in enfants:
        extraire_vote_refs_recursif(enfant, result_list)


def parser_acte(acte_data, dossier_uid, parent_uid=None):
    """Parse un acte et insère dans Supabase (récursif pour enfants)."""
    payloads = []
    try:
        # Section : Extraction des champs basiques
        uid = acte_data.get("uid")
        code_acte = acte_data.get("codeActe")
        type_acte = acte_data.get("@xsi:type")  # xsi:type pour type_acte
        organe_ref = acte_data.get("organeRef")
        libelle_acte = acte_data.get("libelleActe", {}).get("nomCanonique")

        # date_acte : str ou datetime -> str ISO ou None
        date_acte_raw = acte_data.get("dateActe")
        date_acte = None
        if date_acte_raw:
            try:
                date_acte = datetime.fromisoformat(
                    date_acte_raw.replace("Z", "+00:00").split("+")[0]
                ).isoformat()
            except ValueError:
                date_acte = date_acte_raw  # Fallback str si non parsable

        statut_conclusion = acte_data.get("statutConclusion", {}).get("libelle")

        # textes_associes : normalisé en string simple (exclut TAP, extrait refTexteAssocie ou texteAssocie, prend le premier si multiple)
        textes_raw = acte_data.get("textesAssocies") or acte_data.get("texteAssocie")
        refs = []
        if textes_raw:
            # Gestion nesting : si dict avec 'texteAssocie' ou 'textesAssocies', descend dedans
            if isinstance(textes_raw, dict):
                nested = textes_raw.get("texteAssocie") or textes_raw.get(
                    "textesAssocies"
                )
                if nested:
                    textes_raw = nested  # Remplace par le contenu nested
            # Normalise en list pour boucler uniformément
            items = [textes_raw] if not isinstance(textes_raw, list) else textes_raw
            for item in items:
                if isinstance(item, dict):
                    if item.get("typeTexte") == "TAP":
                        continue  # Exclure TAP
                    ref = item.get("refTexteAssocie") or item.get(
                        "texteAssocie"
                    )  # Tolérance : ajoute 'texteAssocie' si rare
                    if ref:
                        refs.append(ref.strip().replace("»", ""))  # Nettoie
                elif isinstance(item, str):
                    refs.append(item.strip().replace("»", ""))
        # Si refs vide, set à None ; sinon, prend le premier ref comme string simple (un seul attendu)
        textes_associes = refs[0] if refs else None

        # rapporteurs : dict ou None -> JSONB
        rapporteurs = acte_data.get("rapporteurs", {}) or None
        reunion_ref = acte_data.get("reunionRef")

        # vote_refs : extraction récursive (correction pour capturer sous-actes)
        vote_refs = []
        extraire_vote_refs_recursif(acte_data, vote_refs)
        vote_refs = sorted(list(set(vote_refs)))
        vote_refs = vote_refs[0] if len(vote_refs) == 1 else None

        provenance = acte_data.get(
            "provenance"
        )  # Ref organe ? (ex. UID pour FK vers table organes)
        texte_adopte = acte_data.get(
            "texteAdopte"
        )  # Ref texte (ex. UID pour FK vers table textes)
        autres_infos = {
            "depotInitialLectureDefinitiveRef": acte_data.get(
                "depotInitialLectureDefinitiveRef"
            ),
            "infoJO": acte_data.get("infoJO"),
            "urlEcheancierLoi": acte_data.get("urlEcheancierLoi"),
            "codeLoi": acte_data.get("codeLoi"),
            "titreLoi": acte_data.get("titreLoi"),
            # Ajoute d'autres si besoin
        }
        autres_infos = {k: v for k, v in autres_infos.items() if v is not None}

        data_insert = {
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
            "autres_infos": {
                k: v for k, v in autres_infos.items() if v is not None
            },  # Clean None
        }
        payloads.append(data_insert)

        # Section : Gestion récursive des enfants
        actes_legis = acte_data.get("actesLegislatifs")
        enfants = []
        if actes_legis:
            enfants_raw = actes_legis.get("acteLegislatif", [])
            enfants = (
                [enfants_raw] if not isinstance(enfants_raw, list) else enfants_raw
            )
        for enfant in enfants:
            payloads.extend(parser_acte(enfant, dossier_uid, parent_uid=uid))

    except Exception as e:
        print(
            f"Erreur pour acte {acte_data.get('uid', 'inconnu')} dans dossier {dossier_uid}: {e}"
        )

    return payloads


def importer_dossier(texte_data, file_name):
    """Parse un JSON dossier et extrait actes législatifs récursivement, retourne liste de payloads."""
    try:
        data = texte_data["dossierParlementaire"]
        dossier_uid = data.get("uid")
        actes_root = data.get("actesLegislatifs", {}).get("acteLegislatif", [])
        actes_root = [actes_root] if not isinstance(actes_root, list) else actes_root
        payloads = []
        for acte in actes_root:
            payloads.extend(parser_acte(acte, dossier_uid))  # Racines sans parent
        #print(
        #    f"{len(payloads)} actes extraits pour dossier {dossier_uid} depuis {file_name}."
        #)
        return payloads
    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        return []


def importer_actes_from_zip(zip_ref: zipfile.ZipFile):
    """Importe TOUS les actes des dossiers du ZIP en batch + barre de progression."""
    json_files = [
        f
        for f in zip_ref.namelist()
        if f.startswith("json/dossierParlementaire/") and f.endswith(".json")
    ]

    print(f"\n{len(json_files)} fichiers dossiers trouvés dans le ZIP\n")

    success = 0
    failed = 0

    for file_name in tqdm(json_files, desc="Import actes", unit="fichier"):
        try:
            with zip_ref.open(file_name) as f:
                dossier_data = json.load(f)

            # Filtre : skip si pas 'DLR'
            if not file_name.split("/")[-1].startswith("DLR"):
                continue

            payloads = importer_dossier(dossier_data, file_name)
            if not payloads:
                continue

            # Upsert avec retry si FK error
            max_retry = 3  # Pour couvrir multiples manques
            attempt = 0
            while attempt <= max_retry:
                try:
                    response = supabase.table("actes_legislatifs").upsert(payloads, on_conflict="uid").execute()
                    if response.data:
                        success += len(payloads)
                        break  # Succès
                    else:
                        error = getattr(response, 'error', {})
                        # Gère si response.error sans exception
                        if error.get('code') == '23503':
                            details = error.get('details', '')
                            import re
                            if 'texte_adopte' in details:
                                match = re.search(r'$$   texte_adopte   $$=$$   (.*?)   $$', details)
                                if match:
                                    texte_uid = match.group(1)
                                    dossier_uid = payloads[0]['dossier_uid']
                                    if check_and_insert_texte(texte_uid, dossier_uid):
                                        print(f"Retry upsert pour {file_name} après insertion de texte {texte_uid}.")
                                        attempt += 1
                                        continue
                            elif 'organe_ref' in details:
                                match = re.search(r'$$   organe_ref   $$=$$   (.*?)   $$', details)
                                if match:
                                    organe_uid = match.group(1)
                                    if check_and_insert_organe(organe_uid):
                                        print(f"Retry upsert pour {file_name} après insertion d'organe {organe_uid}.")
                                        attempt += 1
                                        continue
                        print(f"Erreur non-retryable pour {file_name}: {error}")
                        failed += len(payloads)
                        break
                except Exception as upsert_error:
                    error_msg = str(upsert_error)
                    print(f"Debug: Erreur brute capturée : {error_msg}")  # Pour voir exactement le format
                    import re
                    if '23503' in error_msg:
                        if 'texte_adopte' in error_msg:
                            # Regex adaptée au string complet de l'exception (souvent inclut 'Key (texte_adopte)=(UID)...')
                            match = re.search(r'Key \(texte_adopte\)=\((.*?)\)', error_msg)
                            if match:
                                texte_uid = match.group(1)
                                dossier_uid = payloads[0]['dossier_uid']
                                print(f"Debug: Texte UID extrait : {texte_uid}")
                                if check_and_insert_texte(texte_uid, dossier_uid):
                                    print(f"Retry upsert pour {file_name} après insertion de texte {texte_uid}.")
                                    attempt += 1
                                    continue
                            else:
                                print(f"Debug: Regex n'a pas matché pour texte_adopte dans {error_msg}")
                        elif 'organe_ref' in error_msg:
                            match = re.search(r'Key \(organe_ref\)=\((.*?)\)', error_msg)
                            if match:
                                organe_uid = match.group(1)
                                print(f"Debug: Organe UID extrait : {organe_uid}")
                                if check_and_insert_organe(organe_uid):
                                    print(f"Retry upsert pour {file_name} après insertion d'organe {organe_uid}.")
                                    attempt += 1
                                    continue
                            else:
                                print(f"Debug: Regex n'a pas matché pour organe_ref dans {error_msg}")

                    print(f"Erreur upsert exception pour {file_name}: {upsert_error}")
                    failed += len(payloads)
                    break

        except Exception as e:
            failed += 1
            print(f"Erreur générale pour {file_name}: {e}")

    print(f"\n{'='*60}")
    print(f"IMPORT ACTES TERMINÉ")
    print(f"   Succès  : {success}")
    print(f"   Échecs  : {failed}")
    print(f"{'='*60}")


# Section : Exécution principale
if __name__ == "__main__":
    URL = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"
    zip_ref = download_zip(URL)
    importer_actes_from_zip(zip_ref)
    print("\nTout est terminé !")
