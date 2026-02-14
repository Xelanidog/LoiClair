# import_acteurs_organes_cloud.py
# Script combiné pour importer acteurs (PA*) et organes (PO*) depuis un ZIP distant (url AN) vers Supabase.
# Exécute avec : python import_acteurs_organes_cloud.py

import json
import os
import requests
import io
import zipfile
from supabase import create_client, Client
from dotenv import load_dotenv
from tqdm import tqdm
import traceback
from datetime import date  # Pour calcul âge dans acteurs

# ===================================================================
# Téléchargement du ZIP (comme pour les textes)
# ===================================================================
def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge le ZIP en mémoire depuis l'URL."""
    print(f"Téléchargement du ZIP depuis : {url}")
    response = requests.get(url)
    response.raise_for_status()  # Erreur si lien mort
    return zipfile.ZipFile(io.BytesIO(response.content))

# Charger env vars de .env.local
load_dotenv(dotenv_path='/Users/algodin/Documents/LoiClair website/loiclair/.env.local')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")

supabase: Client = create_client(supabase_url, supabase_key)

# ===================================================================
# Fonctions de parsing (adaptées des scripts originaux)
# ===================================================================

def importer_acteur(acteur_data, file_name):
    """Parse un JSON acteur et retourne dict pour upsert (basé sur import_acteurs.py)."""
    try:
        data = acteur_data['acteur']
        
        # Champs basiques (safe)
        uid = data['uid'].get('#text') if isinstance(data['uid'], dict) else data['uid']
        ident = data['etatCivil']['ident']
        civ = ident.get('civ') if isinstance(ident, dict) else None
        prenom = ident.get('prenom') if isinstance(ident, dict) else None
        nom = ident.get('nom') if isinstance(ident, dict) else None
        alpha = ident.get('alpha') if isinstance(ident, dict) else None
        
        # Trigramme : gère dict xsi:nil ou str
        trigramme_raw = ident.get('trigramme') if isinstance(ident, dict) else None
        if isinstance(trigramme_raw, dict):
            trigramme = trigramme_raw.get('#text') if not trigramme_raw.get('@xsi:nil') else None
        else:
            trigramme = trigramme_raw if isinstance(trigramme_raw, str) else None
        
        # Date naissance et sous-champs : gère dict xsi:nil ou str
        info_naissance = data['etatCivil']['infoNaissance']
        if isinstance(info_naissance, dict):
            date_naissance_raw = info_naissance.get('dateNais')
            date_naissance = date_naissance_raw if not (isinstance(date_naissance_raw, dict) and date_naissance_raw.get('@xsi:nil')) else None
            ville_naissance_raw = info_naissance.get('villeNais')
            ville_naissance = ville_naissance_raw if not (isinstance(ville_naissance_raw, dict) and ville_naissance_raw.get('@xsi:nil')) else None
            dep_naissance_raw = info_naissance.get('depNais')
            dep_naissance = dep_naissance_raw if not (isinstance(dep_naissance_raw, dict) and dep_naissance_raw.get('@xsi:nil')) else None
            pays_naissance_raw = info_naissance.get('paysNais')
            pays_naissance = pays_naissance_raw if not (isinstance(pays_naissance_raw, dict) and pays_naissance_raw.get('@xsi:nil')) else None
        else:
            date_naissance = info_naissance if isinstance(info_naissance, str) else None
            ville_naissance = None
            dep_naissance = None
            pays_naissance = None
        
        # Calcul âge (initialisation obligatoire)
        age = None
        if date_naissance:
            try:
                birth_date = date.fromisoformat(date_naissance)
                today = date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            except ValueError:
                print(f"Date naissance invalide pour {file_name}: {date_naissance} - Age=None.")
        
        # Date deces : gère dict xsi:nil ou str
        date_deces_raw = data['etatCivil'].get('dateDeces')
        if isinstance(date_deces_raw, dict):
            date_deces = date_deces_raw.get('#text') if not date_deces_raw.get('@xsi:nil') else None
        else:
            date_deces = date_deces_raw if isinstance(date_deces_raw, str) else None
        
        # Profession : gère dict xsi:nil ou str pour chaque sous-champ
        profession = data['profession']
        if isinstance(profession, dict):
            libelle_profession_raw = profession.get('libelleCourant')
            libelle_profession = libelle_profession_raw if not (isinstance(libelle_profession_raw, dict) and libelle_profession_raw.get('@xsi:nil')) else None
            soc_proc_insee = profession.get('socProcINSEE', {})
            cat_soc_pro_raw = soc_proc_insee.get('catSocPro')
            cat_soc_pro = cat_soc_pro_raw if not (isinstance(cat_soc_pro_raw, dict) and cat_soc_pro_raw.get('@xsi:nil')) else None
            fam_soc_pro_raw = soc_proc_insee.get('famSocPro')
            fam_soc_pro = fam_soc_pro_raw if not (isinstance(fam_soc_pro_raw, dict) and fam_soc_pro_raw.get('@xsi:nil')) else None
        else:
            libelle_profession = None
            cat_soc_pro = None
            fam_soc_pro = None
        
        # URI HATVP : gère dict xsi:nil ou str
        uri_hatvp_raw = data.get('uri_hatvp')
        uri_hatvp = uri_hatvp_raw if not (isinstance(uri_hatvp_raw, dict) and uri_hatvp_raw.get('@xsi:nil')) else None
        
        # Adresses et mandats en JSONB (safe)
        adresses = json.dumps(data.get('adresses', {}).get('adresse', [])) if data.get('adresses') else None
        mandats = json.dumps(data.get('mandats', {}).get('mandat', [])) if data.get('mandats') else None
        
        # Extraction roles → TEXT propre et lisible (priorité Ministre > Sénateur > Député ; virgule si plusieurs)
        roles_set = set()
        mandats_raw = data.get('mandats', {}).get('mandat', [])
        if isinstance(mandats_raw, dict):  # Wrapper si single mandat (cas comme ce JSON)
            mandats_raw = [mandats_raw]
        for mandat in mandats_raw if isinstance(mandats_raw, list) else []:  # Safe fallback si ni list ni dict
            if mandat.get('dateFin') is None:  # Actif
                type_organe = mandat.get('typeOrgane')
                if type_organe == 'ASSEMBLEE':
                    roles_set.add('Député')
                elif type_organe == 'SENAT':
                    roles_set.add('Sénateur')
                elif type_organe in ['MINISTERE', 'GOUVERNEMENT']:
                    roles_set.add('Ministre')
        
        roles_text = None
        if roles_set:
            # Priorité
            if 'Ministre' in roles_set:
                roles_text = 'Ministre' + (', ' + ', '.join(sorted(roles_set - {'Ministre'})) if len(roles_set) > 1 else '')
            elif 'Sénateur' in roles_set:
                roles_text = 'Sénateur' + (', ' + ', '.join(sorted(roles_set - {'Sénateur'})) if len(roles_set) > 1 else '')
            elif 'Député' in roles_set:
                roles_text = 'Député' + (', ' + ', '.join(sorted(roles_set - {'Député'})) if len(roles_set) > 1 else '')
            else:
                roles_text = ', '.join(sorted(roles_set))
        
        # Extraction groupe_organe_ref (organeRef du groupe actif : GP/GROUPESENAT prioritaire, fallback GOUVERNEMENT/MINISTERE si ministre sans groupe parlementaire) - safe
        groupe_organe_ref = None
        try:
            mandats_raw = data.get('mandats', {}).get('mandat', [])
            if isinstance(mandats_raw, dict):  # Wrapper si single mandat
                mandats_raw = [mandats_raw]
            for mandat in mandats_raw if isinstance(mandats_raw, list) else []:
                if mandat.get('dateFin') is None:  # Actif uniquement
                    type_organe = mandat.get('typeOrgane')
                    if type_organe in ['GP', 'GROUPESENAT', 'GOUVERNEMENT']:  # Priorise GP/GROUPESENAT, puis GOUVERNEMENT
                        groupe_organe_ref = mandat.get('organes', {}).get('organeRef')
                        break  # Prend le premier trouvé (généralement un seul par acteur)
        except KeyError as ke:
            print(f"Clé manquante pour mandats dans {file_name}: {ke} - groupe=None.")

        # Extraction organes_refs (liste unique d'organeRef pour TOUS mandats actifs) - safe
        organes_refs_set = set()
        try:
            mandats_raw = data.get('mandats', {}).get('mandat', [])
            if isinstance(mandats_raw, dict):  # Wrapper si single mandat
                mandats_raw = [mandats_raw]
            for mandat in mandats_raw if isinstance(mandats_raw, list) else []:
                if mandat.get('dateFin') is None:  # Actif uniquement
                    organes = mandat.get('organes', {})
                    if isinstance(organes, dict):
                        organe_ref = organes.get('organeRef')
                        if isinstance(organe_ref, str):
                            organes_refs_set.add(organe_ref)
                        elif isinstance(organe_ref, list):  # Cas liste directe pour organeRef
                            for ref in organe_ref:
                                if isinstance(ref, str):
                                    organes_refs_set.add(ref)
                    elif isinstance(organes, list):
                        for org in organes:
                            if isinstance(org, str):  # Liste de strings
                                organes_refs_set.add(org)
                            elif isinstance(org, dict):  # Liste de dicts
                                organe_ref = org.get('organeRef')
                                if organe_ref:
                                    organes_refs_set.add(organe_ref)
        except KeyError as ke:
            print(f"Clé manquante pour mandats dans {file_name}: {ke} - organes_refs=[]")
        organes_refs = list(organes_refs_set) if organes_refs_set else None  # Convertit set en list, ou None si vide


        
        # Extraction adresses spécifiques - safe avec wrapper si single dict ou xsi:nil
        email = None
        telephone = None
        linkedin_url = None
        profil_url = None
        twitter_url = None
        instagram_url = None
        facebook_url = None
        adresse_circonscription = None  # Initialisation ici pour tolérance
        try:
            adresses_section = data.get('adresses')
            adresse_list = []  # Initialisation safe
            if isinstance(adresses_section, dict) and adresses_section.get('@xsi:nil'):
                adresse_list = []
            else:
                adresse_raw = data.get('adresses', {}).get('adresse')
                if isinstance(adresse_raw, dict):
                    adresse_list = [adresse_raw]
                elif isinstance(adresse_raw, list):
                    adresse_list = adresse_raw
                else:
                    adresse_list = []
                    print(f"Adresses invalides (ni dict ni list) pour {file_name} - Skip.")
            
            for addr in adresse_list:
                if isinstance(addr, dict):
                    addr_type = addr.get('type')
                    val_elec = addr.get('valElec')
                    if addr_type == '15':
                        email = val_elec
                    elif addr_type == '11':
                        telephone = val_elec
                        if telephone:
                            telephone = telephone.replace('.', ' ')
                            if ' ' not in telephone:
                                telephone = ' '.join([telephone[i:i+2] for i in range(0, len(telephone), 2)])
                    elif addr_type == '30':
                        linkedin_url = f"https://www.linkedin.com{val_elec}" if val_elec else None
                    elif addr_type == '23':
                        profil_url = val_elec
                    elif addr_type == '24':
                        twitter_url = f"https://twitter.com/{val_elec.lstrip('@')}" if val_elec else None
                    elif addr_type in ['26', '29']:
                        instagram_url = f"https://instagram.com/{val_elec.lstrip('@')}" if val_elec else None
                    elif addr_type == '25':
                        facebook_url = f"https://www.facebook.com/{val_elec}" if val_elec else None
            
            # Extraction adresse circonscription (type '2') - safe
            for addr in adresse_list:
                if isinstance(addr, dict) and addr.get('type') == '2':
                    numero_rue = addr.get('numeroRue', '')
                    nom_rue = addr.get('nomRue', '')
                    complement = addr.get('complementAdresse', '') or ''
                    code_postal = addr.get('codePostal', '')
                    ville = addr.get('ville', '')
                    adresse_parts = [f"{numero_rue} {nom_rue}".strip()] + [complement.strip()] if complement else [f"{numero_rue} {nom_rue}".strip()]
                    adresse_circonscription = ', '.join(filter(None, adresse_parts)) + f", {code_postal} {ville}".strip(', ')
                    break
        
        except AttributeError as e:
            print(f"Erreur adresses pour {file_name}: {e} - Defaults à None.")
        
        # Dict statique code département -> nom (couvre métropole + outre-mer ; source : data.gouv.fr)
        departements_map = {
            '01': 'Ain',
            '02': 'Aisne',
            '03': 'Allier',
            '04': 'Alpes-de-Haute-Provence',
            '05': 'Hautes-Alpes',
            '06': 'Alpes-Maritimes',
            '07': 'Ardèche',
            '08': 'Ardennes',
            '09': 'Ariège',
            '10': 'Aube',
            '11': 'Aude',
            '12': 'Aveyron',
            '13': 'Bouches-du-Rhône',
            '14': 'Calvados',
            '15': 'Cantal',
            '16': 'Charente',
            '17': 'Charente-Maritime',
            '18': 'Cher',
            '19': 'Corrèze',
            '21': 'Côte-d\'Or',
            '22': 'Côtes-d\'Armor',
            '23': 'Creuse',
            '24': 'Dordogne',
            '25': 'Doubs',
            '26': 'Drôme',
            '27': 'Eure',
            '28': 'Eure-et-Loir',
            '29': 'Finistère',
            '2A': 'Corse-du-Sud',
            '2B': 'Haute-Corse',
            '30': 'Gard',
            '31': 'Haute-Garonne',
            '32': 'Gers',
            '33': 'Gironde',
            '34': 'Hérault',
            '35': 'Ille-et-Vilaine',
            '36': 'Indre',
            '37': 'Indre-et-Loire',
            '38': 'Isère',
            '39': 'Jura',
            '40': 'Landes',
            '41': 'Loir-et-Cher',
            '42': 'Loire',
            '43': 'Haute-Loire',
            '44': 'Loire-Atlantique',
            '45': 'Loiret',
            '46': 'Lot',
            '47': 'Lot-et-Garonne',
            '48': 'Lozère',
            '49': 'Maine-et-Loire',
            '50': 'Manche',
            '51': 'Marne',
            '52': 'Haute-Marne',
            '53': 'Mayenne',
            '54': 'Meurthe-et-Moselle',
            '55': 'Meuse',
            '56': 'Morbihan',
            '57': 'Moselle',
            '58': 'Nièvre',
            '59': 'Nord',
            '60': 'Oise',
            '61': 'Orne',
            '62': 'Pas-de-Calais',
            '63': 'Puy-de-Dôme',
            '64': 'Pyrénées-Atlantiques',
            '65': 'Hautes-Pyrénées',
            '66': 'Pyrénées-Orientales',
            '67': 'Bas-Rhin',
            '68': 'Haut-Rhin',
            '69': 'Rhône',
            '70': 'Haute-Saône',
            '71': 'Saône-et-Loire',
            '72': 'Sarthe',
            '73': 'Savoie',
            '74': 'Haute-Savoie',
            '75': 'Paris',
            '76': 'Seine-Maritime',
            '77': 'Seine-et-Marne',
            '78': 'Yvelines',
            '79': 'Deux-Sèvres',
            '80': 'Somme',
            '81': 'Tarn',
            '82': 'Tarn-et-Garonne',
            '83': 'Var',
            '84': 'Vaucluse',
            '85': 'Vendée',
            '86': 'Vienne',
            '87': 'Haute-Vienne',
            '88': 'Vosges',
            '89': 'Yonne',
            '90': 'Territoire de Belfort',
            '91': 'Essonne',
            '92': 'Hauts-de-Seine',
            '93': 'Seine-Saint-Denis',
            '94': 'Val-de-Marne',
            '95': 'Val-d\'Oise',
            '971': 'Guadeloupe',
            '972': 'Martinique',
            '973': 'Guyane',
            '974': 'La Réunion',
            '975': 'Saint-Pierre-et-Miquelon',
            '976': 'Mayotte',
            '977': 'Saint-Barthélemy',
            '978': 'Saint-Martin',
            '984': 'Terres australes et antarctiques françaises',
            '986': 'Wallis-et-Futuna',
            '987': 'Polynésie française',
            '988': 'Nouvelle-Calédonie',
            '989': 'Clipperton',
        }
        
        # Département d'élection (mandat principal actif : ASSEMBLEE ou SENAT) - safe avec fallback numDepartement -> nom
        departement_election = None
        cause_mandat = None
        mandats_raw = data.get('mandats', {}).get('mandat', [])
        if isinstance(mandats_raw, dict):  # Wrapper si single mandat
            mandats_raw = [mandats_raw]
        for mandat in mandats_raw if isinstance(mandats_raw, list) else []:
            if mandat.get('dateFin') is None and mandat.get('typeOrgane') in ['ASSEMBLEE', 'SENAT']:
                lieu = mandat.get('election', {}).get('lieu', {})
                departement_nom = lieu.get('departement')
                if departement_nom:  # Priorité au nom si présent
                    departement_election = departement_nom
                else:  # Fallback sur numDepartement et mapping
                    num_departement = lieu.get('numDepartement')
                    if num_departement and num_departement in departements_map:
                        departement_election = departements_map[num_departement]
                cause_mandat = mandat.get('election', {}).get('causeMandat')
                break  # Prend le premier trouvé
        
        # Dict pour upsert
        data_insert = {
            'uid': uid,
            'civ': civ,
            'prenom': prenom,
            'nom': nom,
            'alpha': alpha,
            'trigramme': trigramme,
            'date_naissance': date_naissance,
            'ville_naissance': ville_naissance,
            'dep_naissance': dep_naissance,
            'pays_naissance': pays_naissance,
            'date_deces': date_deces,
            'libelle_profession': libelle_profession,
            'cat_soc_pro': cat_soc_pro,
            'fam_soc_pro': fam_soc_pro,
            'uri_hatvp': uri_hatvp,
            'adresses': adresses,
            'mandats': mandats,
            'roles_text': roles_text,
            'profil_url': profil_url,
            'telephone': telephone,
            'linkedin_url': linkedin_url,
            'departement_election': departement_election,
            'email': email,
            'age': age,
            'cause_mandat': cause_mandat,
            'twitter_url': twitter_url,
            'instagram_url': instagram_url,
            'groupe': groupe_organe_ref,
            'facebook_url': facebook_url,
            'adresse_circonscription': adresse_circonscription,
            'organes_refs': organes_refs,  # Nouvelle colonne ARRAY<TEXT> avec organeRef uniques actifs
        }
        
        return data_insert
    
    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        import traceback
        traceback.print_exc()
        return None

def importer_organe(organe_data, file_name):
    """Parse un JSON organe et retourne dict pour upsert (basé sur import_organes.py)."""
    try:
        data = organe_data['organe']
        
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
        return data_insert

    
    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        import traceback
        traceback.print_exc()
        return None

# ===================================================================
# Import principal depuis ZIP
# ===================================================================
def importer_acteurs_organes_from_zip(zip_ref: zipfile.ZipFile):
    """Importe acteurs et organes du ZIP en batch + barre de progression."""
    # Filtre pour JSON acteurs (PA*) et organes (PO*) – assume dossier racine ou 'json/' dans ZIP
    json_files = [f for f in zip_ref.namelist() if (f.endswith('.json') and (f.split('/')[-1].startswith('PA') or f.split('/')[-1].startswith('PO')))]
    
    print(f"\n{len(json_files)} fichiers trouvés dans le ZIP\n")
    acteurs_count = sum(1 for f in json_files if f.split('/')[-1].startswith('PA'))
    organes_count = sum(1 for f in json_files if f.split('/')[-1].startswith('PO'))
    print(f"   - Acteurs (PA*) : {acteurs_count}")
    print(f"   - Organes (PO*) : {organes_count}")
    
    batch_size = 100  # Envoi par lots de 100
    acteurs_batch = []
    organes_batch = []
    success_acteurs = 0
    failed_acteurs = 0
    success_organes = 0
    failed_organes = 0

    # Barre de progression
    for file_name in tqdm(json_files, desc="Import acteurs/organes", unit="fichier"):
        try:
            with zip_ref.open(file_name) as f:
                data = json.load(f)
            
            base_name = file_name.split('/')[-1]
            if base_name.startswith('PA'):
                payload = importer_acteur(data, base_name)
                if payload:
                    acteurs_batch.append(payload)
            elif base_name.startswith('PO'):
                payload = importer_organe(data, base_name)
                if payload:
                    organes_batch.append(payload)
            
            # Envoi batches acteurs si plein
            if len(acteurs_batch) >= batch_size:
                response = supabase.table('acteurs').upsert(acteurs_batch, on_conflict='uid').execute()
                if response.data:
                    success_acteurs += len(acteurs_batch)
                else:
                    print(f"Erreur batch acteurs : {getattr(response, 'error', 'Erreur inconnue')}")
                    failed_acteurs += len(acteurs_batch)
                acteurs_batch = []
            
            # Envoi batches organes si plein
            if len(organes_batch) >= batch_size:
                response = supabase.table('organes').upsert(organes_batch, on_conflict='uid').execute()
                if response.data:
                    success_organes += len(organes_batch)
                else:
                    print(f"Erreur batch organes : {getattr(response, 'error', 'Erreur inconnue')}")
                    failed_organes += len(organes_batch)
                organes_batch = []
        
        except Exception as e:
            if base_name.startswith('PA'):
                failed_acteurs += 1
            else:
                failed_organes += 1
            print(f"Erreur fichier {file_name}: {e}")

    # Derniers batches
    if acteurs_batch:
        response = supabase.table('acteurs').upsert(acteurs_batch, on_conflict='uid').execute()
        if response.data:
            success_acteurs += len(acteurs_batch)
        else:
            failed_acteurs += len(acteurs_batch)
    
    if organes_batch:
        response = supabase.table('organes').upsert(organes_batch, on_conflict='uid').execute()
        if response.data:
            success_organes += len(organes_batch)
        else:
            failed_organes += len(organes_batch)

    print(f"\n{'='*60}")
    print(f"IMPORT ACTEURS/ORGANES TERMINÉ")
    print(f"   Acteurs succès : {success_acteurs}")
    print(f"   Acteurs échecs : {failed_acteurs}")
    print(f"   Organes succès : {success_organes}")
    print(f"   Organes échecs : {failed_organes}")
    print(f"{'='*60}")


# Liste des URLs ZIP à importer (ajoute ici tes nouvelles URLs)
URLS = [
    #deputé en exercise
    "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/acteurs_mandats_organes_divises/AMO50_acteurs_mandats_organes_divises.json.zip",  # URL actuelle
    #historique des député
    "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip",
    #depute, senateur, ministre de la legislature
    "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_senateurs_ministres_legislature/AMO20_dep_sen_min_tous_mandats_et_organes.json.zip"
]


# Exécution
if __name__ == "__main__":
    for url in URLS:
        try:
            zip_ref = download_zip(url)
            importer_acteurs_organes_from_zip(zip_ref)
        except Exception as e:
            print(f"Erreur pour URL {url}: {e} - Skip et passage à la suivante.")
    print("\nTout est terminé !")