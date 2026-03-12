## Semaine du 11 mars 2026

### Modifié
- Le bouton "Signaler" devient **"Une idée ? Un problème ?"** — il permet désormais de proposer des idées de fonctionnalités en plus de signaler des bugs
- La modale s'ouvre sur un écran de choix entre "Signaler un problème" et "Proposer une idée", avec un formulaire adapté à chaque cas

---

## Semaine du 10 mars 2026

### Ajouté
- Multi-sélection des filtres par type de carte dans le fil d'actualité — on peut maintenant combiner plusieurs filtres en même temps
- Indicateurs d'application des lois dans les KPIs — nouveau funnel et graphiques montrant combien de décrets d'application ont été pris pour chaque loi
- Suivi de l'application des lois dans le fil d'actualité — les cartes de décrets d'application apparaissent dans le flux
- Cartes décrets d'application dans le fil d'actualité avec redesign des cartes de promulgation
- Scroll infini sur le fil d'actualité — plus besoin de naviguer entre les mois, le contenu se charge au défilement
- Import automatique du contenu des décrets d'application depuis Légifrance
- Tri chronologique, dénomination des décrets et date des versions consolidées dans les résumés IA
- Page "Notes de version" accessible depuis le pied de page — historique complet des évolutions du site, organisé par semaine avec sections dépliables

### Modifié
- Le "Fil du mois" a été renommé en "Fil d'actualité" partout sur le site pour plus de clarté

### Corrigé
- L'ordre du fil d'actualité dans les pages dossier affiche maintenant les événements récents en premier
- Suppression du flickering lors du streaming des résumés IA (deux corrections successives pour les cas cachés et non-cachés)
- Correction du pipeline pour rattraper les lois enrichies sans lien de texte

---

## Semaine du 3 mars 2026

### Ajouté
- Enrichissement des données législatives via l'API Légifrance — lois et versions consolidées
- Import du suivi d'application des lois depuis le baromètre de l'Assemblée nationale
- Cache de 1 heure et skeletons de chargement sur les pages Dossiers, KPIs, Fil d'actualité et Composition
- Pages d'erreur dédiées en cas de panne Supabase (au lieu de pages blanches)
- Vague SVG animée avec deux couches en mouvement inversé sur la landing page
- Cache Supabase pour les résumés IA — les résumés déjà générés se chargent instantanément
- Section fil d'actualité avec mockup sur la landing page
- Système de signalement citoyen — bouton "Signaler un problème" sur chaque page
- Notification email automatique via GitHub Actions à chaque signalement reçu
- Récapitulatif hebdomadaire par email des signalements de la semaine
- Adoption de la licence GNU AGPL v3
- Réécriture complète du README avec architecture, stack, installation et sources
- Recherche de parlementaires dans les KPIs — barre de recherche pour trouver rapidement un député ou sénateur
- Classement des parlementaires les plus actifs avec badge de chambre (AN/Sénat)
- KPIs chronologiques et liens externes sur les pages de résumé IA des dossiers
- Graphiques d'activité par groupe politique dans les KPIs avec liens "comment c'est calculé"
- Préfixe de rôle pour les auteurs dans le fil d'actualité (député, sénateur, etc.)
- Refonte des cartes navette dans le fil d'actualité avec affichage des durées en cours
- Refonte des cartes rapport et rapport CMP avec affichage des rapporteurs
- Refonte des cartes de décision — titre du scrutin, type de vote et majorité requise
- Amélioration de la carte de saisine du Conseil constitutionnel
- Numéro de loi affiché sur les cartes de promulgation
- Badge dernière mise à jour et refonte du bouton hero sur la page d'accueil
- Alertes et newsletter sur l'accueil, grille de fonctionnalités en 4 colonnes
- Indicateur de publication des textes (stocké en base au lieu de vérification live)
- Direction émettrice → réceptrice affichée sur les cartes de navette entre chambres

### Modifié
- Refonte des sections de la landing page avec mockups cliquables et section À propos enrichie
- Refonte de la landing page avec nouvelle palette teal/or
- CTA hero renommé en "Fil d'actu parlementaire"
- Titre de page KPIs renommé en "Indicateurs clés"
- Refonte visuelle de la sidebar avec icônes et accordéons dépliables
- Liste des dossiers plus compacte avec auteur qualifié et timeout sur le résumé IA
- Centralisation des badges de statut et correction du double filtrage
- Amélioration de la visibilité des alertes quand un texte est indisponible
- Amélioration des boutons de contribution et du footer du site
- Page À propos complétée avec stack technique, sources de données, Légifrance et baromètre AN
- Suppression des moyennes de participation individuelle dans la page Composition

### Corrigé
- Correction de la section hero-2 en dark mode via variables CSS
- Désactivation du cache Turbopack et correction du saut de layout du résumé IA
- Correction du pipeline pour ne plus écraser les données enrichies depuis Légifrance
- Titre des cartes du fil d'actualité forcé à commencer à la ligne
- Suppression d'un console.log qui exposait le mot de passe du site
- Correction d'une erreur TypeScript sur les cookies de login
- Correction du layout sticky du footer
- Retrait du dossier .claude/ du dépôt et ajout au .gitignore
- Amélioration de la lisibilité du badge de durée sur les dossiers et correction du calcul à 0 jour
- Correction de l'ordre de la timeline dans les résumés IA
- Label "Rapport" corrigé pour CMP_RAPPORT
- Correction de la source du badge DECISION et du nettoyage des vote_refs dans le script Python
- Correction de l'affichage des motions de censure et du parsing des auteurs
- Suppression d'une comparaison orpheline qui bloquait le build TypeScript

---

## Semaine du 24 février 2026

### Ajouté
- KPIs records individuels de participation et de cohésion dans la page Composition
- Indicateurs de mobilisation de l'hémicycle aux scrutins (taux de présence global)
- Liens vers la méthodologie sous les KPIs records individuels
- Exclusion des non-votants institutionnels dans le calcul de participation (président de séance, etc.)
- Fil d'actualité mensuel — nouvelle page montrant toute l'activité législative du mois (dépôts, navettes, votes, promulgations, saisines, etc.)
- Lien vers la chronologie du dossier depuis le résumé IA
- Fil d'actualité intégré sur la page d'accueil avec bouton de redirection
- Animation hover agrandie sur les icônes du footer des cartes

### Modifié
- Audit complet et refactoring des scripts d'import (acteurs, organes, actes législatifs) — suppression du code mort, ajout de retry
- Transformation du fil de la semaine en fil du mois pour une vision plus complète
- Pastilles-filtres unifiées remplaçant les anciennes pills KPI et la barre de filtres
- Harmonisation des titres, padding et containers sur toutes les pages
- Centralisation des libellés du fil d'actualité et suppression du code dupliqué
- Simplification des cartes de motion de censure
- Optimisation des requêtes et amélioration des cartes de décision
- Vérification des liens de texte ajoutée au script d'import avec stockage en base

### Corrigé
- Calcul de participation des députés ajusté à la période de mandat effective
- Calcul multi-périodes pour les députés ex-ministres revenus à l'Assemblée
- Renommage "absents" en "non-participants" pour préciser la distinction
- Affichage correct des promulgations, saisines du Conseil constitutionnel et déclarations du gouvernement
- Correction du décalage de padding lors de la disparition de la sidebar en responsive
- Correction de l'affichage des votes liés à des actes sans texte associé
- Correction de l'affichage des actes législatifs dans le fil du mois
- Correction des liens TAP avec fallback PDF pour les propositions de loi
- Ajout de types string aux callbacks forEach qui bloquaient le déploiement

---

## Semaine du 17 février 2026

### Ajouté
- Section documentation complète accessible depuis la sidebar — guide utilisateur, méthodologie, glossaire
- Page de conformité IA (AI Act) avec transparence sur l'utilisation de l'intelligence artificielle
- Métadonnées du dossier (auteur, type de procédure, statut) et frise de progression sur la page résumé IA
- Tooltips expliquant les types de procédure législative
- Compteur de textes et UID affichés dans les cartes de dossiers
- KPIs avancés — délais moyens par chambre, taux de promulgation, taux de succès par groupe politique
- Recherche par mot-clé sur la page des dossiers législatifs
- Redesign complet des cartes de dossiers avec barre de progression législative dynamique
- Combobox de sélection dans les résumés IA (remplace l'ancien tableau) avec résumé structuré en 3 sections
- Enrichissement des données via l'API Légifrance (lois et versions consolidées)
- Badge sur la page de login
- Statistiques de votes dans la page Composition
- Tableau des membres dans la page Composition avec tri par colonne
- Système de login avec protection par mot de passe du site
- Graphiques interactifs (AN et Sénat) avec animations chiffrées dans la page Composition
- Onglets de navigation Assemblée/Sénat/Gouvernement dans la page Composition
- Graphique de composition du Sénat
- Création de la page Composition des institutions
- Page KPIs complète pour les dossiers législatifs avec filtrage
- Filtre par groupe politique sur la page des dossiers législatifs et dans les KPIs
- Couleur primary en orange pour le dark mode

### Modifié
- Méthodologie entièrement réécrite avec définitions de glossaire complètes et liens bidirectionnels KPIs ↔ méthodologie
- Restructuration du tableau des stats par groupe avec sections par chambre dans les KPIs
- Navigation mobile optimisée
- Bouton "Résumé IA" mis en valeur avec animation shimmer compatible tous navigateurs
- Padding-top mobile augmenté pour éviter le chevauchement avec la barre de navigation
- Utilisation de la date de dépôt au lieu de la date des actes législatifs sur la page des dossiers
- Amélioration de la gestion des fuseaux horaires dans les dates
- Refactoring général et optimisation de la structure du projet
- Amélioration de l'interface des filtres
- Import des dossiers avant les textes, batch de 500 pour le script de textes
- Distinction entre députés, sénateurs et ministres actifs dans le script d'import
- Amélioration de la distinction visuelle entre liens valides et invalides
- Amélioration de la performance du script d'import des dossiers
- Page d'introduction redesignée avec couleur primary

### Corrigé
- Liens d'ancrage vers la méthodologie corrigés avec ajout de rehype-slug
- Page Composition rendue responsive pour mobile
- Normalisation du format des libellés de profession dans le script d'import
- Fallback sur l'auteur du texte quand l'initiateur du dossier est absent
- Correction du statut "Rejeté" pour les procédures à chambre unique
- Correction de l'affichage des statuts d'adoption non définis dans le combobox du résumé IA
- Correction de la taille des graphiques

---

## Semaine du 10 février 2026

### Ajouté
- Filtre dynamique par type de texte sur la page des dossiers
- Filtre dynamique par groupe politique actif
- Bouton de réinitialisation des filtres
- Le résumé IA s'ouvre dans un nouvel onglet
- Résumé IA en streaming — le texte apparaît progressivement
- Script d'import automatique des dossiers législatifs depuis l'URL de l'open data
- Script d'import des textes depuis le stockage cloud
- Script combiné d'import des acteurs et organes avec upload en batch
- Import des actes législatifs via l'URL de l'open data avec gestion des doublons
- Mise en place de GitHub Actions pour l'import automatique quotidien
- Effet hover sur les filtres de la page des dossiers
- Filtre par statut sur la page des dossiers
- Filtre par âge du texte
- Gestion des dates de promulgation sur la page principale
- Import des textes promulgués avec date de promulgation
- Date de dépôt importée dans la table des dossiers
- Filtres pour les statuts adoption et rejet

### Modifié
- Suppression du résumé chronologique (remplacé par le résumé IA)
- Amélioration du filtre par âge via requête base de données
- Statut amélioré : utilisation de la dernière décision en date par assemblée
- Amélioration de la performance d'upload des dossiers législatifs
- Import des actes législatifs optimisé en batch de 1000
- Correction de l'indentation des scripts Python avec Black
- Amélioration du rapport final du script avec déduplications

### Corrigé
- Résolution d'une erreur liée au parsing PDF
- Les filtres sont maintenant correctement cumulatifs (au lieu de se remplacer)
- Le bouton reset ramène à la page 1
- Les filtres reviennent en page 1 quand ils changent, mais conservent la page quand on pagine
- Correction de l'affichage des dossiers sans auteurs
- Suppression du filtre par groupe qui ne fonctionnait pas correctement

---

## Semaine du 3 février 2026

### Ajouté
- Construction de la page principale basée sur les données Supabase (remplacement de la page statique)
- Métadonnées des dossiers récupérées depuis Supabase
- Tableau des textes sur la page de résumé IA
- Intégration complète du résumé IA (envoi du texte à Grok, affichage du résultat)
- Parsing des PDF fonctionnel pour extraire le texte des lois avant envoi à l'IA
- Titre affiché en haut du résumé IA
- Liens valides vers les textes officiels

### Modifié
- Amélioration des scripts d'import des textes
- Mise à jour des packages
- Amélioration de la route API du résumé IA
- Amélioration de l'expérience utilisateur sur la page principale
- Amélioration générale des scripts d'import Python

---

## Semaine du 27 janvier 2026

### Ajouté
- Script d'import de la table des acteurs (députés, sénateurs, ministres)
- Script d'import des organes (groupes politiques, commissions, etc.)
- Script d'import des scrutins et votes
- Script d'import des dossiers législatifs

### Modifié
- Amélioration du script Python pour les rapports sénatoriaux
- Le script de textes génère maintenant 100% des liens vers les textes officiels

---

## Semaine du 20 janvier 2026

### Ajouté
- Structure initiale du projet LoiClair avec scripts de parsing et documentation
- Externalisation des paramètres IA dans un fichier de prompts dédié
- Système de pagination sur la liste des dossiers législatifs
- Résumé et chronologie des lois avec amélioration des prompts IA et rendu markdown
- Bouton "Discuter avec l'IA" pour poser des questions sur une loi
- Skeleton de chargement pendant l'attente des données
- Page KPIs avec les premiers indicateurs clés
- Script Python pour envoyer les textes dans Supabase avec extraction des auteurs et rapporteurs

### Modifié
- Amélioration du panneau latéral et de l'interface graphique
- Refactoring du bouton de réinitialisation
- Amélioration du script d'import (gestion des tomes, itérations)

---

## Semaine du 10 janvier 2026

### Ajouté
- Création du projet — initialisation Next.js
