# import_scrutins_votes.py
# Script pour importer tous les JSON scrutins commençant par 'VTANR5L17V' d'un dossier dans Supabase tables 'scrutins' et 'votes'.
# Basé sur import_acteurs.py : Tolérant aux erreurs (skip invalides, defaults None), gère lists/None/truncations.
# Importe TOUS les JSON filtrés, même si champs manquent.
# Correction : Gère date_scrutin en ISO, position_vote inclut 'nonVotant', mapping cause_position_libelle.
# Nouveau : nombre_membres_groupe/position_majoritaire pour votes groupes (acteur_ref=None).
# Exécute avec : python import_scrutins_votes.py
# Attention : Adapte le chemin dossier_scrutins si besoin.

import json
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Charger env vars de .env.local (même que import_acteurs.py)
load_dotenv(dotenv_path='/Users/algodin/Documents/LoiClair website/loiclair/.env.local')
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env.local")
supabase: Client = create_client(supabase_url, supabase_key)

# Mapping pour cause_position_libelle (étends avec codes connus des docs AN)
cause_map = {
    'PSE': 'Président de séance',
    'PAN': 'Président de l\'Assemblée Nationale',
    'MG': 'Membre du Gouvernement',
    # Ajoute ici d'autres codes (ex. : 'ABS' : 'Absent', etc.)
}

def importer_scrutin(file_path):
    """Parse et importe un JSON scrutin dans Supabase (scrutins + votes)."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)['scrutin']
        
        # Champs pour table scrutins (tolérant : None si absent)
        uid = data.get('uid')
        numero = int(data.get('numero')) if data.get('numero') else None
        organe_ref = data.get('organeRef')
        legislature = int(data.get('legislature')) if data.get('legislature') else None
        session_ref = data.get('sessionRef')
        seance_ref = data.get('seanceRef')
        date_scrutin_raw = data.get('dateScrutin')
        date_scrutin = date_scrutin_raw if date_scrutin_raw else None        
        quantieme_jour_seance = int(data.get('quantiemeJourSeance')) if data.get('quantiemeJourSeance') else None
        type_vote_code = data['typeVote'].get('codeTypeVote') if 'typeVote' in data else None
        type_vote_libelle = data['typeVote'].get('libelleTypeVote') if 'typeVote' in data else None
        type_majorite = data['typeVote'].get('typeMajorite') if 'typeVote' in data else None
        sort_code = data['sort'].get('code') if 'sort' in data else None
        sort_libelle = data['sort'].get('libelle') if 'sort' in data else None
        titre = data.get('titre')
        demandeur_texte = data['demandeur'].get('texte') if 'demandeur' in data else None
        objet_libelle = data['objet'].get('libelle') if 'objet' in data else None
        synthese = data.get('syntheseVote', {})
        synthese_nombre_votants = int(synthese.get('nombreVotants')) if synthese.get('nombreVotants') else None
        synthese_suffrages_exprimes = int(synthese.get('suffragesExprimes')) if synthese.get('suffragesExprimes') else None
        synthese_suffrages_requis = int(synthese.get('nbrSuffragesRequis')) if synthese.get('nbrSuffragesRequis') else None
        synthese_annonce = synthese.get('annonce')
        decompte = synthese.get('decompte', {})
        synthese_pour = int(decompte.get('pour')) if decompte.get('pour') else None
        synthese_contre = int(decompte.get('contre')) if decompte.get('contre') else None
        synthese_abstentions = int(decompte.get('abstentions')) if decompte.get('abstentions') else None
        synthese_non_votants = int(decompte.get('nonVotants')) if decompte.get('nonVotants') else None
        lieu_vote = data.get('lieuVote')
        
        # Dict pour upsert scrutins
        data_scrutin = {
            'uid': uid,
            'numero': numero,
            'organe_ref': organe_ref,
            'legislature': legislature,
            'session_ref': session_ref,
            'seance_ref': seance_ref,
            'date_scrutin': date_scrutin,
            'quantieme_jour_seance': quantieme_jour_seance,
            'type_vote_code': type_vote_code,
            'type_vote_libelle': type_vote_libelle,
            'type_majorite': type_majorite,
            'sort_code': sort_code,
            'sort_libelle': sort_libelle,
            'titre': titre,
            'demandeur_texte': demandeur_texte,
            'objet_libelle': objet_libelle,
            'synthese_nombre_votants': synthese_nombre_votants,
            'synthese_suffrages_exprimes': synthese_suffrages_exprimes,
            'synthese_suffrages_requis': synthese_suffrages_requis,
            'synthese_annonce': synthese_annonce,
            'synthese_pour': synthese_pour,
            'synthese_contre': synthese_contre,
            'synthese_abstentions': synthese_abstentions,
            'synthese_non_votants': synthese_non_votants,
            'lieu_vote': lieu_vote
        }
        
        # Upsert scrutin (sur uid)
        response_scrutin = supabase.table('scrutins').upsert(data_scrutin, on_conflict='uid').execute()
        if response_scrutin.data:
            print(f"Scrutin {uid} importé/upsert avec succès depuis {file_path}.")
        else:
            print(f"Erreur upsert scrutin {uid}: {response_scrutin.error}")
            return  # Skip votes si scrutin échoue
        
        # Parsing votes (groupes + nominatifs)
        votes_list = []
        groupes = data.get('ventilationVotes', {}).get('organe', {}).get('groupes', {}).get('groupe', [])
        if not isinstance(groupes, list):
            groupes = [groupes] if groupes else []  # Wrapper singleton/None

        for groupe in groupes:
            organe_ref = groupe.get('organeRef')
            is_valid_organe = organe_ref and organe_ref != 'PO0'  # Ajoute d'autres invalides si besoin
            
            note_organe = None
            if not is_valid_organe:
                print(f"Organe invalide {organe_ref} pour scrutin {uid} : set to None avec note.")
                note_organe = f'Organe non trouvé : {organe_ref or "absent"}'
                organe_ref = None  # Set to None
            
            nombre_membres_groupe = int(groupe.get('nombreMembresGroupe')) if groupe.get('nombreMembresGroupe') else None
            position_majoritaire = groupe.get('vote', {}).get('positionMajoritaire')
            
            # Vote groupe (toujours inséré, avec note si invalide)
            votes_list.append({
                'scrutin_uid': uid,
                'acteur_ref': None,
                'organe_ref': organe_ref,
                'position_vote': position_majoritaire or 'inconnu',
                'par_delegation': False,
                'num_place': None,
                'cause_position': None,
                'cause_position_libelle': None,
                'nombre_membres_groupe': nombre_membres_groupe,
                'position_majoritaire': position_majoritaire,
                'note_organe': note_organe  # Nouveau : note si invalide
            })
            
            # Votes nominatifs (insérés avec note si groupe invalide)
            decompte_nominatif = groupe.get('vote', {}).get('decompteNominatif', {})
            if decompte_nominatif and isinstance(decompte_nominatif, dict):
                for pos in ['pours', 'contres', 'abstentions', 'nonVotants']:
                    pos_data = decompte_nominatif.get(pos, {})
                    if not isinstance(pos_data, dict):
                        continue
                    votants_raw = pos_data.get('votant', [])
                    if not isinstance(votants_raw, list):
                        votants_raw = [votants_raw] if votants_raw else []
                    
                    for votant in votants_raw:
                        if isinstance(votant, dict):
                            acteur_ref = votant.get('acteurRef')
                            par_delegation = votant.get('parDelegation') == 'true' if votant.get('parDelegation') else False
                            num_place = votant.get('numPlace')
                            cause_position = votant.get('causePositionVote')
                            cause_position_libelle = cause_map.get(cause_position, 'Inconnu')
                            
                            position_vote = pos[:-1] if pos.endswith('s') else pos
                            
                            votes_list.append({
                                'scrutin_uid': uid,
                                'acteur_ref': acteur_ref,
                                'organe_ref': organe_ref,
                                'position_vote': position_vote,
                                'par_delegation': par_delegation,
                                'num_place': num_place,
                                'cause_position': cause_position,
                                'cause_position_libelle': cause_position_libelle,
                                'nombre_membres_groupe': None,
                                'position_majoritaire': None,
                                'note_organe': note_organe  # Nouveau : hérite la note du groupe
                            })
                
        # Insert batch votes (si liste non vide)
        if votes_list:
            response_votes = supabase.table('votes').insert(votes_list).execute()
            if response_votes.data:
                print(f"{len(votes_list)} votes importés pour scrutin {uid}.")
            else:
                print(f"Erreur insert votes pour {uid}: {response_votes.error}")
    
    except Exception as e:
        print(f"Erreur générale pour {file_path}: {e}")
        import traceback
        traceback.print_exc()

def importer_scrutins_from_dir(dossier_scrutins):
    """Boucle sur tous les JSON commençant par 'VTANR5L17V' dans le dossier et importe."""
    for filename in os.listdir(dossier_scrutins):
        if filename.startswith('VTANR5L17V') and filename.endswith('.json'):
            file_path = os.path.join(dossier_scrutins, filename)
            importer_scrutin(file_path)

# Exécution
if __name__ == "__main__":
    dossier_scrutins = '/Users/algodin/Documents/LoiClair website/Data brute/AN-Jan2026/Votes'  # Adapte ce chemin à ton dossier réel
    importer_scrutins_from_dir(dossier_scrutins)