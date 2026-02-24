"""
classify_themes.py — Classification thématique des dossiers législatifs par mots-clés.

Usage :
    python3 scripts/classify_themes.py

Compare les thèmes prédits par mots-clés aux thèmes officiels du CSV Sénat,
et affiche les métriques de qualité (precision, recall, F1) par thème.
"""

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

# ─────────────────────────────────────────────
# 1. DICTIONNAIRE DE MOTS-CLÉS PAR THÈME
# ─────────────────────────────────────────────
# Chaque thème a une liste de patterns regex (appliqués sur le titre en minuscules).
# \b = frontière de mot pour éviter les faux positifs ("port" ≠ "transports").

THEME_KEYWORDS: dict[str, list[str]] = {

    "Sports": [
        r"\bsport", r"\bolympique", r"\bparalympique", r"\bdopage",
        r"\bathlet", r"\bstade\b",
    ],

    "Énergie": [
        r"\bénergi", r"\bélectrici", r"\bnucléaire", r"\bhydroélect",
        r"\béolien", r"\bphotovoltaïque", r"\bsolaire\b", r"\bgaz\b",
        r"\bpétroli", r"\bpétrol\b", r"\bhydrocarbure",
        r"\bcarburant", r"\bhydrogène",
    ],

    "Éducation": [
        r"\benseign", r"\bscolaire", r"\bécole", r"\buniversit",
        r"\bétudiant", r"\bélève", r"\bbaccalauréat", r"\blycée",
        r"\bcollège\b", r"\béducati", r"\bapprentissage",
        r"\bprofesseur", r"\benseignant",
    ],

    "Transports": [
        r"\btransport", r"\bferroviaire", r"\bautorouti", r"\baérien",
        r"\baéroport", r"\bSNCF\b", r"\bRATP\b", r"\bmaritime",
        r"\bportuaire", r"\bnavig", r"\brouti", r"\bvéhicul",
        r"\bautomobil", r"\bcirculation\b", r"\bmobilit",
        r"\bferré", r"\bchemin de fer",
    ],

    "Agriculture et pêche": [
        r"\bagricol", r"\bagricult", r"\bpêche\b", r"\bpêcheur",
        r"\brural", r"\bexploitation agricole", r"\bélevage",
        r"\béleveur", r"\bvitivinicol", r"\bviticol", r"\bvignoble",
        r"\baliment", r"\bvétérinaire", r"\bchasse\b", r"\bchasseur",
        r"\bsylvicol", r"\bforêt", r"\bforestier", r"\bsemence",
    ],

    "Travail": [
        r"\btravail", r"\bemploi\b", r"\bsalarié", r"\bchômage",
        r"\bchômeur", r"\bsyndicat", r"\bprud.homme",
        r"\blicenciement", r"\bretraite", r"\bpension",
        r"\bformation professionnelle", r"\bnégociation collective",
        r"\bdialogue social", r"\bgrève\b",
    ],

    "Environnement": [
        r"\benvironnement", r"\bécologi", r"\bbiodiversité",
        r"\bpollution", r"\bdéchet", r"\brecycl",
        r"\bclimat", r"\bémission", r"\bcarbone",
        r"\bespace naturel", r"\bparc national", r"\bfaune\b", r"\bflore\b",
        r"\bdéveloppement durable", r"\bmilieu marin",
        r"\beau[x]?\b(?!.*\b(de|du|des|à|au)\s+(la |l.|l ))", r"\brisque[s]? naturel",
        r"\binondation", r"\bsécheresse", r"\bqualité de l.air",
        r"\bprotection de la nature", r"\bessence[s]?\b",
    ],

    "Justice": [
        r"\bjusti", r"\btribunal", r"\bjudiciaire", r"\bmagistr",
        r"\bpénal", r"\bcriminel", r"\bdélit", r"\bprison",
        r"\bdétenu", r"\bdétention", r"\bcour d.appel",
        r"\bcour de cassation", r"\bcasier judiciaire",
        r"\bprocédure civile", r"\bprocédure pénale",
        r"\bgarde à vue", r"\bjuge\b", r"\bavocat",
        r"\bnotaire", r"\bnotariat",
        r"\bcorruption", r"\bblanchiment", r"\bfraude",
        r"\bdroit pénal", r"\bdroit civil",
        r"\binfraction", r"\bcondamnation", r"\bamnisti",
        r"\bsanction[s]?\b(?!.*\beuropéen)",
        r"\besclavage", r"\bcrime contre l.humanité",
        r"\bextradition", r"\bdivorce\b",
        r"\baction publique", r"\bcode pénal",
        r"\bdonnées.*personnel",
        r"\basile\b",
    ],

    "Logement et urbanisme": [
        r"\blogement", r"\bhabitat", r"\burbanis", r"\bimmobili",
        r"\bcopropriét", r"\blocataire", r"\blocati",
        r"\bbail\b", r"\bbaux\b", r"\bHLM\b",
        r"\bconstruction\b", r"\barchitecte",
        r"\brénovation urbaine", r"\bville\b.*\brenouvellement",
    ],

    "Questions sociales et santé": [
        r"\bsanté", r"\bsanitaire", r"\bmédic", r"\bhôpital",
        r"\bhospitali", r"\bpharma", r"\bépidémi", r"\bpandémi",
        r"\bmaladie", r"\bmalade", r"\bhandicap", r"\bdépendance",
        r"\bsoins\b", r"\bassurance.maladie", r"\btabac",
        r"\balcool", r"\bdrogue", r"\bstupéfiant",
        r"\bbioéthique", r"\bdon d.organe", r"\btransfusion",
        r"\bvaccin", r"\bIVG\b", r"\bavortement",
        r"\binfirmi",
        r"\bautonomie", r"\bpersonnes? âgées?",
        r"\baction social", r"\baide social",
        r"\bcontracept", r"\bgrossesse",
        r"\bsécurité social", r"\bfinancement.*sécurité",
        r"\brevenu minimum", r"\bRSA\b", r"\bRMI\b",
        r"\bprotection.*enfan", r"\bperte d.autonomie",
        r"\baidant", r"\bEHPAD\b", r"\bvieillissement",
    ],

    "Police et sécurité": [
        r"\bpolic", r"\bgendarm", r"\bsécurité intérieure",
        r"\bsécurité publique", r"\bsécurité civile",
        r"\bterroris", r"\bvidéosurveil",
        r"\bvidéoprotect", r"\barme[s]?\b", r"\bexplosif",
        r"\bincendie", r"\bpompier", r"\bsécurité routière",
        r"\bdélinquance", r"\bcriminalit",
        r"\bsûreté\b",
        r"\bimmigration", r"\bétranger[s]?\b", r"\basile\b",
        r"\bfrontière", r"\bséjour\b",
        r"\bpirat", r"\bcyber",
        r"\bsécurité\b(?!.*\b(social|nucléaire|aliment|financ|juridique))",
    ],

    "Famille": [
        r"\bfamil", r"\benfant", r"\bmineur", r"\bparent",
        r"\bmaternit", r"\bpaternit", r"\badoption",
        r"\bmariage\b", r"\bdivorce", r"\bfiliation",
        r"\bpension alimentaire", r"\bautorité parentale",
        r"\bprotection de l.enfance", r"\bgarde d.enfant",
        r"\bcrèche", r"\bpetite enfance",
    ],

    "Culture": [
        r"\bcultur", r"\bpatrimoine", r"\bmusée",
        r"\baudiovisuel", r"\bcinéma", r"\blivre\b",
        r"\bbibliothèque", r"\barthist", r"\bartist",
        r"\bspectacle", r"\bmusique", r"\bthéâtre",
        r"\bpropriété littéraire", r"\bdroit d.auteur",
        r"\bmonument", r"\barchéolog",
        r"\bradiodiffusion", r"\btélévision",
        r"\bpresse\b", r"\bcommunication\b",
        r"\blangue\b", r"\bfrancophon",
    ],

    "Défense": [
        r"\bdéfense\b", r"\bmilitaire", r"\barmée",
        r"\bopération[s]? extérieure", r"\bopex\b",
        r"\bOTAN\b", r"\bprogrammation militaire",
        r"\bservice national", r"\bconscription",
        r"\bforces armées", r"\bvétéran[s]?\b.*\b(militaire|armée)",
    ],

    "Économie et finances, fiscalité": [
        r"\bfinance[s]?\b", r"\bfiscal", r"\bimpôt",
        r"\btaxe[s]?\b", r"\bTVA\b", r"\bdouane",
        r"\bbanque\b", r"\bbancaire", r"\bmonétaire",
        r"\bcrédit\b(?!.*agricole)", r"\bassurance[s]?\b(?!.maladie)",
        r"\bbourse\b", r"\bmarch[ée][s]? financier",
        r"\bcomptab", r"\baudit\b", r"\btrésor",
        r"\bépargne", r"\bplacements?\b",
        r"\bimposition", r"\bdoubles? imposition",
        r"\bévasion fiscal", r"\bcontribut",
        r"\bdomaine économique", r"\béconomi",
        r"\bprix\b", r"\binflation", r"\bpouvoir d.achat",
    ],

    "Budget": [
        r"\bbudget", r"\bfinances? publique",
        r"\bloi de finance", r"\brèglement.*budget",
        r"\bcomptes? public", r"\bdépense[s]? publique",
        r"\bdette\b", r"\bdéficit",
        r"\bprogrammation des finances",
    ],

    "Sécurité sociale": [
        r"\bsécurité sociale", r"\bfinancement.*sécurité",
        r"\bcotisation[s]? social", r"\bprotection sociale",
        r"\bprestation[s]? social",
    ],

    "Collectivités territoriales": [
        r"\bcollectivité", r"\bcommune[s]?\b", r"\bmunicipal",
        r"\bdépartement", r"\brégion[s]?\b(?!.*\beuropéen)",
        r"\bintercommunal", r"\bmétropole\b",
        r"\bdécentralis", r"\bélu[s]? locaux",
        r"\bconseil[s]? (municipal|départemental|régional)",
        r"\bcanton", r"\bterritorial",
        r"\blocal[e]?\b", r"\blocaux\b",
        r"\bcorse\b", r"\bproximité\b",
        r"\bresponsabilités? locales?",
    ],

    "Pouvoirs publics et Constitution": [
        r"\bconstitution", r"\bréféren", r"\bélection",
        r"\bélectoral", r"\bscrutin", r"\bsuffrage",
        r"\bparlement", r"\bassemblée nationale",
        r"\bsénat\b", r"\brépublique\b.*\bprésiden",
        r"\bconseil constitutionnel", r"\borganique\b",
    ],

    "Affaires étrangères et coopération": [
        r"\bapprobation de (la |l.)?convention",
        r"\bapprobation de (l.|l )?accord",
        r"\bratification de (la |l.)?convention",
        r"\bratification.*(protocole|accord|traité)",
        r"\bcoopération.*entre", r"\bentre.*gouvernement",
        r"\baffaires étrangères", r"\bdiplomati",
        r"\bambassad",
    ],

    "Traités et conventions": [
        r"\btraité\b", r"\bconvention\b(?!.*collective)",
        r"\baccord\b.*\bentre\b.*\bgouvernement",
        r"\bprotocole\b.*\bsigné",
        r"\bapprobation\b.*\baccord\b",
        r"\bratification\b",
    ],

    "Union européenne": [
        r"\bunion européenne", r"\beuropéen", r"\bcommunautaire",
        r"\bdirective\b.*\beuropéen", r"\brèglement\b.*\beuropéen",
        r"\btransposition\b", r"\bdroit (communautaire|de l.union)",
        r"\bschengen", r"\beuro\b",
    ],

    "Outre-mer": [
        r"\boutre.mer", r"\bnouvelle.calédonie", r"\bpolynésie",
        r"\bmayotte", r"\bguadeloupe", r"\bmartinique",
        r"\bguyane\b", r"\bréunion\b(?!.*de\s)",
        r"\bsaint.pierre.et.miquelon", r"\bwallis",
        r"\bdom.tom",
    ],

    "Entreprises": [
        r"\bentreprise", r"\bsociété[s]? commercial",
        r"\bcommerce\b", r"\bartisan", r"\bPME\b",
        r"\bconcurrence", r"\bconsomm",
        r"\bpropriété industrielle", r"\bbrevet",
        r"\bpropriété intellectuelle",
        r"\binvestissement", r"\bindustri",
        r"\bsociété\b.*\banonym", r"\bsoci[ée]t[ée][s]?\b.*\bcoopérat",
    ],

    "Fonction publique": [
        r"\bfonction publique", r"\bfonctionnaire",
        r"\bagent[s]? public", r"\bstatut.*fonction",
        r"\bservice public\b",
    ],

    "Anciens combattants": [
        r"\bancien[s]? combattant", r"\bvétéran",
        r"\bpupille[s]? de la nation", r"\bcommémorat",
        r"\bharkis?\b", r"\brapatri",
    ],

    "Recherche, sciences et techniques": [
        r"\brecherche\b(?!.*\bemploi)", r"\bscientifique",
        r"\binnovation", r"\btechnologi",
        r"\bnumérique", r"\binformatique",
        r"\bintelligence artificielle", r"\bdonnées personnelles",
        r"\binternet", r"\btélécommuni",
    ],

}


def classify_themes(titre: str) -> list[str]:
    """Classifie un titre de dossier législatif en un ou plusieurs thèmes."""
    if not titre:
        return []
    titre_lower = titre.lower()
    matched = []
    for theme, patterns in THEME_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, titre_lower):
                matched.append(theme)
                break  # Un seul match suffit pour ce thème
    return matched


# ─────────────────────────────────────────────
# 2. VALIDATION CONTRE LE CSV SÉNAT
# ─────────────────────────────────────────────

CSV_PATH = Path(__file__).resolve().parent.parent.parent / "Data brute" / "Sénat-jan2026" / "dossiers-legislatifs.csv"


def load_senat_csv(path: Path) -> list[tuple[str, set[str]]]:
    """Charge le CSV et retourne [(titre, {thèmes réels}), ...]."""
    rows = []
    with open(path, encoding="iso-8859-1", newline="") as f:
        reader = csv.reader(f, delimiter=";")
        next(reader)  # header
        for row in reader:
            if len(row) < 10:
                continue
            titre = row[0].strip()
            themes_raw = row[9].strip()
            if not themes_raw:
                continue
            # Certains thèmes Sénat contiennent une virgule dans leur nom.
            # On les protège avant de splitter.
            COMPOSITE_THEMES = {
                "Économie et finances, fiscalité": "Économie et finances, fiscalité",
                "Recherche, sciences et techniques": "Recherche, sciences et techniques",
                "PME, commerce et artisanat": "PME, commerce et artisanat",
            }
            protected = themes_raw
            for composite, placeholder in COMPOSITE_THEMES.items():
                protected = protected.replace(composite, placeholder.replace(",", "§"))
            themes = set()
            for t in protected.split(","):
                t = t.strip().replace("§", ",")
                if t:
                    themes.add(t)
            rows.append((titre, themes))
    return rows


def evaluate(data: list[tuple[str, set[str]]]):
    """Compare thèmes prédits vs réels et affiche les métriques."""
    # Compteurs par thème
    tp = defaultdict(int)  # true positives
    fp = defaultdict(int)  # false positives
    fn = defaultdict(int)  # false negatives

    all_themes = set(THEME_KEYWORDS.keys())
    errors = []

    for titre, real_themes in data:
        predicted = set(classify_themes(titre))

        for theme in all_themes:
            in_pred = theme in predicted
            in_real = theme in real_themes
            if in_pred and in_real:
                tp[theme] += 1
            elif in_pred and not in_real:
                fp[theme] += 1
            elif not in_pred and in_real:
                fn[theme] += 1

        # Collecter quelques erreurs pour le debug
        missed = real_themes - predicted
        extra = predicted - real_themes
        if missed or extra:
            errors.append((titre[:100], missed, extra))

    # Affichage
    print(f"\n{'='*80}")
    print(f"  RÉSULTATS — {len(data)} dossiers avec thèmes")
    print(f"{'='*80}\n")

    total_tp = total_fp = total_fn = 0
    theme_results = []

    for theme in sorted(all_themes):
        t = tp[theme]
        f_p = fp[theme]
        f_n = fn[theme]
        precision = t / (t + f_p) if (t + f_p) > 0 else 0
        recall = t / (t + f_n) if (t + f_n) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        support = t + f_n  # nb réel dans les données
        theme_results.append((theme, precision, recall, f1, support, t, f_p, f_n))
        total_tp += t
        total_fp += f_p
        total_fn += f_n

    # Tri par F1 décroissant
    theme_results.sort(key=lambda x: -x[3])

    print(f"{'Thème':<42} {'Prec':>5} {'Rec':>5} {'F1':>5} {'Supp':>5} {'TP':>5} {'FP':>5} {'FN':>5}")
    print("-" * 85)
    for theme, prec, rec, f1, supp, t, f_p, f_n in theme_results:
        bar = "█" * int(f1 * 20)
        print(f"{theme:<42} {prec:>5.2f} {rec:>5.2f} {f1:>5.2f} {supp:>5} {t:>5} {f_p:>5} {f_n:>5}  {bar}")

    # Globaux
    global_prec = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
    global_rec = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
    global_f1 = 2 * global_prec * global_rec / (global_prec + global_rec) if (global_prec + global_rec) > 0 else 0

    print("-" * 85)
    print(f"{'GLOBAL (micro-avg)':<42} {global_prec:>5.2f} {global_rec:>5.2f} {global_f1:>5.2f} {total_tp + total_fn:>5}")

    # Couverture : combien de dossiers reçoivent au moins un thème ?
    classified = sum(1 for titre, _ in data if classify_themes(titre))
    print(f"\n  Couverture : {classified}/{len(data)} dossiers ({classified/len(data)*100:.1f}%) reçoivent au moins 1 thème.")

    # F1 hors Société et Aménagement (thèmes catch-all)
    useful_tp = total_tp - tp.get("Société", 0) - tp.get("Aménagement du territoire", 0)
    useful_fp = total_fp - fp.get("Société", 0) - fp.get("Aménagement du territoire", 0)
    useful_fn = total_fn - fn.get("Société", 0) - fn.get("Aménagement du territoire", 0)
    u_prec = useful_tp / (useful_tp + useful_fp) if (useful_tp + useful_fp) > 0 else 0
    u_rec = useful_tp / (useful_tp + useful_fn) if (useful_tp + useful_fn) > 0 else 0
    u_f1 = 2 * u_prec * u_rec / (u_prec + u_rec) if (u_prec + u_rec) > 0 else 0
    print(f"  F1 thèmes utiles (hors Société/Aménagement) : {u_f1:.2f} (P={u_prec:.2f} R={u_rec:.2f})")

    # Top erreurs (FN = thèmes ratés)
    print(f"\n{'='*80}")
    print("  TOP 20 FAUX NÉGATIFS (thèmes réels non détectés)")
    print(f"{'='*80}\n")
    fn_examples = [(t, m, e) for t, m, e in errors if m]
    for titre, missed, extra in fn_examples[:20]:
        print(f"  Titre   : {titre}")
        print(f"  Manqué  : {missed}")
        if extra:
            print(f"  En trop : {extra}")
        print()

    # Top erreurs (FP = thèmes en trop)
    print(f"{'='*80}")
    print("  TOP 20 FAUX POSITIFS (thèmes prédits à tort)")
    print(f"{'='*80}\n")
    fp_examples = [(t, m, e) for t, m, e in errors if e and not m]
    for titre, missed, extra in fp_examples[:20]:
        print(f"  Titre   : {titre}")
        print(f"  En trop : {extra}")
        print()


if __name__ == "__main__":
    if not CSV_PATH.exists():
        print(f"Fichier introuvable : {CSV_PATH}")
        sys.exit(1)

    data = load_senat_csv(CSV_PATH)
    print(f"Chargé : {len(data)} dossiers avec thèmes depuis le CSV Sénat.")
    evaluate(data)
