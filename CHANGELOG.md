## Semaine du 9 mars 2026

### Ajouté
- **Interface bilingue français/anglais** — toute l'interface est désormais disponible en anglais grâce à un toggle FR/EN dans la barre latérale. La langue est mémorisée dans un cookie
- **Résumés IA en anglais** — les résumés de lois peuvent être générés en anglais, avec un cache séparé pour chaque langue
- **Traduction du guide et de la méthodologie** — les pages documentation sont disponibles en anglais
- **Pages 404 et erreur localisées** — les pages d'erreur s'affichent dans la langue choisie, avec un lien pour signaler un bug
- **Nouveau statut « Appliquée »** — les lois promulguées dont tous les décrets d'application sont publiés (ou d'application directe) sont désormais identifiées par le statut « Appliquée », avec un badge et un bullet doré
- **Filtre « Appliquée »** — un nouveau filtre statut permet d'isoler les lois pleinement appliquées dans la liste des dossiers
- **Carte IA avec bordure lumineuse** — le résumé est présenté dans une carte avec une bordure dorée dégradée qui pulse doucement
- **Lien « Discuter de ce texte avec l'IA »** — un lien doré animé en pied de carte permet d'ouvrir une discussion approfondie sur le texte via Perplexity, avec le contexte législatif pré-rempli
- **Encart « À retenir »** — la phrase-clé de chaque résumé est mise en valeur dans un encart coloré en bas du résumé
- **Pastilles teal sur les changements** — chaque point de la section « Ce qui change » est accompagné d'une icône check sur fond teal
- **Section « En bref »** — un résumé en 2-3 phrases visible immédiatement en haut de la page, avant les sections détaillées
- **Sélecteur de texte en haut de page** — un menu déroulant permet de choisir le texte à résumer directement sous le titre, avec les textes groupés par étape législative et triés par date
- **Label « Résumé IA »** — une icône ✨ et un intitulé identifient clairement la section comme contenu généré par intelligence artificielle
- **Accordéons dans la timeline** — chaque étape ayant des textes associés peut être dépliée pour voir et sélectionner les textes disponibles
- **Section « À propos de cette loi »** — les métadonnées du dossier (statut, procédure, auteur avec son rôle, sources officielles) sont regroupées dans une section dédiée
- **Bandeau titre sur la page résumé IA** — un bandeau avec dégradé subtil habille désormais le titre du dossier pour une meilleure lisibilité
- **Durées intégrées dans la timeline** — la durée totale du parcours législatif (« Promulgué en X j ») et la durée d'application (« Appliquée en X j ») s'affichent directement sous les étapes correspondantes
- **Icônes spéciales** — l'étape Promulguée porte une icône ✓ et l'étape Application un drapeau pour les distinguer visuellement
- **Date d'application** — pour les lois nécessitant des décrets, l'étape Application affiche la date du dernier décret publié
- **Application directe** — les lois d'application directe affichent « Promulguée (application directe) » avec « Promulgué et appliqué en X j » en une seule étape finale
- **Timeline verticale sur la page résumé IA** — le parcours législatif d'un dossier est désormais affiché sous forme de timeline verticale avec la date de chaque étape, la durée entre deux étapes consécutives, et un point animé sur l'étape en cours
- **Étapes post-promulgation** — après la promulgation, la timeline affiche les décrets d'application et le statut d'application de la loi
- **Étape suivante en attente** — la timeline affiche l'étape suivante attendue (autre chambre ou promulgation) avec une ligne en pointillés
- **Préfixe « Texte CMP »** dans le fil d'actualité — les décisions de débat en CMP affichent désormais « Texte CMP · » devant le nom de l'institution
- **« En cours depuis X j »** — l'étape en cours dans la timeline affiche désormais depuis combien de temps elle est active, en orange
- **Durée de publication des décrets** — l'étape « Décrets d'application » affiche combien de temps il a fallu pour publier tous les décrets, ou « en cours depuis X j » si tous ne sont pas encore publiés
- **Filtres en panneau sur mobile** — sur la page des dossiers législatifs, les filtres sont regroupés dans un panneau qui s'ouvre depuis un bouton "Filtres", pour une navigation plus fluide sur téléphone
- Multi-sélection des filtres par type de carte dans le fil d'actualité — on peut maintenant combiner plusieurs filtres en même temps
- Indicateurs d'application des lois dans les KPIs — nouveau funnel et graphiques montrant combien de décrets d'application ont été pris pour chaque loi
- Suivi de l'application des lois dans le fil d'actualité — les cartes de décrets d'application apparaissent dans le flux
- Cartes décrets d'application dans le fil d'actualité avec redesign des cartes de promulgation
- Scroll infini sur le fil d'actualité — plus besoin de naviguer entre les mois, le contenu se charge au défilement
- Import automatique du contenu des décrets d'application depuis Légifrance
- Tri chronologique, dénomination des décrets et date des versions consolidées dans les résumés IA
- Page "Notes de version" accessible depuis le pied de page — historique complet des évolutions du site, organisé par semaine avec sections dépliables
- **Navigation unifiée** — un menu horizontal unique en haut de toutes les pages remplace l'ancienne barre latérale fixe + header séparé. Les catégories (Fil d'actu, Tableau de bord, Organes, Documentation, À propos) sont centrées avec le logo
- **Sidebar contextuelle** — une barre latérale minimaliste (texte seul, sans icônes) apparaît uniquement sur les pages ayant des sous-catégories (KPIs, Composition, Documentation…)
- **Menu mobile repensé** — un bouton burger ouvre un panneau avec les catégories en accordéon et leurs sous-liens
- **Bouton « Contribuer »** — un pill GitHub dans le menu appelle à signaler des bugs ou proposer des améliorations
- **Basculer clair/sombre** — un bouton lune/soleil dans le menu permet de changer le thème avec une transition fluide (View Transitions API)
- **Fil d'Ariane sur la page résumé IA** — un breadcrumb « Tous les textes / Dossier LoiClair » permet de revenir facilement à la liste des dossiers
- **Squelette de chargement pour le résumé IA** — un skeleton animé s'affiche pendant le chargement de la page résumé, éliminant le flash blanc lors de la transition
- **Footer enrichi** — pied de page en colonnes avec liens organisés par catégorie (Explorer, Ressources, Légal, Contact)
- **Page changelog redessinée** — les notes de version adoptent un style épuré avec des pastilles colorées (vert = ajouté, bleu = modifié, jaune = corrigé, gris = supprimé) et sont intégrées à la section Documentation dans la barre latérale
- **Pages détaillées par institution** — chaque organe législatif dispose désormais de sa propre page : Assemblée nationale, Sénat, Gouvernement et Conseil constitutionnel. Chaque page présente des informations pédagogiques, les KPIs de composition, les groupes politiques et un tableau complet des membres
- **Page Conseil constitutionnel** — page pédagogique expliquant le rôle du Conseil, sa composition (9 membres, mandat de 9 ans non renouvelable, renouvellement par tiers), ses missions et la Question Prioritaire de Constitutionnalité (QPC)

### Modifié
- **Page Composition transformée en dashboard** — l'ancienne page à onglets est remplacée par un tableau de bord comparatif affichant les trois institutions côte à côte avec leurs KPIs résumés et un lien vers chaque page détaillée
- **Bouton « Une idée ? Un problème ? » dans la navigation** — le bouton de signalement/idée passe du coin bas droit de l'écran vers la barre de navigation en haut (pill sur desktop, item dans le menu burger sur mobile). Le bouton « Contribuer » (GitHub) est déplacé dans le pied de page
- **Liste des dossiers — cartes entièrement cliquables** — chaque dossier dans la liste est désormais un lien cliquable sur toute sa surface, avec un label « Résumé IA → » qui apparaît au survol (bordure gauche accent + fond coloré)
- **Page résumé IA — bordure dorée** — la carte du résumé IA est encadrée d'une fine bordure dorée dégradée avec un glow qui pulse doucement
- **Graphique mensuel localisé** — le titre, la description et les tendances du graphique d'évolution mensuelle s'adaptent à la langue
- **Recherche et filtres localisés** — le placeholder de recherche, les labels de filtres et la pagination s'affichent dans la langue choisie
- **Entonnoir législatif localisé** — le parcours législatif dans les indicateurs clés s'affiche dans la langue active
- **Notes de version bilingues** — la page notes de version s'affiche en français ou en anglais selon la langue choisie
- **Toggle langue aligné à gauche** — le sélecteur FR/EN est calé à gauche dans la barre latérale pour un meilleur alignement visuel
- **Couleurs des statuts harmonisées** — chaque statut a maintenant une couleur distincte : or pour « Appliquée », vert pour « Promulguée », violet unifié pour tous les « Adopté », rouge pour « Rejeté », orange pour « En cours »
- **Comptabilisation des lois appliquées dans les indicateurs** — les lois « Appliquées » sont correctement comptées à la fois comme promulguées et comme appliquées dans le tableau de bord
- **Section « À propos de cette loi » restructurée** — les métadonnées sont désormais affichées dans une grille structurée avec des labels alignés, plus lisible qu'avant
- **Lien « Texte officiel »** — le lien vers le texte sur Légifrance a été renommé de « Lire le texte » à « Texte officiel » pour plus de clarté
- **Label du texte résumé tronqué sur mobile** — le nom du texte est raccourci avec des points de suspension quand l'écran est trop petit
- **Footer toujours aligné à gauche** — le pied de carte IA s'aligne naturellement à gauche quand son contenu passe sur plusieurs lignes
- **Nouveau prompt IA — 3 sections conversationnelles** — le résumé passe de 4 sections techniques à 3 sections en langage courant : « Ce que dit ce texte », « Ce qui change concrètement » et « À retenir »
- **Sélecteur de texte intégré en pied de carte** — le sélecteur est maintenant directement dans le pied de la carte IA au lieu d'une section séparée en haut de page
- **Carte toujours accessible** — même sur un texte invalide ou une version consolidée, la carte reste visible et le bouton « Changer » est toujours accessible
- **Nouvelle organisation de la page** — le résumé IA est désormais en haut (visible sans scroller), suivi des métadonnées, puis du parcours de la loi
- **Indicateur de génération** — le message « Génération en cours… » s'affiche à côté du titre « Résumé IA » au lieu d'occuper une ligne séparée
- **Provenance dans le sélecteur** — chaque texte indique son étape d'origine (Ass. nat., Sénat, CMP…) dans le menu déroulant
- **Chargement plus rapide de la page résumé IA** — les données de vote sont maintenant récupérées en une seule requête au lieu de deux
- **Code interne réorganisé** — la timeline et les résultats de vote sont maintenant des composants indépendants
- **Timeline en colonne continue** — la ligne verticale reliant les étapes est désormais ininterrompue
- **Résolutions et textes non promulguables** — les résolutions et rapports d'information n'affichent plus « Promulguée » comme étape suivante
- **Simplification des indicateurs** — les badges de durée par chambre sont supprimés car ces informations sont désormais lisibles dans la timeline
- **Durées sur les lignes de connexion** — les durées entre étapes sont affichées sur la ligne reliant deux étapes, pour éviter toute ambiguïté
- **Espacement uniforme** — toutes les étapes de la timeline ont désormais le même espacement vertical
- **Optimisation mobile générale** — espacement réduit en haut des pages, marges latérales ajustées, meilleure utilisation de l'espace sur petit écran
- **Page d'accueil plus compacte sur mobile** — le héro et les sections prennent moins de place verticale
- Les filtres (statut, dates, types, groupes, thèmes) s'affichent en pleine largeur sur mobile pour plus de lisibilité
- Le bouton "Signaler" devient **"Une idée ? Un problème ?"** — il permet désormais de proposer des idées de fonctionnalités en plus de signaler des bugs
- La modale s'ouvre sur un écran de choix entre "Signaler un problème" et "Proposer une idée", avec un formulaire adapté à chaque cas
- Le "Fil du mois" a été renommé en "Fil d'actualité" partout sur le site pour plus de clarté
- **Titres de page réduits** — les titres H1 de toutes les pages sont plus compacts pour s'harmoniser avec la nouvelle navigation
- **Plus d'espace avant le footer** — une marge confortable sépare le contenu du pied de page
- **Fond chaud subtil** — le contenu des pages retrouve sa teinte chaude légère qui le distingue de la barre de navigation
- **Entonnoir législatif compact** — le parcours législatif (« Legislative journey ») est désormais affiché en mode stepper vertical compact : chiffres colorés + labels + taux de conversion, sans barres horizontales — beaucoup plus lisible et compact
- **Filtres repensés sur la page des dossiers** — la barre de recherche occupe toute la largeur, les filtres sont regroupés dans un panneau latéral (à droite sur desktop, en bas sur mobile) accessible via un bouton « Filtres » avec badge compteur. Les filtres actifs s'affichent comme des pastilles supprimables d'un clic
- **Page « Types de textes » réorganisée** — la page est désormais divisée en deux sections (textes parlementaires / textes gouvernementaux) avec un design en grille de cartes légères, et trois nouveaux types ajoutés : Amendement, Ordonnance et Décret
- **Page « Processus législatif » redessinée** — les institutions sont présentées dans une grille de cartes avec photos des bâtiments ; un clic ouvre un modal avec le détail. Le parcours d'une loi devient un stepper vertical interactif avec 8 étapes (ajout des « Décrets d'application »), dots et lignes connectrices, et un détail dépliable par clic
- **Navigation vers le résumé IA dans le même onglet** — cliquer sur un dossier navigue dans le même onglet (au lieu d'ouvrir un nouvel onglet) pour une transition plus fluide avec le skeleton de chargement
- **Filtres en panneau sur la page KPIs** — les filtres « Type » et « Groupe » de la page indicateurs clés sont désormais regroupés dans un panneau latéral (bouton « Filtres » + pastilles actives), aligné sur le même design que la page dossiers législatifs

### Corrigé
- **Cartes « boîte à outils » disparaissaient** — les cartes de fonctionnalités sur la page d'accueil restent visibles après un changement de langue
- **Résumé IA cassé** — la requête de données échouait car une colonne n'existait pas encore en base ; corrigé par l'ajout de la colonne et la mise à jour du code
- **Label dupliqué corrigé** — le nom du texte n'est plus répété quand il correspond au nom de l'étape
- **Ordre des étapes** — le Conseil constitutionnel et la CMP s'affichent désormais à la bonne position chronologique
- **Dates erronées filtrées** — les décrets dont la date est antérieure au dépôt du dossier sont exclus de la timeline
- **Statut d'application** — quand une loi est 100 % appliquée, l'étape « Application » est correctement marquée comme terminée dans la timeline
- **Filtres sur Safari** — le panneau de filtres mobile ne s'affichait plus correctement sur Safari. Corrigé pour que les filtres inline s'affichent sur desktop et le panneau uniquement sur mobile
- **Clavier mobile sur les filtres** — le clavier virtuel ne s'ouvre plus automatiquement à l'ouverture du panneau de filtres sur mobile (Safari)
- **Logo "LoiClair" cohérent** — la taille et le lien du logo en haut à gauche sont maintenant identiques sur toutes les pages
- L'ordre du fil d'actualité dans les pages dossier affiche maintenant les événements récents en premier
- Suppression du flickering lors du streaming des résumés IA (deux corrections successives pour les cas cachés et non-cachés)
- Correction du pipeline pour rattraper les lois enrichies sans lien de texte
- **Fil d'actualité coupé sur mobile** — le contenu du fil d'actu débordait à gauche et à droite sur petit écran à cause de marges négatives
- **Titres des dossiers écrasés sur mobile** — le panneau latéral « Résumé IA » masqué comprimait le titre sur certains navigateurs mobiles
- **Scintillement du résumé IA en streaming** — le texte du résumé clignotait et se superposait pendant la génération en direct, causé par un double appel API en mode développement. Ajout d'un throttle pour lisser l'affichage
- **Formatage markdown dans les résumés IA** — le gras, l'italique et autres formats générés par l'IA s'affichent désormais correctement au lieu de montrer les caractères bruts (ex : `**texte**`)
- **Bouton « Une idée ? Un problème ? » coupé sur mobile** — le texte et l'icône du bouton de signalement dans le menu mobile étaient mal alignés et le texte débordait sur deux lignes

### Supprimé
- L'ancien bouton "Dossier LoiClair avec résumé IA" (badge pill cyan) a été remplacé par la carte cliquable
- **Badges statut et procédure** — remplacés par des lignes dans la grille de métadonnées pour une lecture plus uniforme
- **Accordéon mobile / grille desktop** — remplacés par un affichage unique, fluide et vertical sur tous les écrans
- **Section séparée « Sélecteur de texte »** — intégrée dans le pied de carte IA
- **Ancien menu déroulant** — l'ancien sélecteur de texte (dropdown confus) a été remplacé par le nouveau sélecteur groupé par étape
- **Badges KPI séparés** — les indicateurs de durée sont désormais intégrés directement dans la timeline
- **Ancienne barre latérale fixe** — remplacée par la navigation horizontale unifiée et la sidebar contextuelle
- **Menu mobile séparé** — remplacé par le burger intégré au TopNav

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
