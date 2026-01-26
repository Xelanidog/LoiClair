# import_textes.py
# Script pour importer tous les JSON textes d'un dossier dans Supabase table 'textes'.
# Optimisé : Tolérant aux erreurs (skip invalides, defaults None), gère lists/None.
# Importe TOUS les JSON, même si champs manquent (ex. dossier_ref).
# Liens HTML pour TOUS (AN, avec patterns étendus) ; PDF à None.
# Exécute avec : python import_textes.py
# Attention : Adapte le chemin dossier_textes si besoin.
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv
# Charger env vars de .env.local
load_dotenv(dotenv_path='/Users/algodin/Documents/LoiClair website/loiclair/.env.local')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)
def reconstruire_liens_texte(uid):
    """Reconstruit liens HTML via uid (force AN pour tous patterns). PDF à None."""
    if uid is None:
        return None, None
    # Patterns étendus pour couvrir tous AN - 
    # A FAIRE - TROUVER LES LIENS POUR DOC SENAT 'AVISSNR''PIONSNR','RAPPSNR''PRJLSNR'
    # A FAIRE - Trouver les liens pour 
    if uid.startswith(('PIONANR', 'RIONANR', 'ACINANR', 'ETDIANR', 'ALCNANR',  'AVISANR', 'LETTANR', 'DECLANR', 'AVCEANR', 'PNREANR', 'RINFANR', 'RAPPANR', 'PRJLANR', 'MIONANR', )):
        lien_html = f"https://www.assemblee-nationale.fr/dyn/opendata/{uid}.html"
    else:
        lien_html = None
    return lien_html
def importer_texte(file_path):
    """Parser un JSON texte et insérer dans table 'textes' (tolérant aux erreurs)."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
        # Gestion si raw_data est list
        if isinstance(raw_data, list):
            if raw_data:
                raw_data = raw_data[0] # Prend le premier élément
            else:
                print(f"Fichier {file_path} est une list vide, skip.")
                return
        texte = raw_data.get('document', {})
        if not texte or not isinstance(texte, dict):
            print(f"Fichier {file_path} invalide (pas de 'document' dict), skip.")
            return
        uid = texte.get('uid')
        if not uid:
            print(f"Fichier {file_path} sans uid, skip.")
            return
        lien_html = reconstruire_liens_texte(uid)
        # Extraction et normalisation majuscule pour titre_principal (première lettre majuscule)
        titre_principal = texte.get('titres', {}).get('titrePrincipal') if texte.get('titres') else None
        if titre_principal:
            titre_principal = titre_principal.capitalize()
        # Déduction libelle_statut_adoption (mapping simple ; ajuste si besoin)
        classification = texte.get('classification', {})
        statut_adoption = classification.get('statutAdoption')
        libelle_statut = {
            'ADOPTSEANCE': 'Adopté en séance',
            'ADOPTCOM': 'Adopté en comission',
            'REJETSEANCE': 'Rejeté en séance',
            # Ajoute d'autres mappings si tu en as
        }.get(statut_adoption, 'Non défini')
        # Extraction depot code/libelle (de classification.famille.depot)
        famille = classification.get('famille', {})
        depot = famille.get('depot', {})
        depot_code = depot.get('code') if depot else None
        depot_libelle = depot.get('libelle') if depot else None
        # Auteurs et organe (gestion si list ou dict ou None)
        auteurs = texte.get('auteurs', {})
        if isinstance(auteurs, list):
            auteurs = auteurs[0] if auteurs else {}
        elif auteurs is None:
            auteurs = {}
        organe_auteur_ref = auteurs.get('auteur', {}).get('organe', {}).get('organeRef') if isinstance(auteurs.get('auteur', {}), dict) else None
        # Extraction list de tous les auteurs (acteurRef) en jsonb
        auteurs_list = auteurs.get('auteur', []) if isinstance(auteurs.get('auteur'), list) else [auteurs.get('auteur')] if auteurs.get('auteur') else None
        auteurs_refs = [auteur.get('acteur', {}).get('acteurRef') for auteur in auteurs_list if isinstance(auteur, dict) and auteur.get('acteur')]
        data = {
            'uid': uid, # Déjà safe, uid est vérifié avant
            'lien_html': lien_html, # Déjà safe de reconstruire_liens_texte
            'titre_principal': titre_principal,
            'legislature': int(texte.get('legislature')) if texte.get('legislature') else None, # Déjà géré
            'date_creation': texte.get('cycleDeVie', {}).get('chrono', {}).get('dateCreation') if texte.get('cycleDeVie') else None, # Déjà géré
            'date_depot': texte.get('cycleDeVie', {}).get('chrono', {}).get('dateDepot') if texte.get('cycleDeVie') else None, # Déjà géré
            'date_publication': texte.get('cycleDeVie', {}).get('chrono', {}).get('datePublication') if texte.get('cycleDeVie') else None, # Déjà géré
            'denomination': texte.get('denominationStructurelle') if texte.get('denominationStructurelle') else None, # Ajouté else None pour safe
            'provenance': texte.get('provenance', 'AN') if texte.get('provenance') else 'AN', # Default 'AN' si absent
            'dossier_ref': texte.get('dossierRef') if texte.get('dossierRef') else None, # Nullable, déjà safe
            'classification': classification if classification else None, # Ajouté check (déjà variable)
            'statut_adoption': statut_adoption if statut_adoption else None, # Ajouté check (déjà variable)
            'libelle_statut_adoption': libelle_statut if libelle_statut else None, # Ajouté check (déjà variable)
            'num_notice': texte.get('notice', {}).get('numNotice') if texte.get('notice') else None, # Ajouté check sur notice
            'organe_auteur_ref': organe_auteur_ref if organe_auteur_ref else None, # Ajouté check (déjà variable)
            'organe_referent_ref': texte.get('organesReferents', {}).get('organeRef') if texte.get('organesReferents') else None, # Ajouté check sur organesReferents
            'depot_amendements': texte.get('depotAmendements') if texte.get('depotAmendements') else None, # Ajouté else None
            'refs_brutes': texte.get('cycleDeVie') if texte.get('cycleDeVie') else None, # Ajouté else None
            'depot_code': depot_code,
            'depot_libelle': depot_libelle,
            'auteurs_refs': auteurs_refs,
        }
        response = supabase.table('textes').upsert(data, on_conflict='uid').execute()
        if response.data:
            print(f"Texte {uid} importé avec succès depuis {file_path}.")
        else:
            print(f"Erreur import texte {uid}: {response.error}")
    except Exception as e:
        print(f"Erreur générale pour {file_path}: {e}")

def importer_textes_from_dir(dossier_textes):
    """Boucle sur tous les JSON dans le dossier et importe."""
    for filename in os.listdir(dossier_textes):
        if filename.endswith('.json'):
            file_path = os.path.join(dossier_textes, filename)
            importer_texte(file_path)

# Exécution
if __name__ == "__main__":
    dossier_textes = '/Users/algodin/Documents/LoiClair website/Data brute/AN-Jan2026/Dossiers législatifs/document'
    importer_textes_from_dir(dossier_textes)