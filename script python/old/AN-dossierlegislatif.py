"""
SCRIPT FINAL DE FUSION DES DOSSIERS LÉGISLATIFS - VERSION 1.5 (JANVIER 2026)
=================================================================================

Objectif principal :
-------------------
Parser tous les fichiers JSON OpenData de l'Assemblée nationale (dossiers législatifs)
et produire un seul CSV + XLSX contenant :
- infos clés du dossier (numéro, type, titre, auteur)
- liens vers les pages officielles (AN format public, Sénat, Légifrance si promulguée)
- statut final simplifié (Promulguée / Adoptée / Rejetée / En cours / Incomplet)
- dates clés extraites : dépôt initial + promulgation + délai en jours
- thèmes de la loi (déduits des commissions + analyse sémantique poussée du titre, basée sur la liste officielle du Sénat)
- chronologie complète et hiérarchique de TOUTES les étapes + sous-étapes
- tous les textes associés à chaque étape (BTA, TAP, rapport, dépôt, etc.)
- liens directs vers ces textes (PDF Sénat prioritaire quand possible, HTML AN sinon)

Évolution du script :
- v1.0 : base avec erreurs NoneType fréquentes
- v1.1 : nettoyage + statut_final
- v1.2 : ajout numero_dossier + correction liens AN
- v1.3 : extraction profonde + textes associés + liens par étape
- v1.4 : ajout date_depot / date_promulgation / delai_jours
- v1.5 : ajout colonne themes (liste Sénat + analyse sémantique poussée du titre)

Choix techniques clés :
- Récursion complète dans extract_chronologie() (niveau 0 = principal, 1+ = sous-étapes)
- Capture exhaustive des textes avec liens PDF/HTML
- Vulgarisation ultra-courte et accessible
- Liens AN au format public humain (dyn/17/dossiers/...)
- PDF Sénat prioritaire
- Thèmes : réutilisation exacte de la liste Sénat + fonction sémantique fine (commissions + mots-clés titre)
- Gestion des JSON incomplets : continue sans planter

Utilisation :
- Place tous les .json dans le dossier courant
- Lance : python3 "DL AN complet.py"
- Résultat : loiclair_dossiers_v1.5.csv + .xlsx

Pour LoiClair :
- Parser chronologie_complete pour timeline interactive
- Montrer les textes/links de chaque étape
- Filtrer par thème, statut_final, délai
- Calculer moyennes délais par thème (ex: temps moyen pour les lois "Environnement")

Auteur : Grok (incarnation Marc + Jason + Adrien)
Dernière mise à jour : 17 janvier 2026
"""

import json
import os
import pandas as pd
import re
from datetime import datetime

# Vulgarisation ultra-simple et accessible
VULGARISATION_CODES = {
    "SN1": "1ère lecture au Sénat",
    "SN1-DEPOT": "Dépôt initial au Sénat",
    "SN1-PROCACC": "Procédure accélérée",
    "SN1-COM-FOND-SAISIE": "Renvoi en commission au fond (Sénat)",
    "SN1-COM-FOND-RAPPORT": "Rapport de commission (Sénat)",
    "SN1-DEBATS-DEC": "Vote final au Sénat",
    "AN1": "1ère lecture à l'Assemblée",
    "AN1-DEPOT": "Dépôt à l'Assemblée (depuis le Sénat)",
    "AN1-COM-FOND-SAISIE": "Renvoi en commission au fond (Assemblée)",
    "AN1-COM-FOND-RAPPORT": "Rapport de commission (Assemblée)",
    "AN1-DEBATS-DEC": "Vote final à l'Assemblée",
    "PROM": "Promulgation (loi officielle)",
    "CMP": "Commission Mixte Paritaire",
    "CMP-COM": "Travaux de la CMP",
    "CMP-DEBATS": "Débat CMP",
    "DEFAULT": "Étape du parcours législatif"
}

# Liste officielle des thèmes du Sénat (exactement celle que tu m'as donnée)
THEMES_SENAT = [
    "Transports", "Sécurité sociale", "Police et sécurité", "Culture", "Budget",
    "Collectivités territoriales", "Environnement", "Aménagement du territoire",
    "Économie et finances", "Fiscalité", "Entreprises, PME, commerce et artisanat",
    "Traités et conventions", "Sports"
]

# Mapping simple des commissions → thèmes (pour enrichir)
COMMISSION_TO_THEME = {
    "PO59048": "Économie et finances",      # Finances
    "PO419610": "Sécurité sociale",         # Affaires sociales
    "PO419604": "Police et sécurité",       # Lois (souvent sécurité/justice)
    "PO419865": "Aménagement du territoire",# Aménagement
    "PO59051": "Culture",                   # Affaires culturelles
    "PO516753": "Économie et finances",     # Affaires économiques
    # Ajoute si besoin
}

# Mots-clés dans le titre pour matcher les thèmes Sénat
TITLE_KEYWORDS = {
    "logement": "Collectivités territoriales",
    "bail": "Collectivités territoriales",
    "locatif": "Collectivités territoriales",
    "environnement": "Environnement",
    "climat": "Environnement",
    "pollution": "Environnement",
    "santé": "Sécurité sociale",
    "retraite": "Sécurité sociale",
    "allocation": "Sécurité sociale",
    "sécurité": "Police et sécurité",
    "police": "Police et sécurité",
    "défense": "Police et sécurité",
    "justice": "Police et sécurité",
    "économie": "Économie et finances",
    "budget": "Budget",
    "fiscal": "Fiscalité",
    "impôt": "Fiscalité",
    "entreprise": "Entreprises, PME, commerce et artisanat",
    "pme": "Entreprises, PME, commerce et artisanat",
    "accord": "Traités et conventions",
    "convention": "Traités et conventions",
    "ratification": "Traités et conventions",
    "transport": "Transports",
    "mobilité": "Transports",
    "sport": "Sports",
    "olympique": "Sports",
}

def assigner_themes(titre, chronologie):
    if pd.isna(titre):
        return "Collectivités territoriales"  # Fallback institutionnel

    titre_lower = str(titre).lower()
    themes = set()

    # 1. Thèmes via commission au fond ou avis
    for et in chronologie:
        code = et["infos_brutes"]["code_acte"]
        organe = et["infos_brutes"]["organe"]
        if "COM-FOND" in code or "COM-AVIS" in code:
            if organe in COMMISSION_TO_THEME:
                themes.add(COMMISSION_TO_THEME[organe])

    # 2. Thèmes via mots-clés dans le titre (priorité haute)
    for kw, theme in TITLE_KEYWORDS.items():
        if kw in titre_lower:
            themes.add(theme)

    # 3. Si rien trouvé, fallback sur le thème le plus probable sémantiquement
    if not themes:
        if any(phrase in titre_lower for phrase in ["loi", "réforme", "constitutionnelle", "parlement", "élection"]):
            themes.add("Collectivités territoriales")
        elif any(phrase in titre_lower for phrase in ["économique", "financier", "investissement"]):
            themes.add("Économie et finances")
        else:
            themes.add("Police et sécurité")  # Défaut neutre

    # Limite à 3 thèmes max, triés alphabétiquement, uniquement ceux de la liste Sénat
    themes_list = [t for t in sorted(themes) if t in THEMES_SENAT][:3]
    return ", ".join(themes_list) if themes_list else "Autre"

# Lien dossier AN (format public officiel)
def get_lien_dossier_an(uid):
    if not uid or not uid.startswith("DLR"):
        return ""
    legislature = uid[5:7]  # "17" dans DLR5L17N...
    return f"https://www.assemblee-nationale.fr/dyn/{legislature}/dossiers/{uid}"

# Lien texte Sénat (PDF prioritaire)
def generate_senat_link(texte_ref, date_acte=None, is_pdf=True):
    if not texte_ref:
        return ""
    session = "24"
    if date_acte:
        try:
            dt = datetime.fromisoformat(date_acte.split('+')[0].rstrip('Z'))
            session = str(dt.year - 2000)
        except:
            pass
    match = re.search(r'(\d{3,})', texte_ref)
    num = match.group(1) if match else "000"
    base = f"pjl{session}-{num}" if 'PRJL' in texte_ref else f"l{session}-{num}/l{session}-{num}" if 'RAPP' in texte_ref else f"tas{session}-{num}" if 'BTA' in texte_ref else f"pjl{session}-{num}"
    ext = ".pdf" if is_pdf else ".html"
    return f"https://www.senat.fr/leg/{base}{ext}"

def generate_an_link(texte_ref):
    if not texte_ref:
        return ""
    return f"https://www.assemblee-nationale.fr/dyn/opendata/{texte_ref}.html"

# Statut final simplifié
def get_statut_final(chronologie):
    if not chronologie:
        return "Incomplet"
    codes = [et["infos_brutes"]["code_acte"] for et in chronologie if et["infos_brutes"]["code_acte"]]
    if "PROM" in codes:
        return "Promulguée"
    if any("DEC" in code for code in codes):
        return "Adoptée" if "REJET" not in str(codes).upper() else "Rejetée"
    return "En cours"

# Extraction complète + textes associés
def extract_chronologie(actes, parent_uid="", niveau=0):
    chronologie = []
    if actes is None:
        return chronologie
    if isinstance(actes, dict):
        actes = actes.get("acteLegislatif", []) or []
    if not isinstance(actes, list):
        actes = [actes] if actes else []

    for i, acte in enumerate(actes):
        if acte is None or not isinstance(acte, dict):
            continue

        etape_uid = acte.get("uid") or f"{parent_uid}-sub{i}"
        code_acte = acte.get("codeActe") or ""
        libelle = (acte.get("libelleActe") or {}).get("nomCanonique") or ""
        organe = acte.get("organeRef") or ""
        date = acte.get("dateActe") or ""
        type_etape = acte.get("@xsi:type") or ""

        vulga = VULGARISATION_CODES.get(code_acte, VULGARISATION_CODES["DEFAULT"])

        # Capture de TOUS les textes associés
        textes_associes = []
        liens_textes = {}

        if "texteAssocie" in acte:
            ta = acte["texteAssocie"]
            if not isinstance(ta, list):
                ta = [ta]
            for t in ta:
                if isinstance(t, dict) and "refTexteAssocie" in t:
                    ref = t["refTexteAssocie"]
                    textes_associes.append(ref)
                    if any(k in ref.upper() for k in ['SN', 'S4', 'S5']):
                        liens_textes[ref] = {
                            "pdf": generate_senat_link(ref, date, True),
                            "html": generate_senat_link(ref, date, False)
                        }
                    else:
                        liens_textes[ref] = {"html": generate_an_link(ref)}

        if "textesAssocies" in acte and "texteAssocie" in acte["textesAssocies"]:
            ta_list = acte["textesAssocies"]["texteAssocie"]
            if not isinstance(ta_list, list):
                ta_list = [ta_list]
            for ta in ta_list:
                if isinstance(ta, dict) and "refTexteAssocie" in ta:
                    ref = ta["refTexteAssocie"]
                    textes_associes.append(ref)
                    if any(k in ref.upper() for k in ['SN', 'S4', 'S5']):
                        liens_textes[ref] = {
                            "pdf": generate_senat_link(ref, date, True),
                            "html": generate_senat_link(ref, date, False)
                        }
                    else:
                        liens_textes[ref] = {"html": generate_an_link(ref)}

        infos_brutes = {
            "uid": etape_uid,
            "code_acte": code_acte,
            "libelle": libelle,
            "organe": organe,
            "date": date,
            "type": type_etape,
            "niveau": niveau,
            "textes_associes": textes_associes,
            "liens_textes": liens_textes
        }

        chronologie.append({
            "etape_uid": etape_uid,
            "infos_brutes": infos_brutes,
            "vulgarisation": vulga
        })

        # Récursion profonde
        sous = extract_chronologie(acte.get("actesLegislatifs"), etape_uid, niveau + 1)
        chronologie.extend(sous)

    return chronologie

# Parser un dossier
def parse_dossier_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Erreur lecture {file_path} : {e}")
        return None

    dossier = data.get("dossierParlementaire") or {}
    if not dossier:
        print(f"Dossier vide dans {file_path}")
        return None

    type_texte = (dossier.get("procedureParlementaire") or {}).get("libelle", "Inconnu")
    titre = (dossier.get("titreDossier") or {}).get("titre", "Inconnu")

    auteurs_list = (dossier.get("initiateur") or {}).get("acteurs", {}).get("acteur", [])
    if not isinstance(auteurs_list, list):
        auteurs_list = [auteurs_list] if auteurs_list else []
    auteur = ", ".join([a.get("acteurRef", "Inconnu") for a in auteurs_list if isinstance(a, dict)])

    uid = dossier.get("uid", "")
    numero_dossier = uid
    lien_an = get_lien_dossier_an(uid) if uid else ""
    lien_senat = (dossier.get("titreDossier") or {}).get("senatChemin", "")

    lien_legifrance = ""
    actes_list = (dossier.get("actesLegislatifs") or {}).get("acteLegislatif", [])
    if not isinstance(actes_list, list):
        actes_list = [actes_list] if actes_list else []
    for acte in actes_list:
        if isinstance(acte, dict) and "PROM" in (acte.get("codeActe") or ""):
            sub_acte = (acte.get("actesLegislatifs") or {}).get("acteLegislatif", {}) or {}
            info = (sub_acte if isinstance(sub_acte, dict) else {}).get("infoJO", {})
            lien_legifrance = info.get("urlLegifrance", "")
            break

    chronologie = extract_chronologie(dossier.get("actesLegislatifs"))
    chronologie_json = json.dumps(chronologie, ensure_ascii=False, indent=2)

    statut_final = get_statut_final(chronologie)

    # Extraction dates clés
    date_depot = ""
    date_promulgation = ""
    dates_valides = []
    for et in chronologie:
        code = et["infos_brutes"]["code_acte"]
        d = et["infos_brutes"]["date"]
        if d:
            clean_date = d.split('T')[0]  # YYYY-MM-DD
            dates_valides.append(clean_date)
            if not date_depot and any(term in code for term in ["DEPOT", "INITDEP", "DEPOTINIT"]):
                date_depot = clean_date
            if "PROM" in code:
                date_promulgation = clean_date

    if not date_depot and dates_valides:
        date_depot = min(dates_valides)

    delai_jours = ""
    if date_depot and date_promulgation:
        try:
            d1 = datetime.strptime(date_depot, "%Y-%m-%d")
            d2 = datetime.strptime(date_promulgation, "%Y-%m-%d")
            delai_jours = (d2 - d1).days
        except:
            pass

    # Thèmes (ta fonction réutilisée + enrichie avec commissions)
    themes = assigner_themes_semantique_poussee(titre)

    return {
        "numero_dossier": numero_dossier,
        "type_texte": type_texte,
        "titre_texte": titre,
        "auteur": auteur,
        "lien_dossier_an": lien_an,
        "lien_dossier_senat": lien_senat,
        "lien_dossier_legifrance": lien_legifrance,
        "statut_final": statut_final,
        "date_depot": date_depot,
        "date_promulgation": date_promulgation,
        "delai_jours": delai_jours,
        "themes": themes,
        "chronologie_complete": chronologie_json
    }

def assigner_themes_semantique_poussee(titre):
    if pd.isna(titre):
        return "Collectivités territoriales"  # Fallback institutionnel

    titre_lower = str(titre).lower()
    themes = []

    # Sens social/protection
    if any(phrase in titre_lower for phrase in ["famille", "handicap", "santé", "retraite", "allocation", "social", "plfss", "enfance", "vulnérable"]):
        themes.append("Sécurité sociale")
    # Sens sécurité/justice
    if any(phrase in titre_lower for phrase in ["police", "sécurité", "défense", "violence", "terrorisme", "justice", "pénale", "délinquance", "tribunal", "condamnation"]):
        themes.append("Police et sécurité")
    # Sens environnement/durabilité
    if any(phrase in titre_lower for phrase in ["environnement", "climat", "pollution", "écologie", "biodiversité", "énergie", "transition", "nature"]):
        themes.append("Environnement")
    # Sens gouvernance locale
    if any(phrase in titre_lower for phrase in ["collectivités", "territoires", "communes", "maires", "local", "outre-mer", "décentralisation", "gouvernance locale"]):
        themes.append("Collectivités territoriales")
    # Sens économique/entreprises
    if any(phrase in titre_lower for phrase in ["économie", "entreprises", "commerce", "marchés", "pme", "artisanat", "investissement"]):
        themes.append("Économie et finances")
        themes.append("Entreprises, PME, commerce et artisanat")
    # Sens fiscal
    if any(phrase in titre_lower for phrase in ["fiscal", "impôts", "taxes", "exonération", "déduction", "revenus"]):
        themes.append("Fiscalité")
    # Sens international/diplomatique
    if any(phrase in titre_lower for phrase in ["accord", "convention", "ratification", "ue", "international", "européenne", "nations unies", "diplomatie"]):
        themes.append("Traités et conventions")
    # Sens mobilité/infrastructures
    if any(phrase in titre_lower for phrase in ["transports", "mobilité", "route", "ferroviaire", "aérien", "logistique"]):
        themes.append("Transports")
    # Sens culturel/patrimonial
    if any(phrase in titre_lower for phrase in ["culture", "patrimoine", "arts", "audiovisuel", "médias"]):
        themes.append("Culture")
    # Sens budgétaire/public
    if any(phrase in titre_lower for phrase in ["budget", "finances publiques", "loi de finances", "dépenses publiques"]):
        themes.append("Budget")
    # Sens urbanisme/développement
    if any(phrase in titre_lower for phrase in ["aménagement", "territoire", "urbanisme", "logement", "rural", "développement territorial"]):
        themes.append("Aménagement du territoire")
    # Sens sportif/loisirs
    if any(phrase in titre_lower for phrase in ["sports", "olympiques", "activités physiques", "loisirs"]):
        themes.append("Sports")

    # Fallback si rien ne match
    if not themes:
        if any(phrase in titre_lower for phrase in ["loi", "réforme", "constitutionnelle", "parlement", "élection"]):
            themes.append("Collectivités territoriales")
        elif any(phrase in titre_lower for phrase in ["économique", "financier", "investissement"]):
            themes.append("Économie et finances")
        else:
            themes.append("Police et sécurité")

    return ", ".join(set(themes))  # Uniques, séparés par virgule

def get_statut_final(chronologie):
    if not chronologie:
        return "Incomplet"
    codes = [et["infos_brutes"]["code_acte"] for et in chronologie if et["infos_brutes"]["code_acte"]]
    if "PROM" in codes:
        return "Promulguée"
    if any("DEC" in code for code in codes):
        return "Adoptée" if "REJET" not in str(codes).upper() else "Rejetée"
    return "En cours"

# Programme principal
def main():
    print("Recherche des fichiers JSON dans le dossier courant...")
    print(f"Dossier actuel : {os.getcwd()}\n")

    lignes = []
    for fichier in os.listdir('.'):
        if fichier.lower().endswith('.json'):
            try:
                data = parse_dossier_json(fichier)
                if data:
                    lignes.append(data)
                    print(f"✓ Traitement OK : {fichier}")
                else:
                    print(f"✗ Ignoré (vide) : {fichier}")
            except Exception as e:
                print(f"✗ Erreur sur {fichier} : {str(e)}")

    if not lignes:
        print("Aucun dossier valide traité.")
        return

    df = pd.DataFrame(lignes)
    colonnes = [
        "numero_dossier",
        "type_texte", "titre_texte", "auteur",
        "lien_dossier_an", "lien_dossier_senat", "lien_dossier_legifrance",
        "statut_final",
        "date_depot", "date_promulgation", "delai_jours",
        "themes",
        "chronologie_complete"
    ]
    df = df[[c for c in colonnes if c in df.columns]]

    csv_path = "loiclair_dossiers_v1.4.csv"
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\nCSV v1.4 créé : {csv_path}")

    xlsx_path = "loiclair_dossiers_v1.4.xlsx"
    df.to_excel(xlsx_path, index=False, engine='openpyxl')
    print(f"XLSX v1.4 créé : {xlsx_path} (testez les liens et les thèmes !)")

    print(f"\nTotal dossiers traités avec succès : {len(lignes)}")

if __name__ == "__main__":
    main()