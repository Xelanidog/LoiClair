# import_acteurs_organes_cloud.py
# Script combiné pour importer acteurs (PA*) et organes (PO*) depuis un ZIP distant (url AN) vers Supabase.
# Exécute avec : python import_acteurs_organes_cloud.py

import json
import os
import re
import requests
import io
import zipfile
import traceback
from supabase import create_client, Client
from dotenv import load_dotenv
from tqdm import tqdm
from datetime import date
from urllib.parse import quote


# ===================================================================
# Constantes module-level
# ===================================================================

# Dict statique code département -> nom (couvre métropole + outre-mer ; source : data.gouv.fr)
DEPARTEMENTS_MAP = {
    "01": "Ain",
    "02": "Aisne",
    "03": "Allier",
    "04": "Alpes-de-Haute-Provence",
    "05": "Hautes-Alpes",
    "06": "Alpes-Maritimes",
    "07": "Ardèche",
    "08": "Ardennes",
    "09": "Ariège",
    "10": "Aube",
    "11": "Aude",
    "12": "Aveyron",
    "13": "Bouches-du-Rhône",
    "14": "Calvados",
    "15": "Cantal",
    "16": "Charente",
    "17": "Charente-Maritime",
    "18": "Cher",
    "19": "Corrèze",
    "21": "Côte-d'Or",
    "22": "Côtes-d'Armor",
    "23": "Creuse",
    "24": "Dordogne",
    "25": "Doubs",
    "26": "Drôme",
    "27": "Eure",
    "28": "Eure-et-Loir",
    "29": "Finistère",
    "2A": "Corse-du-Sud",
    "2B": "Haute-Corse",
    "30": "Gard",
    "31": "Haute-Garonne",
    "32": "Gers",
    "33": "Gironde",
    "34": "Hérault",
    "35": "Ille-et-Vilaine",
    "36": "Indre",
    "37": "Indre-et-Loire",
    "38": "Isère",
    "39": "Jura",
    "40": "Landes",
    "41": "Loir-et-Cher",
    "42": "Loire",
    "43": "Haute-Loire",
    "44": "Loire-Atlantique",
    "45": "Loiret",
    "46": "Lot",
    "47": "Lot-et-Garonne",
    "48": "Lozère",
    "49": "Maine-et-Loire",
    "50": "Manche",
    "51": "Marne",
    "52": "Haute-Marne",
    "53": "Mayenne",
    "54": "Meurthe-et-Moselle",
    "55": "Meuse",
    "56": "Morbihan",
    "57": "Moselle",
    "58": "Nièvre",
    "59": "Nord",
    "60": "Oise",
    "61": "Orne",
    "62": "Pas-de-Calais",
    "63": "Puy-de-Dôme",
    "64": "Pyrénées-Atlantiques",
    "65": "Hautes-Pyrénées",
    "66": "Pyrénées-Orientales",
    "67": "Bas-Rhin",
    "68": "Haut-Rhin",
    "69": "Rhône",
    "70": "Haute-Saône",
    "71": "Saône-et-Loire",
    "72": "Sarthe",
    "73": "Savoie",
    "74": "Haute-Savoie",
    "75": "Paris",
    "76": "Seine-Maritime",
    "77": "Seine-et-Marne",
    "78": "Yvelines",
    "79": "Deux-Sèvres",
    "80": "Somme",
    "81": "Tarn",
    "82": "Tarn-et-Garonne",
    "83": "Var",
    "84": "Vaucluse",
    "85": "Vendée",
    "86": "Vienne",
    "87": "Haute-Vienne",
    "88": "Vosges",
    "89": "Yonne",
    "90": "Territoire de Belfort",
    "91": "Essonne",
    "92": "Hauts-de-Seine",
    "93": "Seine-Saint-Denis",
    "94": "Val-de-Marne",
    "95": "Val-d'Oise",
    "971": "Guadeloupe",
    "972": "Martinique",
    "973": "Guyane",
    "974": "La Réunion",
    "975": "Saint-Pierre-et-Miquelon",
    "976": "Mayotte",
    "977": "Saint-Barthélemy",
    "978": "Saint-Martin",
    "984": "Terres australes et antarctiques françaises",
    "986": "Wallis-et-Futuna",
    "987": "Polynésie française",
    "988": "Nouvelle-Calédonie",
    "989": "Clipperton",
}


# ===================================================================
# Helpers
# ===================================================================

def resolve_xsi_nil(value):
    """Retourne None si value est un dict avec @xsi:nil=true, sinon retourne la valeur."""
    if isinstance(value, dict):
        if value.get("@xsi:nil"):
            return value.get("#text")  # Parfois il y a un #text malgré nil
        return value.get("#text", value)
    return value


def clean_profession(value: str | None) -> str | None:
    """Supprime le préfixe '(XX) - ' et met en majuscule la première lettre."""
    if not isinstance(value, str):
        return value
    value = re.sub(r"^\(\d+\)\s*-\s*", "", value).strip()
    return value[0].upper() + value[1:] if value else value


def normalize_mandats(data: dict) -> list:
    """Parse les mandats une seule fois depuis le JSON brut. Retourne toujours une liste."""
    mandats_raw = data.get("mandats", {}).get("mandat", [])
    if isinstance(mandats_raw, dict):
        mandats_raw = [mandats_raw]
    return mandats_raw if isinstance(mandats_raw, list) else []


def parse_adresse_list(data: dict, file_name: str) -> list:
    """Parse la section adresses en une liste de dicts. Gère xsi:nil et single dict."""
    adresses_section = data.get("adresses")
    if isinstance(adresses_section, dict) and adresses_section.get("@xsi:nil"):
        return []
    adresse_raw = data.get("adresses", {}).get("adresse")
    if isinstance(adresse_raw, dict):
        return [adresse_raw]
    elif isinstance(adresse_raw, list):
        return adresse_raw
    return []


def build_social_url(val_elec: str | None, prefix: str, strip_at: bool = False) -> str | None:
    """Construit une URL sociale avec guard http. Si val_elec est déjà une URL complète, la retourne telle quelle."""
    if not val_elec:
        return None
    if val_elec.startswith("http"):
        return val_elec
    handle = val_elec.lstrip("@") if strip_at else val_elec
    return f"{prefix}{handle}"


# ===================================================================
# Téléchargement du ZIP
# ===================================================================
def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge le ZIP en mémoire depuis l'URL."""
    print(f"Téléchargement du ZIP depuis : {url}")
    response = requests.get(url)
    response.raise_for_status()
    return zipfile.ZipFile(io.BytesIO(response.content))


# Charger env vars de .env.local
load_dotenv(dotenv_path="/Users/algodin/Documents/LoiClair website/loiclair/.env.local")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")

supabase: Client = create_client(supabase_url, supabase_key)


# ===================================================================
# Sous-fonctions de parsing acteur
# ===================================================================

def extract_identity(data: dict) -> dict:
    """Extrait uid, civ, prenom, nom, alpha, trigramme."""
    uid = data["uid"].get("#text") if isinstance(data["uid"], dict) else data["uid"]
    ident = data["etatCivil"]["ident"]
    civ = ident.get("civ") if isinstance(ident, dict) else None
    prenom = ident.get("prenom") if isinstance(ident, dict) else None
    nom = ident.get("nom") if isinstance(ident, dict) else None
    alpha = ident.get("alpha") if isinstance(ident, dict) else None

    trigramme_raw = ident.get("trigramme") if isinstance(ident, dict) else None
    if isinstance(trigramme_raw, dict):
        trigramme = trigramme_raw.get("#text") if not trigramme_raw.get("@xsi:nil") else None
    else:
        trigramme = trigramme_raw if isinstance(trigramme_raw, str) else None

    return {
        "uid": uid, "civ": civ, "prenom": prenom, "nom": nom,
        "alpha": alpha, "trigramme": trigramme,
    }


def extract_birth_info(data: dict, file_name: str) -> dict:
    """Extrait date_naissance, ville, dep, pays, age, date_deces."""
    info_naissance = data["etatCivil"]["infoNaissance"]

    if isinstance(info_naissance, dict):
        date_naissance = resolve_xsi_nil(info_naissance.get("dateNais"))
        # resolve_xsi_nil peut retourner un dict entier si pas de #text — on veut un str ou None
        if isinstance(date_naissance, dict):
            date_naissance = None
        ville_naissance = resolve_xsi_nil(info_naissance.get("villeNais"))
        if isinstance(ville_naissance, dict):
            ville_naissance = None
        dep_naissance = resolve_xsi_nil(info_naissance.get("depNais"))
        if isinstance(dep_naissance, dict):
            dep_naissance = None
        pays_naissance = resolve_xsi_nil(info_naissance.get("paysNais"))
        if isinstance(pays_naissance, dict):
            pays_naissance = None
    else:
        date_naissance = info_naissance if isinstance(info_naissance, str) else None
        ville_naissance = None
        dep_naissance = None
        pays_naissance = None

    # Calcul âge
    age = None
    if date_naissance and isinstance(date_naissance, str):
        try:
            birth_date = date.fromisoformat(date_naissance)
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        except ValueError:
            print(f"Date naissance invalide pour {file_name}: {date_naissance} - Age=None.")

    # Date décès
    date_deces_raw = data["etatCivil"].get("dateDeces")
    if isinstance(date_deces_raw, dict):
        date_deces = date_deces_raw.get("#text") if not date_deces_raw.get("@xsi:nil") else None
    else:
        date_deces = date_deces_raw if isinstance(date_deces_raw, str) else None

    return {
        "date_naissance": date_naissance, "ville_naissance": ville_naissance,
        "dep_naissance": dep_naissance, "pays_naissance": pays_naissance,
        "age": age, "date_deces": date_deces,
    }


def extract_profession(data: dict) -> dict:
    """Extrait libelle_profession, cat_soc_pro, fam_soc_pro, uri_hatvp."""
    profession = data["profession"]

    if isinstance(profession, dict):
        libelle_profession_raw = profession.get("libelleCourant")
        libelle_profession = clean_profession(
            libelle_profession_raw
            if not (isinstance(libelle_profession_raw, dict) and libelle_profession_raw.get("@xsi:nil"))
            else None
        )
        soc_proc_insee = profession.get("socProcINSEE", {})
        cat_soc_pro_raw = soc_proc_insee.get("catSocPro")
        cat_soc_pro = (
            cat_soc_pro_raw
            if not (isinstance(cat_soc_pro_raw, dict) and cat_soc_pro_raw.get("@xsi:nil"))
            else None
        )
        fam_soc_pro_raw = soc_proc_insee.get("famSocPro")
        fam_soc_pro = (
            fam_soc_pro_raw
            if not (isinstance(fam_soc_pro_raw, dict) and fam_soc_pro_raw.get("@xsi:nil"))
            else None
        )
    else:
        libelle_profession = None
        cat_soc_pro = None
        fam_soc_pro = None

    uri_hatvp_raw = data.get("uri_hatvp")
    uri_hatvp = (
        uri_hatvp_raw
        if not (isinstance(uri_hatvp_raw, dict) and uri_hatvp_raw.get("@xsi:nil"))
        else None
    )

    return {
        "libelle_profession": libelle_profession, "cat_soc_pro": cat_soc_pro,
        "fam_soc_pro": fam_soc_pro, "uri_hatvp": uri_hatvp,
    }


def extract_social_urls(adresse_list: list) -> dict:
    """Extrait email, telephone, URLs sociales, profil_url et adresse_circonscription."""
    email = None
    telephone = None
    linkedin_url = None
    profil_url = None
    twitter_url = None
    instagram_url = None
    facebook_url = None
    adresse_circonscription = None

    for addr in adresse_list:
        if not isinstance(addr, dict):
            continue
        addr_type = addr.get("type")
        val_elec = addr.get("valElec")

        if addr_type == "15":
            email = val_elec
        elif addr_type == "11":
            telephone = val_elec
            if telephone:
                telephone = telephone.replace(".", " ")
                if " " not in telephone:
                    telephone = " ".join([telephone[i:i+2] for i in range(0, len(telephone), 2)])
        elif addr_type == "30":
            # LinkedIn : val_elec est un chemin relatif ("/in/Nom") — encoder les espaces
            if val_elec:
                if val_elec.startswith("http"):
                    linkedin_url = val_elec
                else:
                    linkedin_url = f"https://www.linkedin.com{quote(val_elec)}"
        elif addr_type == "23":
            profil_url = val_elec
        elif addr_type == "24":
            twitter_url = build_social_url(val_elec, "https://twitter.com/", strip_at=True)
        elif addr_type in ["26", "29"]:
            instagram_url = build_social_url(val_elec, "https://instagram.com/", strip_at=True)
        elif addr_type == "25":
            facebook_url = build_social_url(val_elec, "https://www.facebook.com/")

    # Adresse circonscription (type '2')
    for addr in adresse_list:
        if isinstance(addr, dict) and addr.get("type") == "2":
            numero_rue = addr.get("numeroRue", "")
            nom_rue = addr.get("nomRue", "")
            complement = addr.get("complementAdresse", "") or ""
            code_postal = addr.get("codePostal", "")
            ville = addr.get("ville", "")
            adresse_parts = (
                [f"{numero_rue} {nom_rue}".strip()] + [complement.strip()]
                if complement
                else [f"{numero_rue} {nom_rue}".strip()]
            )
            adresse_circonscription = ", ".join(
                filter(None, adresse_parts)
            ) + f", {code_postal} {ville}".strip(", ")
            break

    return {
        "email": email, "telephone": telephone, "linkedin_url": linkedin_url,
        "profil_url": profil_url, "twitter_url": twitter_url,
        "instagram_url": instagram_url, "facebook_url": facebook_url,
        "adresse_circonscription": adresse_circonscription,
    }


def extract_mandate_info(all_mandats: list, file_name: str) -> dict:
    """Extrait rôles, statut actuel, groupe, organes_refs, département, et nouvelles colonnes."""
    roles_set = set()
    en_exercice = False
    est_depute_actuel = False
    est_senateur_actuel = False
    est_ministre_actuel = False
    groupe_organe_ref = None
    organes_refs_set = set()
    departement_election = None
    num_departement = None
    num_circo = None
    cause_mandat = None
    qualite_actuelle = None
    date_debut_mandat = None
    place_hemicycle = None
    premiere_election = None

    for mandat in all_mandats:
        type_organe = mandat.get("typeOrgane")
        date_fin = mandat.get("dateFin")
        lib_qualite = str(mandat.get("infosQualite", {}).get("libQualite", "")).lower()

        # 1. roles_text → tous les mandats (historiques + actifs)
        if type_organe == "ASSEMBLEE":
            roles_set.add("Député")
        elif type_organe == "SENAT":
            roles_set.add("Sénateur")
        elif type_organe in ["MINISTERE", "GOUVERNEMENT"]:
            if "secrétaire d'état" in lib_qualite or "secrétaire d'etat" in lib_qualite:
                roles_set.add("Secrétaire d'État")
            else:
                roles_set.add("Ministre")

        # 2. Mandats actifs uniquement (dateFin == None)
        if date_fin is None:
            en_exercice = True

            if type_organe == "ASSEMBLEE":
                est_depute_actuel = True
            elif type_organe == "SENAT":
                est_senateur_actuel = True
            elif type_organe in ["MINISTERE", "GOUVERNEMENT"]:
                # Seuls les vrais ministres/secrétaires d'État (pas les députés "en mission")
                if "ministre" in lib_qualite or "secrétaire d'état" in lib_qualite or "secrétaire d'etat" in lib_qualite:
                    est_ministre_actuel = True

            # Groupe politique actif (GP/GROUPESENAT prioritaire, fallback GOUVERNEMENT)
            if type_organe in ["GP", "GROUPESENAT", "GOUVERNEMENT"] and groupe_organe_ref is None:
                groupe_organe_ref = mandat.get("organes", {}).get("organeRef")

            # Organes refs (tous mandats actifs)
            organes = mandat.get("organes", {})
            if isinstance(organes, dict):
                organe_ref = organes.get("organeRef")
                if isinstance(organe_ref, str):
                    organes_refs_set.add(organe_ref)
                elif isinstance(organe_ref, list):
                    for ref in organe_ref:
                        if isinstance(ref, str):
                            organes_refs_set.add(ref)
            elif isinstance(organes, list):
                for org in organes:
                    if isinstance(org, str):
                        organes_refs_set.add(org)
                    elif isinstance(org, dict) and org.get("organeRef"):
                        organes_refs_set.add(org["organeRef"])

            # Département/circo d'élection (mandat ASSEMBLEE ou SENAT actif)
            if type_organe in ["ASSEMBLEE", "SENAT"] and departement_election is None:
                lieu = mandat.get("election", {}).get("lieu", {})
                departement_nom = lieu.get("departement")
                num_dep = lieu.get("numDepartement")
                if departement_nom:
                    departement_election = departement_nom
                elif num_dep and num_dep in DEPARTEMENTS_MAP:
                    departement_election = DEPARTEMENTS_MAP[num_dep]
                num_departement = num_dep
                num_circo = lieu.get("numCirco")
                cause_mandat = mandat.get("election", {}).get("causeMandat")
                # Nouvelles colonnes depuis mandature
                mandature = mandat.get("mandature", {}) or {}
                date_debut_mandat = mandat.get("dateDebut")
                place_hemicycle = mandature.get("placeHemicycle")
                prem_elec = mandature.get("premiereElection")
                premiere_election = (prem_elec == "1") if prem_elec in ["0", "1"] else None

            # Qualité actuelle (titre exact du poste) — MINISTERE/GOUVERNEMENT prioritaire sur ASSEMBLEE/SENAT
            if type_organe in ["MINISTERE", "GOUVERNEMENT"]:
                raw_qualite = mandat.get("infosQualite", {}).get("libQualite")
                if raw_qualite:
                    qualite_actuelle = raw_qualite
            elif type_organe in ["ASSEMBLEE", "SENAT"] and qualite_actuelle is None:
                raw_qualite = mandat.get("infosQualite", {}).get("libQualite")
                if raw_qualite:
                    qualite_actuelle = raw_qualite

    # Construire roles_text avec priorité
    roles_text = None
    if roles_set:
        if "Ministre" in roles_set:
            roles_text = "Ministre" + (
                ", " + ", ".join(sorted(roles_set - {"Ministre"}))
                if len(roles_set) > 1 else ""
            )
        elif "Sénateur" in roles_set:
            roles_text = "Sénateur" + (
                ", " + ", ".join(sorted(roles_set - {"Sénateur"}))
                if len(roles_set) > 1 else ""
            )
        elif "Député" in roles_set:
            roles_text = "Député" + (
                ", " + ", ".join(sorted(roles_set - {"Député"}))
                if len(roles_set) > 1 else ""
            )
        else:
            roles_text = ", ".join(sorted(roles_set))

    return {
        "roles_text": roles_text,
        "en_exercice": en_exercice,
        "est_depute_actuel": est_depute_actuel,
        "est_senateur_actuel": est_senateur_actuel,
        "est_ministre_actuel": est_ministre_actuel,
        "groupe": groupe_organe_ref,
        "organes_refs": list(organes_refs_set) if organes_refs_set else None,
        "departement_election": departement_election,
        "num_departement": num_departement,
        "num_circo": num_circo,
        "cause_mandat": cause_mandat,
        "qualite_actuelle": qualite_actuelle,
        "date_debut_mandat": date_debut_mandat,
        "place_hemicycle": place_hemicycle,
        "premiere_election": premiere_election,
    }


# ===================================================================
# Fonctions de parsing principales
# ===================================================================

def importer_acteur(acteur_data, file_name):
    """Parse un JSON acteur et retourne dict pour upsert."""
    try:
        data = acteur_data["acteur"]

        # Parser mandats et adresses une seule fois
        all_mandats = normalize_mandats(data)
        adresse_list = parse_adresse_list(data, file_name)

        # Extraction par sous-fonctions
        identity = extract_identity(data)
        birth = extract_birth_info(data, file_name)
        profession = extract_profession(data)
        urls = extract_social_urls(adresse_list)
        mandates = extract_mandate_info(all_mandats, file_name)

        # Adresses et mandats en JSONB (brut)
        adresses_json = json.dumps(adresse_list) if adresse_list else None

        # Tri mandats par date descendant, garder les 50 plus récents pour le JSONB
        mandats_for_json = list(all_mandats)  # copie pour ne pas muter l'original
        if mandats_for_json:
            try:
                mandats_for_json.sort(key=lambda m: m.get("dateDebut") or "1900-01-01", reverse=True)
            except Exception:
                pass
            mandats_for_json = mandats_for_json[:50]
        mandats_json = json.dumps(mandats_for_json) if mandats_for_json else None

        # Assembler le payload
        data_insert = {
            **identity,
            **birth,
            **profession,
            **urls,
            **mandates,
            "adresses": adresses_json,
            "mandats": mandats_json,
        }

        return data_insert

    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        traceback.print_exc()
        return None


def importer_organe(organe_data, file_name):
    """Parse un JSON organe et retourne dict pour upsert."""
    try:
        data = organe_data["organe"]

        uid = data.get("uid")
        code_type = data.get("codeType")
        libelle = data.get("libelle")
        libelle_edition = data.get("libelleEdition")
        libelle_abrege = data.get("libelleAbrege")
        libelle_abrev = data.get("libelleAbrev")

        # Null safety : `or {}` gère le cas où la valeur est explicitement null
        vi_mode = data.get("viMoDe") or {}
        date_debut = vi_mode.get("dateDebut")
        date_agrement = vi_mode.get("dateAgrement")
        date_fin = vi_mode.get("dateFin")

        organe_parent = data.get("organeParent")
        chambre = data.get("chambre")
        regime = data.get("regime")
        legislature = data.get("legislature")

        secretariat = data.get("secretariat") or {}
        secretaire_01 = secretariat.get("secretaire01")
        secretaire_02 = secretariat.get("secretaire02")

        regime_juridique = data.get("regimeJuridique")
        site_internet = data.get("siteInternet")

        nombre_reunions_annuelles_raw = data.get("nombreReunionsAnnuelles")
        try:
            nombre_reunions_annuelles = int(nombre_reunions_annuelles_raw) if nombre_reunions_annuelles_raw else None
        except (ValueError, TypeError):
            nombre_reunions_annuelles = None

        preseance_raw = data.get("preseance")
        try:
            preseance = int(preseance_raw) if preseance_raw else None
        except (ValueError, TypeError):
            preseance = None

        organe_precedent_ref = data.get("organePrecedentRef")
        liste_pays = data.get("listePays")

        # GP (groupe politique) : couleur et position politique
        couleur_associee = data.get("couleurAssociee")
        position_politique = data.get("positionPolitique")

        # CIRCONSCRIPTION : numéro et lieu géographique
        numero = data.get("numero")
        lieu = data.get("lieu")

        data_insert = {
            "uid": uid,
            "code_type": code_type,
            "libelle": libelle,
            "libelle_edition": libelle_edition,
            "libelle_abrege": libelle_abrege,
            "libelle_abrev": libelle_abrev,
            "date_debut": date_debut,
            "date_agrement": date_agrement,
            "date_fin": date_fin,
            "organe_parent": organe_parent,
            "chambre": chambre,
            "regime": regime,
            "legislature": legislature,
            "secretaire_01": secretaire_01,
            "secretaire_02": secretaire_02,
            "regime_juridique": regime_juridique,
            "site_internet": site_internet,
            "nombre_reunions_annuelles": nombre_reunions_annuelles,
            "preseance": preseance,
            "organe_precedent_ref": organe_precedent_ref,
            "liste_pays": liste_pays,
            "couleur_associee": couleur_associee,
            "position_politique": position_politique,
            "numero": numero,
            "lieu": lieu,
        }
        return data_insert

    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        traceback.print_exc()
        return None


# ===================================================================
# Import principal depuis ZIP
# ===================================================================
def upsert_batch(table_name: str, batch: list) -> tuple[int, int]:
    """Upsert un batch avec retry automatique en cas de timeout."""
    try:
        response = supabase.table(table_name).upsert(batch, on_conflict="uid").execute()
        if response.data:
            return len(batch), 0
        print(f"Erreur batch {table_name} ({len(batch)} rows): pas de data retournée")
        return 0, len(batch)
    except Exception as e:
        error_msg = str(e)
        # Si timeout, retry en découpant le batch en 2
        if "timeout" in error_msg.lower() or "57014" in error_msg:
            if len(batch) > 50:
                mid = len(batch) // 2
                print(f"Timeout batch {table_name} ({len(batch)} rows) — retry en 2x{mid}")
                s1, f1 = upsert_batch(table_name, batch[:mid])
                s2, f2 = upsert_batch(table_name, batch[mid:])
                return s1 + s2, f1 + f2
        print(f"Erreur batch {table_name} ({len(batch)} rows): {e}")
        return 0, len(batch)


def importer_acteurs_organes_from_zip(zip_ref: zipfile.ZipFile):
    """Importe acteurs et organes du ZIP en batch + barre de progression."""
    json_files = [
        f for f in zip_ref.namelist()
        if f.endswith(".json")
        and (f.split("/")[-1].startswith("PA") or f.split("/")[-1].startswith("PO"))
    ]

    print(f"\n{len(json_files)} fichiers trouvés dans le ZIP\n")
    acteurs_count = sum(1 for f in json_files if f.split("/")[-1].startswith("PA"))
    organes_count = sum(1 for f in json_files if f.split("/")[-1].startswith("PO"))
    print(f"   - Acteurs (PA*) : {acteurs_count}")
    print(f"   - Organes (PO*) : {organes_count}")

    batch_size_acteurs = 300  # Retry automatique si timeout
    batch_size_organes = 500
    acteurs_batch = []
    organes_batch = []
    success_acteurs = 0
    failed_acteurs = 0
    success_organes = 0
    failed_organes = 0

    for file_name in tqdm(json_files, desc="Import acteurs/organes", unit="fichier"):
        try:
            with zip_ref.open(file_name) as f:
                data = json.load(f)

            base_name = file_name.split("/")[-1]
            if base_name.startswith("PA"):
                payload = importer_acteur(data, base_name)
                if payload:
                    acteurs_batch.append(payload)
            elif base_name.startswith("PO"):
                payload = importer_organe(data, base_name)
                if payload:
                    organes_batch.append(payload)

            # Envoi batches acteurs si plein
            if len(acteurs_batch) >= batch_size_acteurs:
                s, f_ = upsert_batch("acteurs", acteurs_batch)
                success_acteurs += s
                failed_acteurs += f_
                acteurs_batch = []

            # Envoi batches organes si plein
            if len(organes_batch) >= batch_size_organes:
                s, f_ = upsert_batch("organes", organes_batch)
                success_organes += s
                failed_organes += f_
                organes_batch = []

        except Exception as e:
            base_name = file_name.split("/")[-1]
            if base_name.startswith("PA"):
                failed_acteurs += 1
            else:
                failed_organes += 1
            print(f"Erreur fichier {file_name}: {e}")

    # Derniers batches
    if acteurs_batch:
        s, f_ = upsert_batch("acteurs", acteurs_batch)
        success_acteurs += s
        failed_acteurs += f_

    if organes_batch:
        s, f_ = upsert_batch("organes", organes_batch)
        success_organes += s
        failed_organes += f_

    print(f"\n{'='*60}")
    print(f"IMPORT ACTEURS/ORGANES TERMINÉ")
    print(f"   Acteurs succès : {success_acteurs}")
    print(f"   Acteurs échecs : {failed_acteurs}")
    print(f"   Organes succès : {success_organes}")
    print(f"   Organes échecs : {failed_organes}")
    print(f"{'='*60}")


# Ordre des ZIPs : AMO50 d'abord (identité seule, pas de mandats), puis AMO30 (historique complet),
# puis AMO20 en dernier (législature courante, données les plus à jour — écrase les précédents).
URLS = [
    # 1. Députés en exercice — format "divisé" : identité + organes, SANS mandats dans les PA*.json
    "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/acteurs_mandats_organes_divises/AMO50_acteurs_mandats_organes_divises.json.zip",
    # 2. Historique complet (toutes législatures, tous mandats)
    "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip",
    # 3. Législature courante avec mandats complets (le plus frais, importé en dernier)
    "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_senateurs_ministres_legislature/AMO20_dep_sen_min_tous_mandats_et_organes.json.zip",
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
