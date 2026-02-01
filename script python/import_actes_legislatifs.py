# import_actes_legislatifs.py
# Script pour importer tous les actes législatifs nested des JSON dossiers commençant par 'DLR' d'un dossier dans Supabase table 'actes_legislatifs'.
# Optimisé : Parsing récursif pour hiérarchie (parent_uid), tolérant aux erreurs (skip invalides, defaults None), gère dicts/arrays/None.
# Importe TOUS les actes des JSON filtrés, même si champs manquent.
# Ajouts : Conversion date_acte en str ISO (si datetime-like), textes_associes normalisé en array JSONB.
# Fix : Gestion robuste de 'actesLegislatifs' absent ou None pour éviter AttributeError.
# Mises à jour : libelle_acte = nomCanonique (texte), statut_conclusion = libelle (texte).
# Ajustement vote_refs : Gère objets simples (ex. {"voteRef": "string"}), arrays, ou strings ; normalise en array de strings (ex. ['VTANR5L17V4706']).
# Nouvelle correction : Extraction de vote_refs rendue récursive pour capturer les refs dans les sous-actes imbriqués.
# Modification pour textes_associes : Si refs vide, set à None (pour NULL) ; sinon, prend le premier ref comme string simple (nettoyé), car un seul attendu.
# Nouvelle : Extraction dédiée de provenance et texte_adopte pour colonnes séparées (FK futures vers organes/textes).
# Exécute avec : python import_actes_legislatifs.py
# Attention : Adapte le chemin dossier_dossiers si besoin. Assure-toi que la table 'actes_legislatifs' existe et est mise à jour.
import json
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Section : Chargement des variables d'environnement
# Charge les clés Supabase depuis .env.local pour se connecter à la base de données.
load_dotenv(dotenv_path='/Users/algodin/Documents/LoiClair website/loiclair/.env.local')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)

# Fonction helper pour extraire vote_refs de manière récursive (correction clé pour capturer les refs nichées)
def extraire_vote_refs_recursif(acte, result_list):
    """Extrait récursivement les voteRefs / voteRef de l'acte et de ses sous-actes.
    Gère str, dict, list, et négocie les formes variées (avec ou sans 's').
    """
    vote_raw = acte.get('voteRefs') or acte.get('voteRef')  # Tolérance : gère 'voteRef' sans 's' si rare
    if vote_raw:
        if isinstance(vote_raw, str):
            result_list.append(vote_raw)
        elif isinstance(vote_raw, dict):
            ref = vote_raw.get('voteRef')
            if ref:
                result_list.append(ref)
        elif isinstance(vote_raw, list):
            for item in vote_raw:
                if isinstance(item, dict):
                    ref = item.get('voteRef')
                    if ref:
                        result_list.append(ref)
                elif isinstance(item, str):
                    result_list.append(item)
    # Récursion sur enfants (sous-actes)
    actes_legis = acte.get('actesLegislatifs')
    enfants = []
    if actes_legis:
        enfants_raw = actes_legis.get('acteLegislatif', [])
        if not isinstance(enfants_raw, list):
            enfants = [enfants_raw] if enfants_raw else []
        else:
            enfants = enfants_raw
    for enfant in enfants:
        extraire_vote_refs_recursif(enfant, result_list)

def parser_acte(acte_data, dossier_uid, parent_uid=None):
    """Parse un acte et insère dans Supabase (récursif pour enfants)."""
    try:
        # Section : Extraction des champs basiques
        # Utilise .get() pour éviter les KeyError si un champ est absent ; defaults à None.
        uid = acte_data.get('uid')
        code_acte = acte_data.get('codeActe')
        type_acte = acte_data.get('@xsi:type')  # xsi:type pour type_acte
        organe_ref = acte_data.get('organeRef')
        # libelle_acte : seulement nomCanonique (texte simple)
        libelle_acte = acte_data.get('libelleActe', {}).get('nomCanonique')
        # date_acte : str ou datetime -> str ISO ou None
        date_acte_raw = acte_data.get('dateActe')
        date_acte = None
        if date_acte_raw:
            try:
                # Gère formats comme "2025-02-13T00:00:00.000+01:00" ou "2025-02-13+01:00"
                # Supprime le fuseau horaire si présent et parse en ISO.
                date_acte = datetime.fromisoformat(date_acte_raw.replace('Z', '+00:00').split('+')[0]).isoformat()
            except ValueError:
                date_acte = date_acte_raw  # Fallback str si non parsable
        # statut_conclusion : seulement libelle (texte simple)
        statut_conclusion = acte_data.get('statutConclusion', {}).get('libelle')
        # textes_associes : normalisé en string simple (exclut TAP, extrait refTexteAssocie ou texteAssocie, prend le premier si multiple)
        textes_raw = acte_data.get('textesAssocies') or acte_data.get('texteAssocie')
        refs = []
        if textes_raw:
            items = [textes_raw] if not isinstance(textes_raw, list) else textes_raw
            for item in items:
                if isinstance(item, dict):
                    if item.get('typeTexte') == 'TAP':
                        continue  # Exclure TAP
                    ref = item.get('refTexteAssocie')
                    if ref:
                        refs.append(ref.strip().replace('»', ''))  # Nettoie espaces et guillemets parasites
                elif isinstance(item, str):
                    refs.append(item.strip().replace('»', ''))
        # Modification : Si refs vide, set à None (pour NULL) ; sinon, prend le premier ref comme string simple (un seul attendu)
        textes_associes = refs[0] if refs else None
        # rapporteurs : dict ou None -> JSONB
        rapporteurs = acte_data.get('rapporteurs', {}) or None
        # reunion_ref : str ou None
        reunion_ref = acte_data.get('reunionRef')
        # vote_refs : extraction récursive (correction pour capturer sous-actes)
        vote_refs = []
        extraire_vote_refs_recursif(acte_data, vote_refs)
        vote_refs = sorted(list(set(vote_refs)))
        vote_refs = vote_refs[0] if len(vote_refs) == 1 else None
        # Debug optionnel : active pour tracer
        # print(f"Debug pour acte {uid} dans dossier {dossier_uid}: vote_refs={vote_refs}")
        # Nouvelle extraction : sépare provenance et texte_adopte pour colonnes dédiées (FK futures vers organes/textes)
        provenance = acte_data.get('provenance')  # Ref organe ? (ex. UID pour FK vers table organes)
        texte_adopte = acte_data.get('texteAdopte')  # Ref texte (ex. UID pour FK vers table textes)
        # autres_infos : JSONB pour champs rares restants (temporaire, à supprimer après migration)
        autres_infos = {
            'depotInitialLectureDefinitiveRef': acte_data.get('depotInitialLectureDefinitiveRef'),
            'infoJO': acte_data.get('infoJO'),
            'urlEcheancierLoi': acte_data.get('urlEcheancierLoi'),
            'codeLoi': acte_data.get('codeLoi'),
            'titreLoi': acte_data.get('titreLoi'),
            # Ajoute d'autres si besoin
        }
        # Section : Préparation des données pour insertion
        # Crée un dict avec tous les champs mappés, nettoie les None dans autres_infos.
        data_insert = {
            'uid': uid,
            'dossier_uid': dossier_uid,
            'parent_uid': parent_uid,
            'code_acte': code_acte,
            'libelle_acte': libelle_acte,
            'organe_ref': organe_ref,
            'date_acte': date_acte,
            'type_acte': type_acte,
            'statut_conclusion': statut_conclusion,
            'textes_associes': textes_associes,
            'rapporteurs': rapporteurs,
            'reunion_ref': reunion_ref,
            'vote_refs': vote_refs,
            'provenance': provenance,
            'texte_adopte': texte_adopte,
            'autres_infos': {k: v for k, v in autres_infos.items() if v is not None},  # Clean None
        }
        # Section : Insertion/Upsert dans Supabase
        # Utilise upsert pour insérer ou mettre à jour sur base de l'uid.
        response = supabase.table('actes_legislatifs').upsert(data_insert, on_conflict='uid').execute()
        if response.data:
            print(f"Acte {uid} importé avec succès pour dossier {dossier_uid} (parent: {parent_uid}).")
        else:
            print(f"Erreur import acte {uid}: {response.error}")
        # Section : Gestion récursive des enfants
        # Vérifie si 'actesLegislatifs' existe ; si None ou absent, enfants = [].
        actes_legis = acte_data.get('actesLegislatifs')
        enfants = []
        if actes_legis:
            enfants_raw = actes_legis.get('acteLegislatif', [])
            if not isinstance(enfants_raw, list):
                enfants = [enfants_raw] if enfants_raw else []
            else:
                enfants = enfants_raw
        # Appelle récursivement pour chaque enfant, avec parent_uid = uid actuel.
        for enfant in enfants:
            parser_acte(enfant, dossier_uid, parent_uid=uid)
    except Exception as e:
        print(f"Erreur pour acte {uid} dans dossier {dossier_uid}: {e}")
        import traceback
        traceback.print_exc()

def importer_dossier(file_path):
    """Parse un JSON dossier et extrait actes législatifs."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)['dossierParlementaire']
        dossier_uid = data.get('uid')
        actes_root = data.get('actesLegislatifs', {}).get('acteLegislatif', [])
        if not isinstance(actes_root, list):
            actes_root = [actes_root] if actes_root else []
        for acte in actes_root:
            parser_acte(acte, dossier_uid)  # Racines sans parent
        print(f"Dossier {dossier_uid} importé avec succès depuis {file_path}.")
    except Exception as e:
        print(f"Erreur générale pour {file_path}: {e}")
        import traceback
        traceback.print_exc()

def importer_actes_from_dir(dossier_dossiers):
    """Boucle sur tous les JSON commençant par 'DLR' dans le dossier et importe."""
    for filename in os.listdir(dossier_dossiers):
        if filename.startswith('DLR') and filename.endswith('.json'):
            file_path = os.path.join(dossier_dossiers, filename)
            importer_dossier(file_path)

# Section : Exécution principale
# Lance l'import depuis le dossier spécifié.
if __name__ == "__main__":
    dossier_dossiers = '/Users/algodin/Documents/LoiClair website/Data brute/AN-Jan2026/Dossiers législatifs/dossierParlementaire'
    importer_actes_from_dir(dossier_dossiers)