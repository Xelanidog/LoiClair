# import_dossiers.py
# Script pour importer TOUS les JSON dossiers législatifs (AN Jan 2026) dans Supabase table 'dossiers_legislatifs'
# Version consolidée et corrigée : ultra-robuste, gère tous les cas tordus (list/dict/None), initiateurs multiples, extraction refs textes/votes et statut/prom.
# Exécute avec : python import_dossiers.py
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import io
import zipfile
from tqdm import tqdm



# Charger .env.local
load_dotenv(dotenv_path='/Users/algodin/Documents/LoiClair website/loiclair/.env.local')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)

# ===================================================================
# Fonctions utilitaires
# ===================================================================
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
        if key in ['texteAssocie', 'texteAdopte']:
            textes_associes = actes.get('textesAssocies')
            if textes_associes:
                extraire_refs_recursif(textes_associes, key, result_set, 'refTexteAssocie')
        
        # Récursion sur sous-actes (normalisé comme dans version fonctionnelle)
        sous = actes.get('actesLegislatifs')
        if sous is not None:
            extraire_refs_recursif(sous.get('acteLegislatif'), key, result_set, sub_key)

def extraire_statut_final_et_prom(actes):
    """Extrait statut_final, date_promulgation, code_loi, titre_loi, url_legifrance de façon ultra-robuste."""
    statut_final = 'en_cours'
    date_promulgation = None
    code_loi = None
    titre_loi = None
    url_legifrance = None
    if actes is None:
        return statut_final, date_promulgation, code_loi, titre_loi, url_legifrance
    # Normalisation : on veut toujours une liste d'actes
    if isinstance(actes, dict):
        actes = actes.get('acteLegislatif') or []
    if not isinstance(actes, list):
        actes = [actes] if actes else []
    for acte in actes:
        if not isinstance(acte, dict):
            continue
        code_acte = acte.get('codeActe')
        # === Cas PROM (promulgation) ===
        if code_acte == 'PROM':
            statut_final = 'promulguee'
            sub = acte.get('actesLegislatifs')
            # Gestion ultra-robuste du sous-acte PROM (peut être dict, list, ou dict dans dict)
            prom = {}
            if sub is not None:
                if isinstance(sub, dict):
                    prom = sub.get('acteLegislatif', {})
                elif isinstance(sub, list) and sub:
                    prom = sub[0] if isinstance(sub[0], dict) else {}
            if not isinstance(prom, dict):
                prom = {}
            date_promulgation = prom.get('dateActe')
            code_loi = prom.get('codeLoi')
            titre_loi = prom.get('titreLoi')
            url_legifrance = prom.get('infoJO', {}).get('urlLegifrance')
        # === Cas DEC adoptée ou rejetée ===
        elif code_acte == 'DEC':
            conclusion = acte.get('statutConclusion', {})
            libelle = conclusion.get('libelle', '').lower()
            fam_code = conclusion.get('fam_code', '')
            if fam_code in ['TSORTF01', 'TSORTF18'] or 'adopté' in libelle:
                statut_final = 'adoptee'
            elif 'rejet' in libelle:
                statut_final = 'rejetee'
        # Récursion sur sous-actes (normalisé comme dans version fonctionnelle)
        sous_actes = acte.get('actesLegislatifs')
        if sous_actes is not None:
            sub_statut, sub_date, sub_code, sub_titre, sub_url = extraire_statut_final_et_prom(sous_actes.get('acteLegislatif'))
            if sub_statut != 'en_cours':
                statut_final = sub_statut
                date_promulgation = sub_date or date_promulgation
                code_loi = sub_code or code_loi
                titre_loi = sub_titre or titre_loi
                url_legifrance = sub_url or url_legifrance
    return statut_final, date_promulgation, code_loi, titre_loi, url_legifrance

def ajouter_acteur_si_manquant(uid_acteur):
    """Ajoute un acteur manquant avec placeholders si absent (pour éviter FK violations)."""
    if not uid_acteur:
        return
    response = supabase.table('acteurs').select('uid').eq('uid', uid_acteur).execute()
    if not response.data:
        payload_acteur = {
            'uid': uid_acteur,
            'nom': 'Inconnu',  # Placeholder
            'prenom': 'Inconnu',  # Placeholder
            # Ajoute d'autres colonnes obligatoires avec defaults/None
        }
        supabase.table('acteurs').insert(payload_acteur).execute()
        print(f"Acteur {uid_acteur} ajouté avec placeholders.")

        
# ===================================================================
# Téléchargement du ZIP
# ===================================================================
def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge le ZIP en mémoire depuis l'URL et renvoie l'objet ZipFile ouvert.
    Gère les erreurs HTTP pour robustesse.
    """
    response = requests.get(url)
    response.raise_for_status()  # Lève une exception si code HTTP != 200 (ex. : lien mort)
    return zipfile.ZipFile(io.BytesIO(response.content))  # Tout en RAM pour éviter I/O disque

# ===================================================================
# Boucle sur les JSON du ZIP
# ===================================================================
def importer_dossiers_from_zip(zip_ref: zipfile.ZipFile, dossier_prefix: str = 'json/dossierParlementaire/'):
    """Boucle sur tous les .json dans le dossier spécifique du ZIP, filtre et traite par lots pour RAM/perf.
    dossier_prefix : pour cibler 'json/dossierParlementaire/' basé sur ton namelist().
    """

    success = 0
    failed = 0

    json_files = [f for f in zip_ref.namelist() if f.startswith(dossier_prefix) and f.endswith('.json')]
    print(f"Nombre total de JSON à traiter : {len(json_files)}")
    
    batch_size = 500  # Upsert par lots pour éviter timeouts Supabase ; ajuste si besoin
    batch = []
    for idx, file_path in enumerate(tqdm(json_files, desc="Import dossiers législatifs", unit="dossier")):
        with zip_ref.open(file_path) as json_stream:  # Ouverture en mémoire
            dossier_data = json.load(json_stream)  # Charge le JSON
            payload = importer_dossier(dossier_data, file_path)
            if payload is not None:
                batch.append(payload)
                success += 1
            else:
                failed += 1
            if idx % 100 == 0: tqdm.write(f"Traité {idx}/{len(json_files)}")

            if len(batch) >= batch_size or idx == len(json_files) - 1:
                if batch:  # Seulement si non vide
                    response = supabase.table('dossiers_legislatifs').upsert(batch, on_conflict='uid').execute()
                    if response.data:
                        print(f"✅ Batch de {len(batch)} dossiers importé")
                    else:
                        print(f"❌ Erreur Supabase sur batch : {response.error}")
                    batch = []  # Vide pour le prochain
    
                    print(f"\n{'='*50}")
                    print(f"IMPORT TERMINÉ")
                    print(f"   Succès : {success}")
                    print(f"   Échecs  : {failed}")
                    print(f"   Total   : {success + failed}")
                    print(f"{'='*50}")

# ===================================================================
# Import d'un seul dossier
# ===================================================================
def importer_dossier(data: dict, file_path: str = "unknown.json"):

    try:
        dossier = data.get('dossierParlementaire', {})
        if not dossier:
            print(f"⚠️  Format invalide → {file_path}")
            return None

        uid = dossier.get('uid')
        if not uid:
            print(f"⚠️  UID manquant → {file_path}")
            return None
        
        dossier = data.get('dossierParlementaire', {})
        if not dossier:
            print(f"Format invalide (pas de dossierParlementaire) → skip {uid if 'uid' in dossier else 'inconnu'}")
            return
        uid = dossier.get('uid')
        legislature = int(dossier.get('legislature')) if dossier.get('legislature') else None
        titre_dossier = dossier.get('titreDossier') or {}
        titre = titre_dossier.get('titre')
        titre_chemin = titre_dossier.get('titreChemin')
        senat_chemin = titre_dossier.get('senatChemin')
        procedure = dossier.get('procedureParlementaire') or {}
        procedure_code = procedure.get('code')
        procedure_libelle = procedure.get('libelle')
        initiateur = dossier.get('initiateur') or {}
        # Acteurs (gère liste multiple)
        acteurs_data = initiateur.get('acteurs') or {}
        acteurs_list = acteurs_data.get('acteur') or []
        if not isinstance(acteurs_list, list):
            acteurs_list = [acteurs_list] if acteurs_list else []
        # Premier comme initiateur principal
        initiateur_acteur_ref = None
        initiateur_mandat_ref = None
        if acteurs_list:
            premier = acteurs_list[0] if isinstance(acteurs_list[0], dict) else {}
            initiateur_acteur_ref = premier.get('acteurRef')
            initiateur_mandat_ref = premier.get('mandatRef')
        # Reste comme co-auteurs (liste de dicts pour refs)
        co_auteurs = []
        for acteur in acteurs_list[1:]:  # Skip le premier
            if isinstance(acteur, dict):
                co_auteurs.append({
                    'acteurRef': acteur.get('acteurRef'),
                    'mandatRef': acteur.get('mandatRef')
                })
        # Organes (inchangé, par sécurité)
        organes_data = initiateur.get('organes') or {}
        organe = organes_data.get('organe') or {}
        if isinstance(organe, list) and organe:
            organe = organe[0] if isinstance(organe[0], dict) else {}
        if not isinstance(organe, dict):
            organe = {}
        organe_ref = organe.get('organeRef') or {}
        initiateur_organe_ref = organe_ref.get('uid') if isinstance(organe_ref, dict) else organe_ref
        # Ajoute acteurs manquants (principal + co-auteurs)
        ajouter_acteur_si_manquant(initiateur_acteur_ref)
        for co in co_auteurs:
            ajouter_acteur_si_manquant(co['acteurRef'])
        actes_raw = dossier.get('actesLegislatifs') or {}
        actes_legislatifs = actes_raw.get('acteLegislatif') if actes_raw else None  # Aligné sur version fonctionnelle
        if actes_legislatifs is None:
            actes_legislatifs = []
        fusion_dossier = dossier.get('fusionDossier')
        # Extraction textes et votes
        textes_set = set()
        votes_set = set()
        extraire_refs_recursif(actes_legislatifs, 'texteAssocie', textes_set)
        extraire_refs_recursif(actes_legislatifs, 'texteAdopte', textes_set)
        extraire_refs_recursif(actes_legislatifs, 'voteRefs', votes_set, 'voteRef')
        textes_associes_refs = list(textes_set)
        votes_refs = list(votes_set)
        # Statut final & promulgation
        statut_final, date_promulgation, code_loi, titre_loi, url_legifrance = extraire_statut_final_et_prom(actes_legislatifs)
        # Lien AN
        lien_an = reconstruire_lien_an(legislature, titre_chemin)
        # Préparation payload Supabase
        payload = {
            "uid": uid,
            "legislature": legislature,
            "titre": titre,
            "titre_chemin": titre_chemin,
            "senat_chemin": senat_chemin,
            "procedure_code": procedure_code,
            "procedure_libelle": procedure_libelle,
            "initiateur_acteur_ref": initiateur_acteur_ref,
            "initiateur_mandat_ref": initiateur_mandat_ref,
            "initiateur_organe_ref": initiateur_organe_ref,
            "co_auteurs": json.dumps(co_auteurs) if co_auteurs else None,  # JSONB pour co-auteurs
            "actes_legislatifs": json.dumps(actes_legislatifs, ensure_ascii=False) if actes_legislatifs else '[]',
            "fusion_dossier": json.dumps(fusion_dossier) if fusion_dossier else None,
            "statut_final": statut_final,
            "date_promulgation": date_promulgation,
            "code_loi": code_loi,
            "titre_loi": titre_loi,
            "url_legifrance": url_legifrance,
            "textes_associes_refs": textes_associes_refs,
            "votes_refs": votes_refs,
            "lien_an": lien_an,
        }

        return payload

    except Exception as e:
        print(f"🔥 ERREUR CRITIQUE dans {file_path}")
        print(f"   → {type(e).__name__}: {e}")
        return None


# ===================================================================
# Exécution
# ===================================================================

if __name__ == "__main__":
    URL_DOSSIERS = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"
    zip_ref = download_zip(URL_DOSSIERS); print(zip_ref.namelist()[:5])
    importer_dossiers_from_zip(zip_ref)
    print("Import terminé !")