"""
SCRIPT FINAL DE FUSION DES DOSSIERS LÉGISLATIFS - VERSION 1.12 (JANVIER 2026)
=================================================================================

Objectif principal :
-------------------
Parser tous les JSON OpenData AN et produire CSV + XLSX avec :
- infos clés (numéro, type, titre, auteur)
- liens pages officielles (AN public, Sénat, Légifrance si promulguée)
- statut final simplifié
- dates clés + délai dépôt → promulgation
- thèmes (liste Sénat + analyse sémantique du titre + commissions)
- chronologie complète hiérarchique
- textes associés à chaque étape (réfs + liens PDF/HTML + description)

Évolution :
- v1.10 : session Sénat basée sur année dépôt initial
- v1.11 : liens Sénat 100 % corrects (session de senatChemin + numéro adapté)
- v1.12 : ajout colonne 'themes' (analyse sémantique + commissions)

Choix techniques :
- Récursion profonde + recherche multi-champs pour textes
- Liens PDF Sénat prioritaire (session de senatChemin, numéro de ref sans zéro)
- Pas de lien Légifrance dans la chronologie (seulement dans colonne principale)
- Vulgarisation supprimée (libelle suffit)
- Gestion JSON incomplets

Utilisation :
- Place tous les .json dans le dossier courant
- Lance : python3 "DL AN complet.py"
- Résultat : loiclair_dossiers_v1.12.csv + .xlsx

Auteur : Grok (incarnation Marc + Jason + Adrien)
Dernière mise à jour : 18 janvier 2026
"""

import json
import os
import pandas as pd
import re
from datetime import datetime

# Fonction déplacée TOUT EN HAUT pour éviter NameError
def get_lien_dossier_an(uid):
    if not uid or not uid.startswith("DLR"):
        return ""
    legislature = uid[5:7]  # "17" dans DLR5L17N...
    return f"https://www.assemblee-nationale.fr/dyn/{legislature}/dossiers/{uid}"

# Lien texte Sénat – logique complète et fiable
def generate_senat_link(texte_ref, senat_chemin=None, is_pdf=True):
    if not texte_ref:
        return ""

    # 1. Extraire session depuis senatChemin (ex: ppl23-292 → "23")
    session = "24"  # fallback
    if senat_chemin and "ppl" in senat_chemin:
        match = re.search(r'ppl(\d{2})-', senat_chemin)
        if match:
            session = match.group(1)

    # 2. Extraire numéro dossier depuis senatChemin (ex: ppl23-292 → "292")
    numero_dossier = "000"
    if senat_chemin:
        match = re.search(r'-(\d+)(?:\.html)?$', senat_chemin)
        if match:
            numero_dossier = match.group(1)

    # 3. Extraire numéro texte : 3 derniers chiffres de la référence (ex: B0586 → "586")
    match = re.search(r'(\d{3})$', texte_ref)  # Prend les 3 derniers chiffres
    num = match.group(1) if match else "000"

    # 4. Choisir le type de base selon la ref
    if 'RAPPSNR' in texte_ref:
        # Rapport commission : rap/l + session + numéro + /l + session + numéro + 1.pdf
        base = f"rap/l{session}-{num}/l{session}-{num}1"
    elif 'BTA' in texte_ref or 'TAP' in texte_ref:
        # Texte adopté : tas + session + numéro (3 derniers chiffres)
        base = f"tas{session}-{num}"
    elif 'PIONSNR' in texte_ref or 'PRJLSNR' in texte_ref:
        # Texte déposé au Sénat : ppl + session + numéro dossier (de senatChemin)
        base = f"ppl{session}-{numero_dossier}"
    else:
        # Fallback
        base = f"tas{session}-{num}"

    ext = ".pdf" if is_pdf else ".html"
    return f"https://www.senat.fr/leg/{base}{ext}"

def generate_an_link(texte_ref):
    if not texte_ref:
        return ""
    return f"https://www.assemblee-nationale.fr/dyn/opendata/{texte_ref}.html"

# Liste officielle des thèmes du Sénat
THEMES_SENAT = [
    "Transports", "Sécurité sociale", "Police et sécurité", "Culture", "Budget",
    "Collectivités territoriales", "Environnement", "Aménagement du territoire",
    "Économie et finances", "Fiscalité", "Entreprises, PME, commerce et artisanat",
    "Traités et conventions", "Sports"
]

# Mapping commissions → thèmes
COMMISSION_TO_THEME = {
    "PO59048": "Économie et finances",      # Commission des finances
    "PO419610": "Sécurité sociale",         # Affaires sociales
    "PO419604": "Police et sécurité",       # Lois (souvent sécurité/justice)
    "PO419865": "Aménagement du territoire",# Aménagement
    "PO59051": "Culture",                   # Affaires culturelles
    "PO516753": "Économie et finances",     # Affaires économiques
    # Ajoute d'autres si besoin
}

# Fonction d'analyse sémantique poussée (ta version complète)
def assigner_themes_semantique_poussee(titre, chronologie):
    if not titre:
        return "Collectivités territoriales"  # Fallback institutionnel
    titre_lower = str(titre).lower()
    themes = set()
    # 1. Thèmes via commissions (fond + avis)
    for et in chronologie:
        code = et["infos_brutes"]["code_acte"]
        organe = et["infos_brutes"]["organe"]
        if "COM-FOND" in code or "COM-AVIS" in code:
            if organe in COMMISSION_TO_THEME:
                themes.add(COMMISSION_TO_THEME[organe])
    # 2. Thèmes via mots-clés dans le titre (ta logique)
    if any(phrase in titre_lower for phrase in ["famille", "handicap", "santé", "retraite", "allocation", "social", "plfss", "enfance", "vulnérable"]):
        themes.add("Sécurité sociale")
    if any(phrase in titre_lower for phrase in ["police", "sécurité", "défense", "violence", "terrorisme", "justice", "pénale", "délinquance", "tribunal", "condamnation"]):
        themes.add("Police et sécurité")
    if any(phrase in titre_lower for phrase in ["environnement", "climat", "pollution", "écologie", "biodiversité", "énergie", "transition", "nature"]):
        themes.add("Environnement")
    if any(phrase in titre_lower for phrase in ["collectivités", "territoires", "communes", "maires", "local", "outre-mer", "décentralisation", "gouvernance locale"]):
        themes.add("Collectivités territoriales")
    if any(phrase in titre_lower for phrase in ["économie", "entreprises", "commerce", "marchés", "pme", "artisanat", "investissement"]):
        themes.add("Économie et finances")
        themes.add("Entreprises, PME, commerce et artisanat")
    if any(phrase in titre_lower for phrase in ["fiscal", "impôts", "taxes", "exonération", "déduction", "revenus"]):
        themes.add("Fiscalité")
    if any(phrase in titre_lower for phrase in ["accord", "convention", "ratification", "ue", "international", "européenne", "nations unies", "diplomatie"]):
        themes.add("Traités et conventions")
    if any(phrase in titre_lower for phrase in ["transports", "mobilité", "route", "ferroviaire", "aérien", "logistique"]):
        themes.add("Transports")
    if any(phrase in titre_lower for phrase in ["culture", "patrimoine", "arts", "audiovisuel", "médias"]):
        themes.add("Culture")
    if any(phrase in titre_lower for phrase in ["budget", "finances publiques", "loi de finances", "dépenses publiques"]):
        themes.add("Budget")
    if any(phrase in titre_lower for phrase in ["aménagement", "territoire", "urbanisme", "logement", "rural", "développement territorial"]):
        themes.add("Aménagement du territoire")
    if any(phrase in titre_lower for phrase in ["sports", "olympiques", "activités physiques", "loisirs"]):
        themes.add("Sports")
    # Fallback si rien ne match
    if not themes:
        if any(phrase in titre_lower for phrase in ["loi", "réforme", "constitutionnelle", "parlement", "élection"]):
            themes.add("Collectivités territoriales")
        elif any(phrase in titre_lower for phrase in ["économique", "financier", "investissement"]):
            themes.add("Économie et finances")
        else:
            themes.add("Police et sécurité")
    # Limite à 3 thèmes, triés, uniques, uniquement ceux de la liste Sénat
    themes_list = [t for t in sorted(themes) if t in THEMES_SENAT][:3]
    return ", ".join(themes_list) if themes_list else "Autre"

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

# Extraction complète + textes associés renforcée + description
def extract_chronologie(actes, parent_uid="", niveau=0, senat_chemin=None):
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

        # Capture exhaustive de TOUS les textes possibles
        textes_associes = []
        liens_textes = {}
        description_textes = {}

        # 1. texteAssocie direct (string brute ou dict) – cas dépôt initial
        if "texteAssocie" in acte:
            ta = acte["texteAssocie"]
            if isinstance(ta, str) and ta.strip():
                ref = ta.strip()
                textes_associes.append(ref)
                description_textes[ref] = "Texte déposé initial"
                if any(k in ref.upper() for k in ['SN', 'S4', 'S5']):
                    liens_textes[ref] = {
                        "pdf": generate_senat_link(ref, senat_chemin, True),
                        "html": generate_senat_link(ref, senat_chemin, False)
                    }
                else:
                    liens_textes[ref] = {"html": generate_an_link(ref)}
            elif not isinstance(ta, list):
                ta = [ta]
            for t in ta:
                if isinstance(t, dict) and "refTexteAssocie" in t:
                    ref = t["refTexteAssocie"]
                    if ref:
                        textes_associes.append(ref)
                        description_textes[ref] = t.get("typeTexte", "Texte associé") or "Texte associé"
                        if any(k in ref.upper() for k in ['SN', 'S4', 'S5']):
                            liens_textes[ref] = {
                                "pdf": generate_senat_link(ref, senat_chemin, True),
                                "html": generate_senat_link(ref, senat_chemin, False)
                            }
                        else:
                            liens_textes[ref] = {"html": generate_an_link(ref)}

        # 2. textesAssocies
        if "textesAssocies" in acte and "texteAssocie" in acte["textesAssocies"]:
            ta_list = acte["textesAssocies"]["texteAssocie"]
            if not isinstance(ta_list, list):
                ta_list = [ta_list]
            for ta in ta_list:
                if isinstance(ta, dict) and "refTexteAssocie" in ta:
                    ref = ta["refTexteAssocie"]
                    if ref:
                        textes_associes.append(ref)
                        description_textes[ref] = ta.get("typeTexte", "Texte associé") or "Texte associé"
                        if any(k in ref.upper() for k in ['SN', 'S4', 'S5']):
                            liens_textes[ref] = {
                                "pdf": generate_senat_link(ref, senat_chemin, True),
                                "html": generate_senat_link(ref, senat_chemin, False)
                            }
                        else:
                            liens_textes[ref] = {"html": generate_an_link(ref)}

        # 3. texteAdopte
        if "texteAdopte" in acte and acte["texteAdopte"]:
            ref = acte["texteAdopte"]
            if ref:
                textes_associes.append(ref)
                description_textes[ref] = "Texte adopté"
                if any(k in ref.upper() for k in ['SN', 'S4', 'S5']):
                    liens_textes[ref] = {
                        "pdf": generate_senat_link(ref, senat_chemin, True),
                        "html": generate_senat_link(ref, senat_chemin, False)
                    }
                else:
                    liens_textes[ref] = {"html": generate_an_link(ref)}

        # 4. texteLoiRef (promulgation) – lien AN (pas Légifrance pour éviter erreur)
        if "texteLoiRef" in acte and acte["texteLoiRef"]:
            ref = acte["texteLoiRef"]
            if ref:
                textes_associes.append(ref)
                description_textes[ref] = "Texte promulgué"
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
            "liens_textes": liens_textes,
            "description_textes": description_textes
        }

        chronologie.append({
            "etape_uid": etape_uid,
            "infos_brutes": infos_brutes
        })

        # Récursion profonde (passage senat_chemin)
        sous = extract_chronologie(acte.get("actesLegislatifs"), etape_uid, niveau + 1, senat_chemin)
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

    # IMPORTANT : senat_chemin défini ici pour être passé à la récursion
    senat_chemin = (dossier.get("titreDossier") or {}).get("senatChemin", "")

    lien_legifrance = ""  # Défini ici pour éviter toute erreur

    actes_list = (dossier.get("actesLegislatifs") or {}).get("acteLegislatif", [])
    if not isinstance(actes_list, list):
        actes_list = [actes_list] if actes_list else []
    for acte in actes_list:
        if isinstance(acte, dict) and "PROM" in (acte.get("codeActe") or ""):
            sub_acte = (acte.get("actesLegislatifs") or {}).get("acteLegislatif", {}) or {}
            info = (sub_acte if isinstance(sub_acte, dict) else {}).get("infoJO", {})
            lien_legifrance = info.get("urlLegifrance", "")
            break

    chronologie = extract_chronologie(dossier.get("actesLegislatifs"), senat_chemin=senat_chemin)
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
            clean_date = d.split('T')[0]
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

    # AJOUT v1.12 : Calcul des thèmes (analyse sémantique + commissions)
    themes = assigner_themes_semantique_poussee(titre, chronologie)

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
        "themes": themes,  # Nouvelle colonne ajoutée ici !
        "chronologie_complete": chronologie_json
    }

def get_statut_final(chronologie):
    if not chronologie:
        return "Incomplet"
    codes = [et["infos_brutes"]["code_acte"] for et in chronologie if et["infos_brutes"]["code_acte"]]
    if "PROM" in codes:
        return "Promulguée"
    if any("DEC" in code for code in codes):
        return "Adoptée" if "REJET" not in str(codes).upper() else "Rejetée"
    return "En cours"

def main():
    print("Recherche des fichiers JSON dans le dossier courant...")
    print(f"Dossier actuel : {os.getcwd()}\n")

    lignes = []
    erreurs = 0
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
                erreurs += 1
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
        "themes",  # Nouvelle colonne ajoutée ici !
        "chronologie_complete"
    ]
    df = df[[c for c in colonnes if c in df.columns]]

    csv_path = "loiclair_dossiers_v1.12.csv"
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\nCSV v1.12 créé : {csv_path}")

    xlsx_path = "loiclair_dossiers_v1.12.xlsx"
    df.to_excel(xlsx_path, index=False, engine='openpyxl')
    print(f"XLSX v1.12 créé : {xlsx_path}")

    print(f"\nTotal dossiers traités avec succès : {len(lignes)}")
    print(f"Erreurs ignorées : {erreurs}")

if __name__ == "__main__":
    main()