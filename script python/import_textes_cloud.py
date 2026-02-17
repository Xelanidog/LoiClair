# import_textes_cloud.py
# Script pour importer tous les JSON textes d'un dossier dans Supabase table 'textes' depuis url AN
# Exécute avec : python import_textes.py

# Notes:
## Texte du senat avant 1990 environ ont une architecture de lien completement differente
## A FAIRE - ALCNANR -> non publie dans les texte mais present dans compte rendu de seance


import json
import os
import requests
import io
import zipfile
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
from tqdm import tqdm


# ===================================================================
# Téléchargement du ZIP (comme pour les dossiers)
# ===================================================================
def download_zip(url: str) -> zipfile.ZipFile:
    """Télécharge le ZIP en mémoire depuis l'URL."""
    print(f"Téléchargement du ZIP depuis : {url}")
    response = requests.get(url)
    response.raise_for_status()  # erreur si lien mort
    return zipfile.ZipFile(io.BytesIO(response.content))


# Charger env vars de .env.local
load_dotenv(dotenv_path="/Users/algodin/Documents/LoiClair website/loiclair/.env.local")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")

supabase: Client = create_client(supabase_url, supabase_key)


def reconstruire_liens_texte(
    uid,
    date_depot=None,
    num_notice=None,
    date_publication=None,
    date_creation=None,
    legislature=None,
):
    # Section : Gestion des cas spécifiques pour liens PDF/HTML basés sur UID et dates.
    # Cas ETDIANR : PDF avec extraction legislature et num
    if uid.startswith("ETDIANR"):
        # Exemple uid: ETDIANR5L16B2628
        # Extraire legislature (après L) et num (après B)
        parts = uid.split("L")[-1].split("B")  # Split pour isoler LXXBYYYY
        if len(parts) == 2:
            legislature = parts[0]  # '16'
            num = parts[1]  # '2628'
            return f"https://www.assemblee-nationale.fr/dyn/{legislature}/textes/l{legislature}b{num}_etude-impact.pdf"
        else:
            print(f"Format ETDIANR invalide pour {uid}, lien=None.")
            return None

    # Nouveau : Cas LETTANR : PDF avec extraction legislature et num, suffixe _lettre-rectificative.pdf
    if uid.startswith("LETTANR"):
        # Exemple uid: LETTANR5L17B1999
        # Extraire legislature (après L) et num (après B)
        parts = uid.split("L")[-1].split("B")  # Split pour isoler LXXBYYYY
        if len(parts) == 2:
            legislature = parts[0]  # '17'
            num = parts[1]  # '1999'
            return f"https://www.assemblee-nationale.fr/dyn/{legislature}/textes/l{legislature}b{num}_lettre-rectificative.pdf"
        else:
            print(f"Format LETTANR invalide pour {uid}, lien=None.")
            return None

    # Cas ACINANR : PDF avec extraction legislature et num, suffixe _accord-international.pdf
    if uid.startswith("ACINANR"):
        # Exemple uid: ACINANR5L16B2347
        # Extraire legislature (après L) et num (après B)
        parts = uid.split("L")[-1].split("B")  # Split pour isoler LXXBYYYY
        if len(parts) == 2:
            legislature = parts[0]  # '16'
            num = parts[1]  # '2347'
            return f"https://www.assemblee-nationale.fr/dyn/{legislature}/textes/l{legislature}b{num}_accord-international.pdf"
        else:
            print(f"Format ACINANR invalide pour {uid}, lien=None.")
            return None

    # Cas AVCEANR : PDF avec extraction legislature et num, suffixe _avis-conseil-etat.pdf
    if uid.startswith("AVCEANR"):
        # Exemple uid: AVCEANR5L16B0639
        # Extraire legislature (après L) et num (après B)
        parts = uid.split("L")[-1].split("B")  # Split pour isoler LXXBYYYY
        if len(parts) == 2:
            legislature = parts[0]  # '16'
            num = parts[1]  # '0639'
            return f"https://www.assemblee-nationale.fr/dyn/{legislature}/textes/l{legislature}b{num}_avis-conseil-etat.pdf"
        else:
            print(f"Format AVCEANR invalide pour {uid}, lien=None.")
            return None

    # Cas AVISSNR : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe 1.pdf/html si <2006
    if uid.startswith("AVISSNR"):
        if not date_depot or not num_notice:
            print(f"Manque date_depot ou num_notice pour AVISSNR {uid}, lien=None.")
            return None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Manque toute date pour AVISSNR {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = f"a{session_start_year % 100:02d}"
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits
            suffix = ".html" if year < 2006 else "1.pdf"
            return f"https://www.senat.fr/rap/{session_code}-{padded_num}/{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing date pour AVISSNR {uid}: {e}, lien=None.")
            return None

    # Cas RAPPSNR sans BTA : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe 1.pdf/html si <2006
    if uid.startswith("RAPPSNR") and "BTA" not in uid:
        # Fallback pour num_notice : extraire de l'UID si absent (dernier segment après 'B')
        if not num_notice:
            try:
                parts = uid.split("B")[-1]  # Ex. : 'RAPPSNR5S459B0173' → '0173'
                num_notice = "".join(
                    [c for c in parts if c.isdigit()]
                )  # Nettoie aux digits
                if not num_notice:
                    raise ValueError("Aucun num_notice extractible")
            except Exception as e:
                print(f"Erreur fallback num_notice pour {uid}: {e}, lien=None.")
                return None
        # Fallback pour date : tester toutes les options ; si aucune, lien=None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Aucune date disponible pour RAPPSNR {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = (
                f"l{session_start_year % 100:02d}"  # Ex. : 'a25' pour session 2025-2026
            )
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits
            suffix = (
                ".html" if year < 2006 else "1.pdf"
            )  # Adaptation historique des formats Sénat
            return f"https://www.senat.fr/rap/{session_code}-{padded_num}/{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing pour RAPPSNR {uid}: {e}, lien=None.")
            return None

    # Cas RAPPSNR avec BTA : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe .pdf/html si <2006
    # Adaptation pour textes adoptés : utilise 'tas' au lieu de 'rap' (pattern standard Sénat pour TA).
    if uid.startswith("RAPPSNR") and "BTA" in uid:
        # Fallback pour num_notice : extraire de l'UID si absent (dernier segment après 'BTA')
        if not num_notice:
            try:
                parts = uid.split("BTA")[-1]  # Ex. : 'RAPPSNR5S459BTA0173' → '0173'
                num_notice = "".join(
                    [c for c in parts if c.isdigit()]
                )  # Nettoie aux digits
                if not num_notice:
                    raise ValueError("Aucun num_notice extractible")
            except Exception as e:
                print(f"Erreur fallback num_notice pour {uid}: {e}, lien=None.")
                return None
        # Fallback pour date : tester toutes les options ; si aucune, lien=None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Aucune date disponible pour RAPPSNR BTA {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = (
                f"{session_start_year % 100:02d}"  # Sans 'a' pour tas (pattern Sénat)
            )
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits
            suffix = (
                ".html" if year < 2006 else ".pdf"
            )  # Sans '1' pour tas (basé sur docs Sénat)
            return f"https://www.senat.fr/leg/tas{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing pour RAPPSNR BTA {uid}: {e}, lien=None.")
            return None

    # Cas PIONSNR : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe .pdf/html si <2006
    if uid.startswith("PIONSNR") and "BTA" not in uid:
        if not num_notice:
            print(f"Manque num_notice pour PIONSNR {uid}, lien=None.")
            return None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Manque toute date pour PIONSNR {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = f"{session_start_year % 100:02d}"
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits
            suffix = ".html" if year < 2007 else ".pdf"
            return f"https://www.senat.fr/leg/ppl{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing date pour PIONSNR {uid}: {e}, lien=None.")
            return None

    # Cas PIONSNR avec BTA : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe .pdf/html si <2006
    if uid.startswith("PIONSNR") and "BTA" in uid:
        if not num_notice:
            print(f"Manque num_notice pour PIONSNR BTA {uid}, lien=None.")
            return None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Manque toute date pour PIONSNR BTA {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = f"{session_start_year % 100:02d}"
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits
            suffix = ".html" if year < 2007 else ".pdf"
            return f"https://www.senat.fr/leg/tas{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing date pour PIONSNR BTA {uid}: {e}, lien=None.")
            return None

    # Cas pour AN avant L15 : Liens ASP basés sur legislature < 15
    if uid.startswith("PIONANR"):
        # Priorité : utiliser legislature passée en paramètre si disponible
        leg_str = legislature if legislature else None
        if not leg_str:
            # Fallback : extraire de l'UID (après L et avant B ou suffixe)
            try:
                parts = uid.split("L")[-1].split("B")  # Split standard
                leg_str = parts[0]  # Prend les premiers chars après 'L'
                # Extraire seulement les digits initiaux (ex. '16TAP' → '16')
                leg_str = "".join([c for c in leg_str if c.isdigit()])
            except Exception as e:
                print(
                    f"Erreur extraction legislature de UID pour {uid}: {e}, passe au cas standard."
                )
                leg_str = None
        if leg_str:
            try:
                leg_int = int(leg_str)
                if leg_int < 15:
                    padded_num = f"{int(num_notice):04d}"  # Padding à 4 digits
                    if "BTA" in uid:
                        return f"https://www.assemblee-nationale.fr/{leg_str}/ta/ta{padded_num}.asp"
                    elif "BTC" in uid:
                        return f"https://www.assemblee-nationale.fr/{leg_str}/ta-commission/r{padded_num}-a0.asp"
                    else:
                        return f"https://www.assemblee-nationale.fr/{leg_str}/propositions/pion{padded_num}.asp"
            except ValueError:
                print(f"Legislature invalide pour {uid}, passe au cas standard.")
        else:
            print(f"Pas de legislature disponible pour {uid}, passe au cas standard.")

    # Cas PRJLSNR sans BTA/BTC : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe .pdf/html si <2007
    if uid.startswith("PRJLSNR") and "BTA" not in uid and "BTC" not in uid:
        # Fallback pour num_notice : extraire de l'UID si absent (dernier segment après 'B')
        if not num_notice:
            try:
                parts = uid.split("B")[-1]  # Ex. : 'PRJLSNR5S459B0546' → '0546'
                num_notice = "".join(
                    [c for c in parts if c.isdigit()]
                )  # Nettoie aux digits
                if not num_notice:
                    raise ValueError("Aucun num_notice extractible")
            except Exception as e:
                print(f"Erreur fallback num_notice pour {uid}: {e}, lien=None.")
                return None
        # Fallback pour date : tester toutes les options ; si aucune, lien=None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Aucune date disponible pour PRJLSNR {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = f"{session_start_year % 100:02d}"  # Ex. : '24' pour session 2024-2025 (sans 'a' pour pjl)
            padded_num = (
                f"{int(num_notice):03d}"  # Padding à 3 digits (ex. '546' → '546')
            )
            suffix = ".html" if year < 2007 else ".pdf"  # Adaptation historique Sénat
            return f"https://www.senat.fr/leg/pjl{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing pour PRJLSNR {uid}: {e}, lien=None.")
            return None

    # Cas PRJLSNR avec BTC : Similaire à standard, utilise 'pjl' (pattern observé)
    if uid.startswith("PRJLSNR") and "BTC" in uid:
        # Fallback pour num_notice : extraire de l'UID si absent (dernier segment après 'BTC')
        if not num_notice:
            try:
                parts = uid.split("BTC")[-1]  # Ex. : 'PRJLSNR5S459BTC0668' → '0668'
                num_notice = "".join(
                    [c for c in parts if c.isdigit()]
                )  # Nettoie aux digits
                if not num_notice:
                    raise ValueError("Aucun num_notice extractible")
            except Exception as e:
                print(f"Erreur fallback num_notice pour {uid}: {e}, lien=None.")
                return None
        # Fallback pour date : tester toutes les options ; si aucune, lien=None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Aucune date disponible pour PRJLSNR BTC {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = f"{session_start_year % 100:02d}"  # Ex. : '24'
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits (ex. '668' → '668', mais exemple lien '618' → possible variante, ajuste si besoin)
            suffix = ".html" if year < 2007 else ".pdf"
            return f"https://www.senat.fr/leg/pjl{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing pour PRJLSNR BTC {uid}: {e}, lien=None.")
            return None

    # Cas PRJLSNR avec BTA : PDF/html avec calcul session, padding num_notice à 3 digits, suffixe .pdf/html si <2007
    if uid.startswith("PRJLSNR") and "BTA" in uid:
        # Fallback pour num_notice : extraire de l'UID si absent (dernier segment après 'BTA')
        if not num_notice:
            try:
                parts = uid.split("BTA")[-1]  # Ex. : 'PRJLSNR5S479BTA0009' → '0009'
                num_notice = "".join(
                    [c for c in parts if c.isdigit()]
                )  # Nettoie aux digits
                if not num_notice:
                    raise ValueError("Aucun num_notice extractible")
            except Exception as e:
                print(f"Erreur fallback num_notice pour {uid}: {e}, lien=None.")
                return None
        # Fallback pour date : tester toutes les options ; si aucune, lien=None
        date = date_depot or date_publication or date_creation
        if not date:
            print(f"Aucune date disponible pour PRJLSNR BTA {uid}, lien=None.")
            return None
        try:
            dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
            year = dt.year
            month = dt.month
            session_start_year = year if month >= 10 else year - 1
            session_code = f"{session_start_year % 100:02d}"  # Ex. : '24'
            padded_num = f"{int(num_notice):03d}"  # Padding à 3 digits (ex. '009' → '009', mais exemple lien '123' → variante possible)
            suffix = ".html" if year < 2007 else ".pdf"
            return f"https://www.senat.fr/leg/tas{session_code}-{padded_num}{suffix}"
        except Exception as e:
            print(f"Erreur parsing pour PRJLSNR BTA {uid}: {e}, lien=None.")
            return None

    # Cas HTML standards (AN) - étendu comme avant
    if uid.startswith(
        (
            "PIONANR",
            "RIONANR",
            "DECLANR",
            "AVISANR",
            "PNREANR",
            "RINFANR",
            "RAPPANR",
            "PRJLANR",
            "MIONANR",
        )
    ):
        lien = f"https://www.assemblee-nationale.fr/dyn/opendata/{uid}.html"
        # Modification : Si '-COMPA' dans UID, forcer PDF au lieu de HTML (pour comparatifs)
        if "-COMPA" in uid:
            lien = lien.replace(".html", ".pdf")
        return lien


def importer_texte(texte_data: dict, file_name: str = "unknown.json") -> list:
    """Traite UN texte (dict) et retourne une liste de payloads pour batch."""
    try:
        data = texte_data

        # Check préliminaire : s'assurer que data est un dict valide
        if not isinstance(data, dict):
            print(f"Data non valide (pas un dict) pour {file_name}, skip.")
            return []

        # Nouvelle branche pour gérer les dossiers législatifs et extraire les textes promulgués
        if "dossierParlementaire" in data:
            try:
                dossier = data["dossierParlementaire"]
                uid_dossier = dossier.get("uid")
                legislature = (
                    int(dossier.get("legislature"))
                    if dossier.get("legislature")
                    else None
                )
                payloads = []

                # Extraction robuste des actes : gère si actesLegislatifs est None ou non-dict (ex. : list inattendue ou autre type)
                acts_leg = dossier.get("actesLegislatifs")
                if acts_leg is None or not isinstance(acts_leg, dict):
                    actes = []  # Fallback safe si absent ou invalide
                    print(
                        f"Debug: actesLegislatifs absent ou invalide pour {file_name}, set actes=[]"
                    )
                else:
                    actes = acts_leg.get(
                        "acteLegislatif", []
                    )  # Safe get avec default []

                # Normaliser en liste si ce n'est pas déjà le cas (robustesse)
                if not isinstance(actes, list):
                    actes = [actes] if actes is not None else []

                # Filtre final pour enlever tout None restant
                actes = [a for a in actes if a is not None]

                for acte in actes:

                    if acte.get("codeActe") == "PROM":
                        # Extraction robuste de sub_acts : gère si actesLegislatifs est None ou non-dict
                        sub_acts = acte.get("actesLegislatifs")
                        if sub_acts is None or not isinstance(sub_acts, dict):
                            print(
                                f"Debug: sub_acts absent ou invalide pour PROM dans {file_name}, skip PROM."
                            )
                            continue  # Skip ce PROM invalide
                        prom_acte = sub_acts.get("acteLegislatif")

                        if prom_acte is None:
                            print(
                                f"Debug: prom_acte is None pour PROM dans {file_name}, set to {{}}."
                            )
                            prom_acte = {}
                        elif isinstance(prom_acte, list):
                            prom_acte = [p for p in prom_acte if p is not None]
                            prom_acte = prom_acte[0] if prom_acte else {}
                        elif not isinstance(prom_acte, dict):
                            print(
                                f"Debug: prom_acte inattendu (type={type(prom_acte)}) pour PROM dans {file_name}, set to {{}}."
                            )
                            prom_acte = {}  # Fallback safe

                        if prom_acte.get("codeActe") == "PROM-PUB":
                            code_loi = prom_acte.get("codeLoi")
                            titre_loi = prom_acte.get("titreLoi")
                            info_jo = prom_acte.get("infoJO", {})
                            url_legifrance = info_jo.get("urlLegifrance")
                            date_jo_str = info_jo.get("dateJO")
                            reference_nor = info_jo.get("referenceNOR")

                            # Parsing de la date JO (ex. : "2025-12-27+01:00" -> ignorer timezone et parser YYYY-MM-DD)
                            date_publication = None
                            if date_jo_str:
                                date_jo_str = date_jo_str.split("+")[
                                    0
                                ]  # Retirer +01:00 si présent
                                try:
                                    date_publication = datetime.strptime(
                                        date_jo_str, "%Y-%m-%d"
                                    ).isoformat()
                                except ValueError:
                                    print(
                                        f"Erreur parsing date JO pour dossier {uid_dossier}: {date_jo_str}"
                                    )

                            # Générer UID unique pour le texte promulgué (ex. : LOI2025-1316)
                            uid_texte = (
                                f"LOI{code_loi.replace('-', '')}" if code_loi else None
                            )

                            if not uid_texte or not url_legifrance:
                                print(
                                    f"Manque codeLoi ou urlLegifrance pour PROM dans {uid_dossier}, skip."
                                )
                                continue

                            # Data pour upsert du texte promulgué
                            data_texte = {
                                "uid": uid_texte,
                                "lien_texte": url_legifrance,
                                "titre_principal": titre_loi,
                                "legislature": legislature,
                                "date_publication": date_publication,
                                "provenance": "LEGIFRANCE",  # Ou 'JO' si préféré
                                "dossier_ref": uid_dossier,
                                "classification": json.dumps(
                                    {"code": "LOI", "libelle": "Loi promulguée"}
                                ),  # JSONB
                                "statut_adoption": "PROMULGUE",
                                "libelle_statut_adoption": "Promulguée",
                                "type_code": "LOI",
                                "type_libelle": "Loi",
                                # Champs optionnels à None (pas applicables pour lois promulguées)
                                "date_creation": None,
                                "date_depot": None,
                                "denomination": (
                                    f"Loi n° {code_loi}" if code_loi else None
                                ),
                                "num_notice": reference_nor,  # Utiliser NOR si présent
                                "organe_auteur_ref": None,
                                "organe_referent_ref": None,
                                "depot_amendements": None,
                                "refs_brutes": json.dumps(
                                    info_jo
                                ),  # Stocker brut pour référence
                                "depot_code": None,
                                "depot_libelle": None,
                                "auteurs_refs": None,
                                "rapporteurs_refs": None,
                                "parent_uid": None,
                                "titre_principal_court": (
                                    titre_loi[:100] if titre_loi else None
                                ),  # Court-circuit si long
                            }

                            payloads.append(data_texte)

                            # Sortir après traitement du PROM (assume un seul par dossier)
                            break

                # Si c'est un dossier, on ne continue pas vers le traitement texte standard
                return payloads

            except Exception as e:
                print(f"Erreur traitement dossier {file_name}: {e}")
                return []  # Skip le fichier en cas d'erreur

        texte = data.get("document", {})
        if not texte or not isinstance(texte, dict):
            print(f"Fichier {file_name} invalide (pas de 'document' dict), skip.")
            return

        uid = texte.get("uid")
        if not uid:
            print(f"Fichier {file_name} sans uid, skip.")
            return

        # Section : Extraction des données communes (pour parent et tomes)
        lien_html = reconstruire_liens_texte(
            uid,
            date_depot=texte.get("cycleDeVie", {}).get("chrono", {}).get("dateDepot"),
            num_notice=texte.get("notice", {}).get("numNotice"),
            date_publication=texte.get("cycleDeVie", {})
            .get("chrono", {})
            .get("datePublication"),
            date_creation=texte.get("cycleDeVie", {})
            .get("chrono", {})
            .get("dateCreation"),
        )
        # Extraction et normalisation majuscule pour titre_principal (première lettre majuscule)
        titre_principal = (
            texte.get("titres", {}).get("titrePrincipal")
            if texte.get("titres")
            else None
        )
        if titre_principal:
            titre_principal = titre_principal.capitalize()
            # Extraction du titre court (titrePrincipalCourt), avec fallback à None si absent
        titre_principal_court = texte.get("titres", {}).get("titrePrincipalCourt")
        # Capitalisation : met la première lettre en majuscule si le titre existe et n'est pas vide
        if titre_principal_court:
            titre_principal_court = titre_principal_court.capitalize()
        # Déduction libelle_statut_adoption (mapping simple ; ajuste si besoin)
        classification = (
            texte.get("classification", {}) if texte.get("classification") else {}
        )  # Guard pour None
        statut_adoption = classification.get("statutAdoption")
        libelle_statut = {
            "ADOPTSEANCE": "Adopté en séance",
            "ADOPTCOM": "Adopté en comission",
            "REJETSEANCE": "Rejeté en séance",
            # Ajoute d'autres mappings si tu en as
        }.get(statut_adoption, "Non défini")
        # Extraction depot code/libelle (de classification.famille.depot)
        famille = (
            classification.get("famille", {}) if classification.get("famille") else {}
        )  # Guard pour None
        depot = famille.get("depot", {})
        depot_code = depot.get("code") if depot else None
        depot_libelle = depot.get("libelle") if depot else None
        # Extraction type code/libelle (de classification.type)
        type_data = classification.get("type", {})  # Safe get, default dict vide
        type_code = type_data.get("code") if type_data else None
        type_libelle = type_data.get("libelle") if type_data else None
        # Auteurs et organe (gestion si list ou dict ou None)
        auteurs = texte.get("auteurs", {})
        auteurs_list = []
        if isinstance(auteurs, dict):
            auteur_data = auteurs.get("auteur")
            if isinstance(auteur_data, list):
                auteurs_list = auteur_data
            elif isinstance(auteur_data, dict):
                auteurs_list = [auteur_data]
        elif isinstance(auteurs, list):
            auteurs_list = auteurs
        if auteurs_list is None:
            auteurs_list = []
        # Extraction filtrée et sécurisée
        auteurs_refs = []
        rapporteurs_refs = []
        organe_auteur_ref = None
        for auteur in auteurs_list:
            if not isinstance(auteur, dict):
                continue
            # Ignore les entrées organe-only (pas d'acteur)
            acteur = auteur.get("acteur")
            if not acteur or not isinstance(acteur, dict):
                # C'est probablement un organe → on le garde pour organe_auteur_ref si besoin
                organe = auteur.get("organe", {})
                if organe and isinstance(organe, dict):
                    organe_auteur_ref = organe.get("organeRef")
                continue
            qualite = acteur.get("qualite")
            acteur_ref = acteur.get("acteurRef")
            if not qualite or not acteur_ref:
                continue
            if qualite == "auteur":
                auteurs_refs.append(acteur_ref)
            elif qualite == "rapporteur":
                rapporteurs_refs.append(acteur_ref)
        # Si on n'a pas trouvé d'organe via la boucle, fallback sur l'ancienne méthode (rare)
        if not organe_auteur_ref:
            organe_auteur_ref = (
                auteurs.get("auteur", {}).get("organe", {}).get("organeRef")
                if isinstance(auteurs.get("auteur", {}), dict)
                else None
            )

        payloads = []

        # Préparation des data pour le parent (toujours importé)
        data = {
            "uid": uid,  # Déjà safe, uid est vérifié avant
            "lien_texte": lien_html,  # Déjà safe de reconstruire_liens_texte
            "titre_principal": titre_principal,
            "legislature": (
                int(texte.get("legislature")) if texte.get("legislature") else None
            ),  # Déjà géré
            "date_creation": (
                texte.get("cycleDeVie", {}).get("chrono", {}).get("dateCreation")
                if texte.get("cycleDeVie")
                else None
            ),  # Déjà géré
            "date_depot": (
                texte.get("cycleDeVie", {}).get("chrono", {}).get("dateDepot")
                if texte.get("cycleDeVie")
                else None
            ),  # Déjà géré
            "date_publication": (
                texte.get("cycleDeVie", {}).get("chrono", {}).get("datePublication")
                if texte.get("cycleDeVie")
                else None
            ),  # Déjà géré
            "denomination": (
                texte.get("denominationStructurelle")
                if texte.get("denominationStructurelle")
                else None
            ),  # Ajouté else None pour safe
            "provenance": (
                texte.get("provenance", "AN") if texte.get("provenance") else "AN"
            ),  # Default 'AN' si absent
            "dossier_ref": (
                texte.get("dossierRef") if texte.get("dossierRef") else None
            ),  # Nullable, déjà safe
            "classification": (
                classification if classification else None
            ),  # Ajouté check (déjà variable)
            "statut_adoption": (
                statut_adoption if statut_adoption else None
            ),  # Ajouté check (déjà variable)
            "libelle_statut_adoption": (
                libelle_statut if libelle_statut else None
            ),  # Ajouté check (déjà variable)
            "num_notice": (
                texte.get("notice", {}).get("numNotice")
                if texte.get("notice")
                else None
            ),  # Ajouté check sur notice
            "organe_auteur_ref": (
                organe_auteur_ref if organe_auteur_ref else None
            ),  # Ajouté check (déjà variable)
            "organe_referent_ref": (
                texte.get("organesReferents", {}).get("organeRef")
                if texte.get("organesReferents")
                else None
            ),  # Ajouté check sur organesReferents
            "depot_amendements": (
                texte.get("depotAmendements") if texte.get("depotAmendements") else None
            ),  # Ajouté else None
            "refs_brutes": (
                texte.get("cycleDeVie") if texte.get("cycleDeVie") else None
            ),  # Ajouté else None
            "depot_code": depot_code,
            "depot_libelle": depot_libelle,
            "auteurs_refs": ",".join(auteurs_refs) if auteurs_refs else None,
            "type_code": type_code,
            "type_libelle": type_libelle,
            "rapporteurs_refs": (
                ",".join(rapporteurs_refs) if rapporteurs_refs else None
            ),
            "titre_principal_court": (
                titre_principal_court if titre_principal_court else None
            ),
        }
        payloads.append(data)

        # Gestion des divisions (tomes) : importer chaque tome comme texte autonome, avec parent_uid
        divisions = (
            texte.get("divisions", {}).get("division", [])
            if texte.get("divisions")
            else []
        )
        # Modification : Normaliser si 'division' est un dict unique (au lieu de list)
        if isinstance(divisions, dict):
            divisions = [divisions] if divisions else []
        divisions = [d for d in divisions if d is not None]
        if divisions is None:
            divisions = []
        # print(f"Debug: divisions type={type(divisions)}, len={len(divisions)}")  # Optionnel pour tracer
        if divisions:
            # Boucle sur chaque tome (division), avec tome 1 comme principal via héritage max
            for idx, division in enumerate(divisions):
                if not isinstance(division, dict):
                    continue  # Skip si invalide
                # Créer un texte_tome en copiant le parent et overridant avec les champs du tome
                texte_tome = texte.copy()  # Héritage des champs parents
                texte_tome.update(division)  # Override avec champs spécifiques du tome
                # Extraction uid du tome (obligatoire)
                uid_tome = texte_tome.get("uid")
                if not uid_tome:
                    print(f"Tome sans uid dans {file_name}, skip.")
                    continue
                # Lien pour le tome (utilise la même fonction)
                lien_html_tome = reconstruire_liens_texte(
                    uid_tome,
                    date_depot=texte_tome.get("cycleDeVie", {})
                    .get("chrono", {})
                    .get("dateDepot"),
                    num_notice=texte_tome.get("notice", {}).get("numNotice"),
                    date_publication=texte_tome.get("cycleDeVie", {})
                    .get("chrono", {})
                    .get("datePublication"),
                    date_creation=texte_tome.get("cycleDeVie", {})
                    .get("chrono", {})
                    .get("dateCreation"),
                )
                # Extraction des autres champs (réutilise la logique existante, adaptée au texte_tome)
                titre_principal_tome = (
                    texte_tome.get("titres", {}).get("titrePrincipal")
                    if texte_tome.get("titres")
                    else None
                )
                if titre_principal_tome:
                    titre_principal_tome = titre_principal_tome.capitalize()
                    # Extraction du titre court pour le tome enfant, avec fallback à None si absent
                titre_principal_court_tome = texte_tome.get("titres", {}).get(
                    "titrePrincipalCourt"
                )
                # Capitalisation : met la première lettre en majuscule si le titre existe et n'est pas vide
                if titre_principal_court_tome:
                    titre_principal_court_tome = titre_principal_court_tome.capitalize()
                classification_tome = (
                    texte_tome.get("classification")
                    if texte_tome.get("classification")
                    else {}
                )  # Guard pour None
                statut_adoption_tome = classification_tome.get("statutAdoption")
                libelle_statut_tome = {
                    "ADOPTSEANCE": "Adopté en séance",
                    "ADOPTCOM": "Adopté en comission",
                    "REJETSEANCE": "Rejeté en séance",
                    # Ajoute d'autres mappings si tu en as
                }.get(statut_adoption_tome, "Non défini")
                famille_tome = (
                    classification_tome.get("famille")
                    if classification_tome.get("famille")
                    else {}
                )  # Guard pour None
                depot_tome = famille_tome.get("depot", {})
                depot_code_tome = depot_tome.get("code") if depot_tome else None
                depot_libelle_tome = depot_tome.get("libelle") if depot_tome else None
                type_data_tome = classification_tome.get("type", {})
                type_code_tome = type_data_tome.get("code") if type_data_tome else None
                type_libelle_tome = (
                    type_data_tome.get("libelle") if type_data_tome else None
                )
                # Auteurs pour le tome (réutilise la logique filtrée)
                auteurs_tome = texte_tome.get("auteurs", {})
                auteurs_list_tome = []
                if isinstance(auteurs_tome, dict):
                    auteur_data_tome = auteurs_tome.get("auteur")
                    if isinstance(auteur_data_tome, list):
                        auteurs_list_tome = auteur_data_tome
                    elif isinstance(auteur_data_tome, dict):
                        auteurs_list_tome = [auteur_data_tome]
                elif isinstance(auteurs_tome, list):
                    auteurs_list_tome = auteurs_tome
                auteurs_refs_tome = []
                rapporteurs_refs_tome = []
                organe_auteur_ref_tome = None
                for auteur in auteurs_list_tome:
                    if not isinstance(auteur, dict):
                        continue
                    acteur = auteur.get("acteur")
                    if not acteur or not isinstance(acteur, dict):
                        organe = auteur.get("organe", {})
                        if organe and isinstance(organe, dict):
                            organe_auteur_ref_tome = organe.get("organeRef")
                        continue
                    qualite = acteur.get("qualite")
                    acteur_ref = acteur.get("acteurRef")
                    if not qualite or not acteur_ref:
                        continue
                    if qualite == "auteur":
                        auteurs_refs_tome.append(acteur_ref)
                    elif qualite == "rapporteur":
                        rapporteurs_refs_tome.append(acteur_ref)
                if not organe_auteur_ref_tome:
                    organe_auteur_ref_tome = (
                        auteurs_tome.get("auteur", {})
                        .get("organe", {})
                        .get("organeRef")
                        if isinstance(auteurs_tome.get("auteur", {}), dict)
                        else None
                    )
                # Data pour upsert du tome (similaire au principal)
                data_tome = {
                    "uid": uid_tome,
                    "lien_texte": lien_html_tome,
                    "titre_principal": titre_principal_tome,
                    "legislature": (
                        int(texte_tome.get("legislature"))
                        if texte_tome.get("legislature")
                        else None
                    ),
                    "date_creation": (
                        texte_tome.get("cycleDeVie", {})
                        .get("chrono", {})
                        .get("dateCreation")
                        if texte_tome.get("cycleDeVie")
                        else None
                    ),
                    "date_depot": (
                        texte_tome.get("cycleDeVie", {})
                        .get("chrono", {})
                        .get("dateDepot")
                        if texte_tome.get("cycleDeVie")
                        else None
                    ),
                    "date_publication": (
                        texte_tome.get("cycleDeVie", {})
                        .get("chrono", {})
                        .get("datePublication")
                        if texte_tome.get("cycleDeVie")
                        else None
                    ),
                    "denomination": (
                        texte_tome.get("denominationStructurelle")
                        if texte_tome.get("denominationStructurelle")
                        else None
                    ),
                    "provenance": (
                        texte_tome.get("provenance", "AN")
                        if texte_tome.get("provenance")
                        else "AN"
                    ),
                    "dossier_ref": (
                        texte_tome.get("dossierRef")
                        if texte_tome.get("dossierRef")
                        else texte.get("dossierRef")
                    ),  # Héritage si absent
                    "classification": (
                        classification_tome if classification_tome else None
                    ),
                    "statut_adoption": (
                        statut_adoption_tome if statut_adoption_tome else None
                    ),
                    "libelle_statut_adoption": (
                        libelle_statut_tome if libelle_statut_tome else None
                    ),
                    "num_notice": (
                        texte_tome.get("notice", {}).get("numNotice")
                        if texte_tome.get("notice")
                        else None
                    ),
                    "organe_auteur_ref": (
                        organe_auteur_ref_tome if organe_auteur_ref_tome else None
                    ),
                    "organe_referent_ref": (
                        texte_tome.get("organesReferents", {}).get("organeRef")
                        if texte_tome.get("organesReferents")
                        else None
                    ),
                    "depot_amendements": (
                        texte_tome.get("depotAmendements")
                        if texte_tome.get("depotAmendements")
                        else None
                    ),
                    "refs_brutes": (
                        texte_tome.get("cycleDeVie")
                        if texte_tome.get("cycleDeVie")
                        else None
                    ),
                    "depot_code": depot_code_tome,
                    "depot_libelle": depot_libelle_tome,
                    "auteurs_refs": ",".join(auteurs_refs) if auteurs_refs else None,
                    "type_code": type_code_tome,
                    "type_libelle": type_libelle_tome,
                    "rapporteurs_refs": (
                        ",".join(rapporteurs_refs) if rapporteurs_refs else None
                    ),
                    # Modification : Ajout du lien de parenté pour les tomes enfants
                    "parent_uid": uid,  # Référence au parent
                    "titre_principal_court": (
                        titre_principal_court_tome
                        if titre_principal_court_tome
                        else None
                    ),
                }

                payloads.append(data_tome)

        return payloads

    except Exception as e:
        print(f"Erreur générale pour {file_name}: {e}")
        return []


def importer_textes_from_zip(zip_ref: zipfile.ZipFile):
    """Importe TOUS les textes du ZIP en batch + barre de progression."""
    # On ne prend que les JSON dans le dossier "document/"
    # Filtre pour textes ET dossiers (pour PROM)
    json_files = [
        f
        for f in zip_ref.namelist()
        if (
            f.startswith("json/document/") or f.startswith("json/dossierParlementaire/")
        )
        and f.endswith(".json")
    ]

    print(f"\n{len(json_files)} fichiers textes trouvés dans le ZIP\n")
    # Debug : compter séparément
    textes_count = sum(1 for f in json_files if "document/" in f)
    dossiers_count = sum(1 for f in json_files if "dossierParlementaire/" in f)
    print(f"   - Textes (document/) : {textes_count}")
    print(f"   - Dossiers (pour PROM) : {dossiers_count}")

    batch_size = 500  # on envoie 100 textes à la fois à Supabase
    batch = []
    success = 0
    failed = 0

    # Barre de progression
    for file_name in tqdm(json_files, desc="Import textes", unit="fichier"):
        try:
            with zip_ref.open(file_name) as f:
                texte_data = json.load(f)

            payloads = importer_texte(texte_data, file_name)

            batch.extend(payloads)
            success += len(payloads)

            # Envoi par batch
            if len(batch) >= batch_size:
                response = (
                    supabase.table("textes").upsert(batch, on_conflict="uid").execute()
                )
                if (
                    not response.data
                ):  # ← Changement : vérifie si pas de data (erreur probable)
                    print(
                        f"Erreur batch : {getattr(response, 'error', 'Erreur inconnue')}"
                    )
                    failed += len(batch)  # Ajoute aux échecs
                else:
                    success += len(
                        batch
                    )  # ← Déplace ici : compte succès seulement si OK
                batch = []

        except Exception as e:
            failed += 1
            print(f"Erreur fichier {file_name}: {e}")

    # Dernier batch restant
    if batch:
        response = supabase.table("textes").upsert(batch, on_conflict="uid").execute()
        if not response.data:
            print(
                f"Erreur batch final : {getattr(response, 'error', 'Erreur inconnue')}"
            )
            failed += len(batch)
        else:
            success += len(batch)

    print(f"\n{'='*60}")
    print(f"IMPORT TEXTES TERMINÉ")
    print(f"   Succès  : {success}")
    print(f"   Échecs  : {failed}")
    print(f"{'='*60}")


# Exécution
if __name__ == "__main__":
    # URL exacte du ZIP (même que pour les dossiers)
    URL = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip"

    zip_ref = download_zip(URL)
    importer_textes_from_zip(zip_ref)

    print("\nTout est terminé !")
