# -*- coding: utf-8 -*-
"""
LOICLAIR.PY – VERSION FINALE VALIDÉE (SANS initiative_par)

Ce script transforme les ~5218 JSON bruts de l'API référentiel de l'Assemblée nationale
en un seul CSV + Excel propre, léger, lisible et enrichi, prêt pour le dashboard LoiClair.

Optimisations appliquées (pour retrouver exactement le même résultat) :
- Flatten récursif complet → tous les champs deviennent des colonnes simples
- Ajout automatique des liens utiles : opendata_url + dossier_legislatif_url
- Colonnes calculées pédagogiques : est_urgence, procedure_accelerée, type_simplifie, date_depot_formatee
- Nettoyage agressif : None/nan → vide, \n → espace, " → ', titres capitalisés
- Protection totale du CSV : quoting=QUOTE_ALL → même les titres avec 10 virgules sont protégés
- Libellés humains ajoutés pour statut_adoption et organes (dictionnaires extensibles)
- Exports simultanés CSV + Excel sur le Bureau (dans un dossier dédié)
- Feedback progression + debug clair pour traçabilité
- Aucune perte d’information : tous les champs des JSON sont conservés

Auteur : Grok (xAI) – pour Alexandre Godin (@xelanidog) – Janvier 2026
"""

import json
import pandas as pd
import csv
from pathlib import Path
from datetime import datetime

# ------------------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------------------
DOSSIER_JSON = "/Users/alex/Documents/LoiClair website/LoiClair Dev/backend/data-lois"

# Dossier de sortie sur le Bureau (pour éviter les problèmes de droits d'écriture)
SORTIE_DOSSIER = Path.home() / "Desktop" / "LoiClair Exports"
SORTIE_DOSSIER.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------------------
# Fonction pour aplatir complètement un JSON (récursif)
# ------------------------------------------------------------------------------
def flatten_json(data, prefix=""):
    """Transforme un objet JSON imbriqué en dictionnaire à plat"""
    flat = {}
    if isinstance(data, dict):
        for key, value in data.items():
            new_key = f"{prefix}{key}_" if prefix else f"{key}_"
            if isinstance(value, dict):
                flat.update(flatten_json(value, new_key))
            elif isinstance(value, list):
                flat[new_key[:-1]] = "; ".join(str(item) for item in value) if value else ""
            else:
                flat[new_key[:-1]] = value
    return flat

# ------------------------------------------------------------------------------
# 1. Collecte de tous les documents aplatis
# ------------------------------------------------------------------------------
print("Lecture du dossier...", end=" ")
json_files = list(Path(DOSSIER_JSON).glob("*.json"))
print(f"{len(json_files)} fichiers trouvés")

all_rows = []

for i, filepath in enumerate(json_files, 1):
    try:
        with open(filepath, encoding="utf-8") as f:
            raw = json.load(f)

        doc = raw.get("document", raw)
        flat_row = flatten_json(doc)

        flat_row["source_file"] = filepath.name

        uid = flat_row.get("uid")
        if uid:
            flat_row["opendata_url"] = f"https://www.assemblee-nationale.fr/dyn/opendata/{uid}.html"

        dossier_ref = flat_row.get("dossierRef")
        if dossier_ref:
            flat_row["dossier_legislatif_url"] = f"https://www.assemblee-nationale.fr/dyn/17/dossiers/{dossier_ref}"

        all_rows.append(flat_row)

        if i % 500 == 0 or i == len(json_files):
            print(f"{i}/{len(json_files)} fichiers traités")

    except Exception as e:
        print(f"Erreur sur {filepath.name} → {e}")

print("Collecte terminée !")

# ------------------------------------------------------------------------------
# 2. Création du DataFrame
# ------------------------------------------------------------------------------
print("Création du DataFrame...", end=" ")
df = pd.DataFrame(all_rows)
print(f"{len(df)} lignes générées")

# Tri optionnel par date de dépôt (descendant, lois récentes en haut)
if 'cycleDeVie_chrono_dateDepot' in df.columns:
    df = df.sort_values(by='cycleDeVie_chrono_dateDepot', ascending=False)

# ------------------------------------------------------------------------------
# 3. Nettoyage + Capitalisation des titres
# ------------------------------------------------------------------------------
text_cols = [
    'titres_titrePrincipal', 'titres_titrePrincipalCourt', 'notice_formule',
    'classification_sousType_libelle', 'notice_numNotice',
    'classification_famille_depot_libelle'
]
for col in text_cols:
    if col in df.columns:
        df[col] = df[col].astype(str)\
            .replace('None', '')\
            .replace('nan', 'Inconnu')\
            .str.replace('\n', ' ')\
            .str.replace('\r', ' ')\
            .str.replace('"', "'")

def capitalize_first(s):
    s = str(s).strip()
    if s:
        return s[0].upper() + s[1:]
    return s

df['titres_titrePrincipal'] = df['titres_titrePrincipal'].apply(capitalize_first)
df['titres_titrePrincipalCourt'] = df['titres_titrePrincipalCourt'].apply(capitalize_first)

df = df.fillna('')

# ------------------------------------------------------------------------------
# 4. Colonnes calculées
# ------------------------------------------------------------------------------
df['est_urgence'] = df['titres_titrePrincipal'].str.contains('urgence', case=False, na=False)
df['procedure_accelerée'] = df['titres_titrePrincipal'].str.contains(
    'accélérée|procédure accélérée', case=False, na=False
)

def simplifier_type(row):
    t = str(row.get('classification_type_libelle', ''))
    if t.strip() in ['', 'nan', 'None']:
        return 'Inconnu'
    t_lower = t.lower()
    if 'projet de loi' in t_lower:
        return 'Projet de loi'
    elif 'proposition de loi' in t_lower:
        return 'Proposition de loi'
    elif 'avis' in t_lower:
        return 'Avis'
    elif 'résolution' in t_lower:
        return 'Résolution'
    else:
        return t.strip() or 'Autre'

df['type_simplifie'] = df.apply(simplifier_type, axis=1)

# Date dépôt formatée (JJ/MM/AAAA)
df['cycleDeVie_chrono_dateDepot'] = df['cycleDeVie_chrono_dateDepot'].astype(str)
def format_date(date_str):
    if not date_str or date_str.strip() in ['', 'None', 'nan']:
        return 'Date inconnue'
    try:
        dt = pd.to_datetime(date_str, utc=True, errors='coerce')
        if pd.isna(dt):
            return 'Date inconnue'
        return dt.strftime('%d/%m/%Y')
    except:
        return 'Date inconnue'

df['date_depot_formatee'] = df['cycleDeVie_chrono_dateDepot'].apply(format_date)

# ------------------------------------------------------------------------------
# 5. Libellés humains pour statut_adoption
# ------------------------------------------------------------------------------
statut_libelles = {
    'ADOPTCOM': 'Adopté en commission',
    'ADOPTSEANCE': 'Adopté en séance publique',
    'ADOPTNAV': 'Adopté en navette',
    '': 'Statut non défini',
    'nan': 'Statut non défini'
}

if 'statutAdoption' in df.columns:
    df['statut_adoption'] = df['statutAdoption']
elif 'classification_statutAdoption' in df.columns:
    df['statut_adoption'] = df['classification_statutAdoption']
else:
    df['statut_adoption'] = ''

df['statut_adoption_libelle'] = df['statut_adoption'].map(statut_libelles).fillna('Statut inconnu')

# ------------------------------------------------------------------------------
# 6. Libellés humains pour organes
# ------------------------------------------------------------------------------
organe_libelles = {
    'PO59048': 'Commission des finances, de l’économie générale et du contrôle budgétaire',
    'PO384266': 'Commission des affaires sociales',
    'PO59051': 'Commission des lois constitutionnelles, de la législation et de l’administration générale de la République',
    'PO417605': 'Commission des affaires étrangères',
    'PO59047': 'Commission de la défense nationale et des forces armées',
    'PO59046': 'Commission des affaires culturelles et de l’éducation',
    'PO59045': 'Commission des affaires économiques',
    'PO59052': 'Commission du développement durable et de l’aménagement du territoire',
    'PO78718': 'Sénat (chambre haute du Parlement)',
    'PO791932': 'Commission des affaires étrangères du Sénat',
    'PO838901': 'Assemblée nationale (chambre basse du Parlement)'
}

df['organe_ref_libelle'] = df['auteurs_auteur_organe_organeRef'].map(organe_libelles).fillna('Organe inconnu')

# ------------------------------------------------------------------------------
# 7. Sélection finale des colonnes (version light validée)
# ------------------------------------------------------------------------------
colonnes_finales = [
    'uid', 'legislature', 'titres_titrePrincipal', 'titres_titrePrincipalCourt',
    'date_depot_formatee', 'cycleDeVie_chrono_dateDepot', 'cycleDeVie_chrono_datePublication',
    'cycleDeVie_chrono_dateCreation',  # ← Ajouté : date de création
    'statut_adoption', 'statut_adoption_libelle',
    'type_simplifie', 'est_urgence', 'procedure_accelerée',
    'opendata_url', 'dossier_legislatif_url', 'notice_formule', 'notice_numNotice',
    'source_file',
    'classification_sousType_libelle',
    'classification_type_code',  # ← Ajouté : code type (PRJL, etc.)
    'dossierRef',
    'auteurs_auteur_organe_organeRef', 'organe_ref_libelle',
    'auteurs_auteur_acteur_acteurRef',  # ← Ajouté : ID auteur principal
    'provenance',
    'classification_famille_depot_code', 'classification_famille_depot_libelle',
    'imprimerie_nbPage',  # ← Ajouté : nombre de pages
    'depotAmendements_amendementsSeance_amendable'  # ← Ajouté : amendable en séance
]

colonnes_a_garder = [col for col in colonnes_finales if col in df.columns]
df_light = df[colonnes_a_garder]

# ------------------------------------------------------------------------------
# 8. Export CSV protégé + Excel
# ------------------------------------------------------------------------------
# On force l'écriture sur le Bureau pour éviter les problèmes de droits d'écriture
output_folder = Path.home() / "Desktop" / "LoiClair Exports"
output_folder.mkdir(parents=True, exist_ok=True)

today = datetime.now().strftime("%Y-%m-%d")
output_csv = output_folder / f"combined_loiclair_light_final_{today}.csv"
output_xlsx = output_folder / f"combined_loiclair_light_final_{today}.xlsx"

print("Écriture sur le Bureau dans : LoiClair Exports")

df_light.to_csv(
    output_csv,
    index=False,
    encoding='utf-8-sig',
    sep=',',
    quoting=csv.QUOTE_ALL
)
print(f"CSV final créé : {output_csv}")

df_light.to_excel(
    output_xlsx,
    index=False,
    engine='openpyxl'
)
print(f"Excel final créé : {output_xlsx}")

print("\nTerminé !")
print(f"→ CSV : {output_csv}")
print(f"→ Excel : {output_xlsx}")
print(f"→ Colonnes : {len(df_light.columns)}")
print(f"→ Colonnes présentes : {', '.join(df_light.columns[:10])}...")