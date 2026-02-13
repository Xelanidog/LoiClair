# import_organes.py
# Script pour importer tous les JSON organes commençant par 'PO' d'un dossier dans Supabase table 'organes'.
# Optimisé : Tolérant aux erreurs (skip invalides, defaults None), gère dicts/None.
# Importe TOUS les JSON filtrés, même si champs manquent.
# Correction : Gère viMoDe comme dict (dates en str ou None), secretariat comme dict, liste_pays comme dict entier (pour JSONB).
# Ajouts : Conversion en int pour nombre_reunions_annuelles/preseance (si str, fallback None si non numérique).
# Exécute avec : python import_organes.py
# Attention : Adapte le chemin dossier_organes si besoin.

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

def importer_organe(file_path):
    """Parse et importe un JSON organe dans Supabase."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)['organe']
        
        # Champs basiques (safe avec .get(), defaults None)
        uid = data.get('uid')
        code_type = data.get('codeType')
        libelle = data.get('libelle')
        libelle_edition = data.get('libelleEdition')
        libelle_abrege = data.get('libelleAbrege')
        libelle_abrev = data.get('libelleAbrev')
        
        # viMoDe : extraire dates (str ou None)
        vi_mode = data.get('viMoDe', {})
        date_debut = vi_mode.get('dateDebut')
        date_agrement = vi_mode.get('dateAgrement')
        date_fin = vi_mode.get('dateFin')
        
        # Autres champs basiques
        organe_parent = data.get('organeParent')
        chambre = data.get('chambre')
        regime = data.get('regime')
        legislature = data.get('legislature')
        
        # Secretariat : extraire secretaires (str ou None)
        secretariat = data.get('secretariat', {})
        secretaire_01 = secretariat.get('secretaire01')
        secretaire_02 = secretariat.get('secretaire02')
        
        # Champs spécifiques (optionnels)
        regime_juridique = data.get('regimeJuridique')
        site_internet = data.get('siteInternet')
        
        # Nombre reunions annuelles : convertir str -> int (si numérique, else None)
        nombre_reunions_annuelles_raw = data.get('nombreReunionsAnnuelles')
        try:
            nombre_reunions_annuelles = int(nombre_reunions_annuelles_raw) if nombre_reunions_annuelles_raw else None
        except (ValueError, TypeError):
            nombre_reunions_annuelles = None
        
        # Preseance : convertir str -> int (si numérique, else None)
        preseance_raw = data.get('preseance')
        try:
            preseance = int(preseance_raw) if preseance_raw else None
        except (ValueError, TypeError):
            preseance = None
        
        organe_precedent_ref = data.get('organePrecedentRef')
        
        # Liste pays : stocker objet entier comme dict (pour JSONB, None si absent)
        liste_pays = data.get('listePays')
        
        # Dict pour upsert (tous champs mappés)
        data_insert = {
            'uid': uid,
            'code_type': code_type,
            'libelle': libelle,
            'libelle_edition': libelle_edition,
            'libelle_abrege': libelle_abrege,
            'libelle_abrev': libelle_abrev,
            'date_debut': date_debut,
            'date_agrement': date_agrement,
            'date_fin': date_fin,
            'organe_parent': organe_parent,
            'chambre': chambre,
            'regime': regime,
            'legislature': legislature,
            'secretaire_01': secretaire_01,
            'secretaire_02': secretaire_02,
            'regime_juridique': regime_juridique,
            'site_internet': site_internet,
            'nombre_reunions_annuelles': nombre_reunions_annuelles,
            'preseance': preseance,
            'organe_precedent_ref': organe_precedent_ref,
            'liste_pays': liste_pays,  # Dict pour JSONB
        }
        
        # Upsert (sur uid)
        response = supabase.table('organes').upsert(data_insert, on_conflict='uid').execute()
        if response.data:
            print(f"Organe {uid} importé avec succès depuis {file_path}.")
        else:
            print(f"Erreur import organe {uid}: {response.error}")
    
    except Exception as e:
        print(f"Erreur générale pour {file_path}: {e}")
        import traceback
        traceback.print_exc()

def importer_organes_from_dir(dossier_organes):
    """Boucle sur tous les JSON commençant par 'PO' dans le dossier et importe."""
    for filename in os.listdir(dossier_organes):
        if filename.startswith('PO') and filename.endswith('.json'):
            file_path = os.path.join(dossier_organes, filename)
            importer_organe(file_path)

# Exécution
if __name__ == "__main__":
    dossier_organes = '/Users/algodin/Documents/LoiClair website/Data brute/AN-Jan2026/Organes'
    importer_organes_from_dir(dossier_organes)