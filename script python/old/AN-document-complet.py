# -*- coding: utf-8 -*-
"""
SCRIPT FINAL : EXTRACTION COMPLÈTE DE TOUS LES JSON DE L'AN VERS UN CSV UNIQUE
===============================================================================

Objectif : 
- Prendre tous les fichiers JSON du dossier
- Aplatir TOUTES les informations (aucune perte)
- Générer un CSV lisible avec guillemets partout (QUOTE_ALL)
- Ajouter les liens utiles (opendata + dossier législatif)
- Exporter aussi en Excel pour visualisation immédiate

Optimisations :
- Flatten récursif complet
- Gestion des listes → concaténation avec "; "
- Nettoyage minimal : None → vide, pas de suppression d'info
- Protection maximale du CSV contre virgules internes et caractères spéciaux
- Feedback progression pour les gros dossiers (ex. 5000+ fichiers)

Auteur : Grok (xAI) pour Alexandre Godin (@xelanidog) – Janvier 2026
"""

import json
import pandas as pd
import csv
from pathlib import Path
from datetime import datetime

# CONFIGURATION
DOSSIER_JSON = "/Users/alex/Documents/LoiClair website/LoiClair Dev/backend/data-lois"

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
                # Liste → on concatène avec séparateur
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

# Tri optionnel par date de dépôt (si la colonne existe)
if 'cycleDeVie_chrono_dateDepot' in df.columns:
    df = df.sort_values(by='cycleDeVie_chrono_dateDepot', ascending=False)

# ------------------------------------------------------------------------------
# 3. Export CSV complet et protégé + Excel
# ------------------------------------------------------------------------------
# On force l'écriture sur le Bureau pour éviter les problèmes de droits d'écriture
output_folder = Path.home() / "Desktop" / "LoiClair Exports"
output_folder.mkdir(parents=True, exist_ok=True)  # Crée le dossier s'il n'existe pas

today = datetime.now().strftime("%Y-%m-%d")
output_csv = output_folder / f"combined_loiclair_complet_{today}.csv"
output_xlsx = output_folder / f"combined_loiclair_complet_{today}.xlsx"

print("Écriture sur le Bureau dans : LoiClair Exports")

df.to_csv(
    output_csv,
    index=False,
    encoding='utf-8-sig',
    sep=',',
    quoting=csv.QUOTE_ALL,           # ← Protection maximale : TOUT entre guillemets
    escapechar='\\'
)
print(f"CSV complet créé : {output_csv}")

df.to_excel(
    output_xlsx,
    index=False,
    engine='openpyxl'
)
print(f"Excel complet créé : {output_xlsx}")

print("\nTerminé !")
print(f"→ CSV complet : {output_csv}")
print(f"→ Excel complet : {output_xlsx}")
print(f"→ Nombre total de colonnes : {len(df.columns)}")
print(f"→ Colonnes principales présentes : {', '.join(df.columns[:10])}...")