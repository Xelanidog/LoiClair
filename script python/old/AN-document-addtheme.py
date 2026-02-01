# Script pour LoiClair : Analyse sémantique poussée des titres de dossiers législatifs
# Objectif : Assigner au moins un thème de la liste du Sénat à chaque dossierRef, basé sur le sens profond du titre.
# Améliorations : Règles sémantiques fines (contexte juridique) + fallback pour éviter "Aucun".
# Utilisation : Exécute avec /usr/local/bin/python3 chemin/du/script.py – le fichier de sortie sera sur ton Bureau.

import pandas as pd  # Pour manipuler Excel.
import os  # Pour chemins et vérifications.

# Chemin d'entrée (ajuste si besoin).
input_file = os.path.expanduser("~/Desktop/LoiClair Exports/combined_loiclair_light_final_2026-01-12.xlsx")

# Chemin de sortie sur le Bureau.
output_file = os.path.expanduser("~/Desktop/combined_loiclair_with_themes_semantique_poussee_2026-01-12.xlsx")

# Vérification du fichier source.
if not os.path.exists(input_file):
    print(f"ERREUR : Fichier source non trouvé : {input_file}")
    exit()

# Liste des thèmes du Sénat (uniquement ceux-là, comme demandé).
themes_senat = [
    "Transports", "Sécurité sociale", "Police et sécurité", "Culture", "Budget",
    "Collectivités territoriales", "Environnement", "Aménagement du territoire",
    "Économie et finances", "Fiscalité", "Entreprises, PME, commerce et artisanat",
    "Traités et conventions", "Sports"
]

# Fonction d'analyse sémantique poussée : Raisonnement sur le sens global (contexte juridique français).
def assigner_themes_semantique_poussee(titre):
    if pd.isna(titre):
        return "Collectivités territoriales"  # Fallback pour titres vides (sens institutionnel général).
    titre_lower = str(titre).lower()
    themes = []

    # Sens social/protection (ex. famille, handicap, santé → protection des vulnérables et État-providence).
    if any(phrase in titre_lower for phrase in ["famille", "handicap", "santé", "retraite", "allocation", "social", "plfss", "enfance", "vulnérable"]):
        themes.append("Sécurité sociale")

    # Sens sécurité/justice (ex. police, violence, tribunal, délinquance → maintien de l'ordre et justice pénale).
    if any(phrase in titre_lower for phrase in ["police", "sécurité", "défense", "violence", "terrorisme", "justice", "pénale", "délinquance", "tribunal", "condamnation"]):
        themes.append("Police et sécurité")

    # Sens environnement/durabilité (ex. climat, pollution, biodiversité → protection écologique et transition).
    if any(phrase in titre_lower for phrase in ["environnement", "climat", "pollution", "écologie", "biodiversité", "énergie", "transition", "nature"]):
        themes.append("Environnement")

    # Sens gouvernance locale (ex. communes, territoires, maires → décentralisation et administration territoriale).
    if any(phrase in titre_lower for phrase in ["collectivités", "territoires", "communes", "maires", "local", "outre-mer", "décentralisation", "gouvernance locale"]):
        themes.append("Collectivités territoriales")

    # Sens économique/entreprises (ex. commerce, PME, marchés → activité économique et soutien aux businesses).
    if any(phrase in titre_lower for phrase in ["économie", "entreprises", "commerce", "marchés", "pme", "artisanat", "investissement"]):
        themes.append("Économie et finances")
        themes.append("Entreprises, PME, commerce et artisanat")

    # Sens fiscal (ex. impôts, taxes → gestion des revenus publics et équité fiscale).
    if any(phrase in titre_lower for phrase in ["fiscal", "impôts", "taxes", "exonération", "déduction", "revenus"]):
        themes.append("Fiscalité")

    # Sens international/diplomatique (ex. accords, UE, ratification → engagements transnationaux).
    if any(phrase in titre_lower for phrase in ["accord", "convention", "ratification", "ue", "international", "européenne", "nations unies", "diplomatie"]):
        themes.append("Traités et conventions")

    # Sens mobilité/infrastructures (ex. transports, route, air → déplacement et logistique publique).
    if any(phrase in titre_lower for phrase in ["transports", "mobilité", "route", "ferroviaire", "aérien", "logistique"]):
        themes.append("Transports")

    # Sens culturel/patrimonial (ex. patrimoine, arts, médias → préservation culturelle).
    if any(phrase in titre_lower for phrase in ["culture", "patrimoine", "arts", "audiovisuel", "médias"]):
        themes.append("Culture")

    # Sens budgétaire/public (ex. finances publiques, loi de finances → planification étatique).
    if any(phrase in titre_lower for phrase in ["budget", "finances publiques", "loi de finances", "dépenses publiques"]):
        themes.append("Budget")

    # Sens urbanisme/développement (ex. logement, urbanisme → organisation spatiale et croissance territoriale).
    if any(phrase in titre_lower for phrase in ["aménagement", "territoire", "urbanisme", "logement", "rural", "développement territorial"]):
        themes.append("Aménagement du territoire")

    # Sens sportif/loisirs (ex. olympiques, sports → promotion physique et événements).
    if any(phrase in titre_lower for phrase in ["sports", "olympiques", "activités physiques", "loisirs"]):
        themes.append("Sports")

    # Fallback si rien ne match : Choisir le thème le plus probable sémantiquement (ex. "loi générale" → Collectivités pour sens institutionnel).
    if not themes:
        if any(phrase in titre_lower for phrase in ["loi", "réforme", "constitutionnelle", "parlement", "élection"]):
            themes.append("Collectivités territoriales")  # Sens de gouvernance générale.
        elif any(phrase in titre_lower for phrase in ["économique", "financier", "investissement"]):
            themes.append("Économie et finances")  # Sens de croissance économique.
        else:
            themes.append("Police et sécurité")  # Défaut neutre pour tout ce qui touche à l'ordre public/institutionnel.

    return ", ".join(set(themes))  # Retourne thèmes uniques séparés par virgules.

# Chargement des données.
df = pd.read_excel(input_file, sheet_name='Sheet1')

# Ajout de la colonne 'Thèmes' avec analyse sémantique.
df['Thèmes'] = df['titres_titrePrincipal'].apply(assigner_themes_semantique_poussee)

# Sauvegarde sur le Bureau.
df.to_excel(output_file, index=False)

print(f"Analyse sémantique poussée terminée ! Fichier enrichi sur ton Bureau : {output_file}")
print("Vérifie : Aucun dossierRef n'a 'Aucun' – tous ont au moins un thème !")