# Méthodologie des indicateurs

Cette page détaille la façon dont chaque indicateur est calculé, d'où viennent les données et ce qu'ils ne mesurent pas.

---

## Taux de promulgation

**Ce que ça mesure**
Ce taux indique quelle part des textes qui avaient vocation à devenir des lois ont effectivement été promulgués par le Président de la République. C'est un indicateur global de l'efficacité du processus législatif.

**Comment c'est calculé**
> Taux de promulgation = (Nombre de textes promulgués ÷ Nombre de textes à vocation législative) × 100

Exemple chiffré : si 120 textes ont été promulgués sur 400 textes à vocation législative, le taux est de 30 %.

Variables **incluses** :
- **Textes promulgués** (numérateur) : tous les dossiers dont le statut indique qu'ils ont été promulgués — c'est-à-dire signés par le Président et publiés au Journal officiel.
- **Textes à vocation législative** (dénominateur) : les dossiers dont le type de procédure est conçu pour aboutir à une loi. Cela inclut les projets et propositions de loi ordinaire, les lois constitutionnelles, les lois organiques, les lois de finances (initiales et rectificatives), les lois de financement de la sécurité sociale et les ratifications de traités et conventions.

Variables **exclues et pourquoi** :
- Les résolutions, pétitions, missions d'information, commissions d'enquête, rapports d'information, allocutions et engagements de responsabilité gouvernementale sont exclus du dénominateur. Ces textes n'ont pas vocation à être promulgués en loi — les compter fausserait le taux vers le bas.

**D'où viennent les données**
Les données proviennent de l'open data de l'Assemblée nationale, mises à jour chaque nuit. La période couverte est l'ensemble de la 17ᵉ législature.

**Ce que ça ne mesure pas**
⚠ Ce taux ne reflète pas la qualité ou l'importance des lois promulguées. Un taux élevé signifie que beaucoup de textes déposés aboutissent, pas que l'activité législative est de qualité.

⚠ Les textes encore en cours d'examen ne sont pas comptabilisés comme promulgués. Le taux actuel est donc provisoire et augmentera à mesure que les dossiers en cours aboutissent.

**Comment interpréter**
Un taux de 30 % signifie qu'environ 1 texte sur 3 ayant vocation à devenir une loi y parvient effectivement. Ce chiffre peut varier fortement selon les filtres appliqués (type de procédure, groupe politique initiateur).

---

## Délai moyen de promulgation

**Ce que ça mesure**
Le temps moyen, en jours, entre le dépôt officiel d'un texte au Parlement et sa signature (promulgation) par le Président de la République. C'est une mesure globale de la vitesse du processus législatif de bout en bout.

**Comment c'est calculé**
> Délai d'un texte = Date de promulgation − Date de dépôt (en jours)
> Délai moyen = Somme de tous les délais ÷ Nombre de textes promulgués

Exemple chiffré : un texte déposé le 1ᵉʳ janvier et promulgué le 1ᵉʳ juillet a un délai de 181 jours. Le délai moyen est la moyenne de tous ces délais sur l'ensemble des textes promulgués.

Variables **incluses** :
- **Date de dépôt** : la date à laquelle le texte a été officiellement déposé au Parlement.
- **Date de promulgation** : la date à laquelle le Président de la République a signé la loi.

Variables **exclues et pourquoi** :
- Seuls les textes ayant à la fois une date de dépôt et une date de promulgation sont pris en compte. Les textes encore en cours d'examen, rejetés ou sans date complète sont exclus car on ne peut pas calculer leur délai de bout en bout.

**D'où viennent les données**
Les données proviennent de l'open data de l'Assemblée nationale, mises à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ La moyenne est sensible aux cas extrêmes. Un texte déposé et promulgué en 10 jours (urgence nationale) tire la moyenne vers le bas autant qu'un texte bloqué 5 ans la tire vers le haut. Les valeurs minimum et maximum affichées à côté de la moyenne permettent de visualiser cette dispersion.

⚠ Cet indicateur ne distingue pas les procédures accélérées des procédures ordinaires. Pour une analyse plus fine, utilisez le filtre par type de procédure.

**Comment interpréter**
Un délai inférieur à 100 jours est typique d'une procédure accélérée (urgence déclarée). Un délai de 300 à 600 jours correspond à une procédure législative ordinaire complète. Au-delà de 600 jours, le texte a généralement fait plusieurs allers-retours entre les deux chambres.

---

## Délai moyen à l'Assemblée nationale

**Ce que ça mesure**
Le temps écoulé, en jours, entre le dépôt d'un texte à l'Assemblée nationale et la décision d'adoption par cette chambre. Cet indicateur isole la vitesse de travail propre à l'Assemblée nationale, indépendamment du Sénat.

**Comment c'est calculé**
> Délai Assemblée nationale d'un texte = Date de la décision d'adoption à l'Assemblée nationale − Date du dépôt à l'Assemblée nationale (en jours)
> Délai moyen = Somme de tous les délais ÷ Nombre de textes adoptés à l'Assemblée nationale

Exemple chiffré : un texte déposé à l'Assemblée nationale le 1ᵉʳ mars et adopté le 30 avril a un délai de 60 jours.

Variables **incluses** :
- **Date de dépôt à l'Assemblée nationale** : la date à laquelle le texte a été officiellement enregistré à l'Assemblée. Quand un texte fait plusieurs passages, c'est la première date de dépôt qui est retenue.
- **Date d'adoption à l'Assemblée nationale** : la date à laquelle l'Assemblée a pris une décision favorable sur le texte (adoption, adoption avec modifications, adoption définitive). La première décision favorable est retenue.

Variables **exclues et pourquoi** :
- Les dossiers sans décision d'adoption à l'Assemblée nationale sont exclus (textes déposés mais pas encore votés, ou rejetés).
- En cas de lectures multiples (navette parlementaire), seuls le premier dépôt et la première adoption sont retenus, pour mesurer le cycle complet de la première navette.

**D'où viennent les données**
Les données proviennent de l'open data de l'Assemblée nationale, mises à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Ce délai couvre l'ensemble du parcours à l'Assemblée nationale (travaux de commission inclus), mais ne reflète pas la profondeur du débat ni le nombre d'amendements examinés.

⚠ Un délai très court peut indiquer une procédure d'urgence ou un vote sans débat approfondi, pas nécessairement un examen plus efficace.

**Comment interpréter**
Un délai inférieur à 30 jours reflète souvent une procédure d'urgence. Entre 1 et 3 mois, la procédure est rapide mais normale. Plus de 6 mois indique généralement un texte complexe ou controversé.

---

## Délai moyen au Sénat

**Ce que ça mesure**
Le temps écoulé, en jours, entre le dépôt d'un texte au Sénat et la décision d'adoption par cette chambre. Même logique que le délai à l'Assemblée nationale, mais pour la chambre haute.

**Comment c'est calculé**
> Délai Sénat d'un texte = Date de la décision d'adoption au Sénat − Date du dépôt au Sénat (en jours)
> Délai moyen = Somme de tous les délais ÷ Nombre de textes adoptés au Sénat

Exemple chiffré : un texte déposé au Sénat le 15 janvier et adopté le 15 avril a un délai de 90 jours.

Variables **incluses** :
- **Date de dépôt au Sénat** : la date à laquelle le texte a été officiellement enregistré au Sénat. Quand un texte fait plusieurs passages, c'est la première date de dépôt qui est retenue.
- **Date d'adoption au Sénat** : la date à laquelle le Sénat a pris une décision favorable sur le texte. La première décision favorable est retenue.

Variables **exclues et pourquoi** :
- Les dossiers sans décision d'adoption au Sénat sont exclus.
- ⚠ **Exception** : le dossier « Droit de vote des étrangers » est exclu du calcul. Ce texte a été déposé en 2000 et est resté bloqué au Sénat pendant 11 ans pour des raisons politiques. Son délai de plus de 4 000 jours constitue une valeur aberrante unique qui fausserait très fortement la moyenne.

**D'où viennent les données**
Les données proviennent de l'open data de l'Assemblée nationale, mises à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Ce délai couvre l'ensemble du parcours au Sénat (travaux de commission inclus), mais ne reflète pas la profondeur du débat ni le nombre d'amendements examinés.

**Comment interpréter**
Les délais au Sénat tendent à être légèrement plus longs qu'à l'Assemblée nationale, en raison du rythme de travail propre à la chambre haute et de ses périodes de session. Un délai sénatorial de 2 à 4 mois est courant pour un texte ordinaire.

---

## Succès législatif par groupe politique

**Ce que ça mesure**
Pour chaque groupe politique ayant initié au moins 10 dossiers, cet indicateur compare trois taux : leur taux d'adoption à l'Assemblée nationale, au Sénat, et leur taux de promulgation. C'est une mesure de l'efficacité législative relative des groupes politiques.

**Comment c'est calculé**
Trois taux sont calculés pour chaque groupe :

> Taux d'adoption à l'Assemblée nationale = (Textes du groupe adoptés à l'Assemblée nationale ÷ Total des textes pertinents du groupe pour l'Assemblée nationale) × 100

> Taux d'adoption au Sénat = (Textes du groupe adoptés au Sénat ÷ Total des textes pertinents du groupe pour le Sénat) × 100

> Taux de promulgation = (Textes du groupe promulgués ÷ Total des textes à vocation législative du groupe) × 100

Exemple chiffré : si un groupe a déposé 50 textes pertinents pour l'Assemblée nationale et que 15 ont été adoptés, son taux d'adoption est de 30 %.

Variables **incluses** :
- **Textes initiés par un groupe** : dossiers dont le groupe politique à l'origine du dépôt correspond au groupe analysé.
- **Total pertinent pour l'Assemblée nationale** : tous les textes du groupe, sauf ceux qui ne font pas l'objet d'un vote à l'Assemblée nationale (pétitions, allocutions, commissions d'enquête, missions d'information, rapports d'information).
- **Total pertinent pour le Sénat** : même logique, avec en plus l'exclusion des résolutions et des engagements de responsabilité gouvernementale, qui ne passent pas au Sénat.
- **Total à vocation législative** : textes dont la procédure est conçue pour aboutir à une loi (même liste que pour le taux de promulgation global).

Variables **exclues et pourquoi** :
- Les groupes ayant initié **moins de 10 dossiers** sont exclus. Avec si peu de textes, les pourcentages ne sont pas significatifs — un seul texte adopté ou rejeté ferait varier le taux de 10 à 100 %, ce qui serait trompeur.

**Agrégation des gouvernements**
Tous les gouvernements de la législature (actuel et anciens) sont fusionnés en une seule ligne "Gouvernement". Les anciens gouvernements restent présents dans les données car certains dossiers qu'ils ont déposés sont toujours actifs — des textes redéposés ou des procédures multi-législatures encore en cours. Cette agrégation évite d'afficher plusieurs lignes "Gouvernement" aux statistiques fragmentées et donne une vue d'ensemble plus lisible de l'action gouvernementale.

**D'où viennent les données**
Les données proviennent de l'open data de l'Assemblée nationale, mises à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Ce tableau compare des groupes qui n'évoluent pas dans les mêmes conditions. Un groupe de la majorité voit naturellement plus de ses textes adoptés qu'un groupe d'opposition, car c'est la majorité qui vote la loi. Un faible taux d'adoption pour l'opposition ne signifie pas que ce groupe travaille moins bien — cela reflète une réalité arithmétique du jeu démocratique.

⚠ Le taux de promulgation n'est pas directement comparable entre la majorité et l'opposition. Il doit être interprété en tenant compte de la position de chaque groupe au sein ou en dehors de la coalition gouvernementale.

**Comment interpréter**
Pour les groupes de la majorité gouvernementale, un taux de promulgation supérieur à 40 % est élevé. Pour un groupe d'opposition, tout texte adopté et promulgué est notable et mérite attention. Le tableau est cliquable : trier par "% Promulgation" permet de comparer l'efficacité finale de chaque groupe ; trier par "% Adoption Assemblée nationale" ou "% Adoption Sénat" donne un aperçu de leur influence chambre par chambre.

---

## Parité femmes

**Ce que ça mesure**
Le pourcentage de femmes parmi les membres en exercice d'une institution (Assemblée nationale, Sénat ou Gouvernement). C'est un indicateur de représentativité de genre.

**Comment c'est calculé**
> Parité femmes = (Nombre de femmes ÷ Nombre total de membres en exercice) × 100

Exemple chiffré : si une institution compte 577 membres dont 215 femmes, la parité est de 37 %.

Variables **incluses** :
- **Nombre de femmes** : membres dont la civilité est « Mme ».
- **Nombre total de membres** : tous les membres actuellement en exercice dans l'institution concernée.

Variables **exclues et pourquoi** :
- Les anciens membres (qui ne sont plus en exercice) ne sont pas comptés. L'indicateur reflète la composition actuelle, pas l'historique.

**D'où viennent les données**
Les données proviennent de l'open data de l'Assemblée nationale, mises à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Ce pourcentage ne dit rien sur la répartition des responsabilités. Une institution peut afficher une parité de 40 % tout en ayant très peu de femmes à la tête de commissions ou dans des postes clés.

⚠ Il s'agit d'un instantané : la composition peut évoluer en cours de législature (démissions, remplacements, remaniements).

**Comment interpréter**
La loi impose depuis 2017 la parité stricte pour les élections législatives (autant de candidates que de candidats). Malgré cela, la parité à l'Assemblée nationale reste en dessous de 50 % en raison des résultats du scrutin. Au Sénat, le mode de scrutin mixte produit également des écarts. Pour le Gouvernement, la parité dépend des choix du Président.

---

## Taux de participation aux votes

**Ce que ça mesure**
Le taux moyen de participation des membres d'une institution (ou d'un groupe politique) aux scrutins publics. Deux variantes sont affichées :
- **Tous votes** : l'ensemble des scrutins publics en séance.
- **Votes importants** : uniquement les scrutins publics solennels (vote final sur l'ensemble d'un texte) et les motions de censure — les plus importants politiquement.

La page Composition affiche également les **records individuels** : le député ayant le taux de participation le plus élevé et le plus bas de toute l'Assemblée, pour chacune des deux variantes.

**Comment c'est calculé**
Pour chaque scrutin public, LoiClair classe chaque parlementaire dans l'une de ces catégories :
- **Votant** : le membre a exprimé un vote (pour, contre, ou abstention).
- **Non-participant** : le membre n'a pas voté alors qu'il était en mesure de le faire. Cela regroupe les absents de l'hémicycle (non enregistrés dans les données du scrutin) et les « non-votants volontaires » (enregistrés mais ayant choisi de ne pas voter).

**Exclusion des non-votants institutionnels** : certains députés sont enregistrés comme « non-votants » dans un scrutin non pas par choix, mais en raison de leur fonction :
- **PAN** (Président de l'Assemblée nationale) : ne vote pas pour garantir son impartialité.
- **PSE** (Président de séance) : assure la présidence du débat et ne prend pas part au vote.
- **MG** (Membre du Gouvernement) : les ministres ne votent pas à l'Assemblée.

Ces trois cas sont **exclus du calcul** de participation : le scrutin concerné n'est compté ni au numérateur ni au dénominateur. Cela évite de pénaliser un député qui préside une séance ou qui est au Gouvernement.

Le taux tient compte de la **période réelle d'exercice du mandat** :

> Participation individuelle = Votes exprimés pendant le mandat ÷ Scrutins tenus pendant le mandat

Cela signifie :
- Si un député arrive en cours de législature (élection partielle, remplacement d'un député nommé au Gouvernement, etc.), seuls les scrutins depuis sa **date de prise de fonction effective** sont comptabilisés — c'est-à-dire le jour où il commence réellement à siéger, et non la date légale de début de mandat (qui peut être antérieure de plusieurs semaines).
- Si un député quitte son siège (pour devenir ministre par exemple) puis revient, ses deux périodes de mandat sont additionnées séparément. La période passée au Gouvernement — pendant laquelle les ministres ne votent pas à l'Assemblée — est exclue des deux côtés du calcul (ni dans les votes, ni dans les scrutins comptabilisés). Exemple : un député ayant siégé de juillet 2024 à janvier 2025, puis à nouveau depuis janvier 2026, voit ses votes et scrutins des deux fenêtres additionnés — la période au Gouvernement entre les deux n'entre pas dans le calcul.
- Si un député quitte définitivement son siège en cours de législature, seuls les scrutins de sa période d'exercice sont retenus.

Le taux moyen d'un groupe est la moyenne de ces taux individuels corrigés :

> Participation du groupe = Somme des taux individuels ÷ Nombre de membres ayant des données

Exemple chiffré : si 3 députés ont des taux de 85 %, 60 % et 92 %, la participation du groupe est de (85 + 60 + 92) ÷ 3 = 79 %.

Dans le tableau détaillé des députés, le taux est accompagné d'un détail « X / Y » : X votes exprimés sur Y scrutins tenus pendant son mandat.

Variables **incluses** :
- **Votes exprimés** : pour, contre, abstention — tous comptent comme participation.
- **Non-votants volontaires et absents** : additionnés ensemble comme « non-participation ».
- Seuls les scrutins ayant eu lieu pendant la période de mandat effective du député sont pris en compte.
- Les **corrections de vote** (« mises au point ») publiées par l'AN sont intégrées : si un député signale une erreur de vote (mauvais bouton, dysfonctionnement technique), sa position corrigée est utilisée.

Variables **exclues et pourquoi** :
- Les **non-votants institutionnels** (Président de l'AN, président de séance, membre du Gouvernement) sont exclus des deux côtés du calcul — le scrutin ne compte ni pour ni contre eux.
- Les membres avec **trop peu de scrutins** pour afficher un taux fiable : si moins de 100 scrutins ordinaires (ou 10 scrutins importants) ont eu lieu depuis la prise de fonction, le taux n'est pas affiché et un badge « pas assez de scrutins » est montré à la place.
- Le Gouvernement n'a pas de données de participation (les ministres ne votent pas au Parlement).
- Les scrutins antérieurs à l'entrée en mandat ou postérieurs à la fin du mandat sont exclus.

**D'où viennent les données**
Les résultats de chaque scrutin public (qui a voté quoi, qui était non-votant, et pour quelle raison) proviennent de l'open data de l'Assemblée nationale. Les éventuelles corrections de vote (« mises au point ») publiées après le scrutin sont également intégrées. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ La participation à un scrutin ne dit pas si le parlementaire était physiquement présent en séance. Le vote peut être délégué à un collègue (chaque député peut porter une procuration — environ 13 % des votes sont par délégation).

⚠ Un taux de participation faible ne signifie pas que le député ne travaille pas. Le travail parlementaire comprend aussi les commissions, les auditions, les missions, et le travail en circonscription — aucun de ces éléments n'est mesuré ici.

⚠ Les votes importants sont moins fréquents que les votes ordinaires. Un petit nombre de votes importants peut rendre le taux plus volatile.

**Comment interpréter**
Un taux de participation global supérieur à 50 % est dans la moyenne. Au-dessus de 70 %, la participation est élevée. Pour les votes importants, les taux sont généralement plus élevés car ces scrutins mobilisent davantage (entre 60 % et 90 % selon les groupes).

---

## Participation moyenne aux scrutins

**Ce que ça mesure**
Combien de députés participent en moyenne à un vote à l'Assemblée nationale ? Ces indicateurs répondent à cette question pour deux types de scrutins :
- **Scrutins ordinaires** : les votes du quotidien parlementaire (amendements, articles, procédures).
- **Scrutins importants** : les votes sur l'ensemble d'un texte de loi et les motions de censure — les plus importants politiquement.

Pour chaque type, deux chiffres sont affichés : le nombre moyen de **votants** (ceux qui ont exprimé un vote) et le nombre moyen de **non-participants** (tous ceux qui n'ont pas voté, quelle qu'en soit la raison).

**Comment c'est calculé**
Pour chaque scrutin, le nombre de votants et de non-votants institutionnels est relevé dans les résultats officiels. On en tire une moyenne sur l'ensemble des scrutins du type :

> Votants moyens = Total des votants sur tous les scrutins du type ÷ Nombre de scrutins

> Éligibles = 577 − Non-votants institutionnels moyens (PAN, PSE, MG)

> Absents moyens = Éligibles − Votants moyens

577 correspond au nombre total de sièges à l'Assemblée nationale. Les **non-votants institutionnels** (Président de l'AN, président de séance, membres du Gouvernement) sont retirés de la base car ils ne peuvent pas voter de par leur fonction. Seuls les députés qui auraient pu voter sont pris en compte comme base de calcul (« éligibles »).

Les « absents » regroupent deux situations distinctes :
- **Non-votants volontaires** (« Position personnelle ») : députés enregistrés dans le scrutin mais ayant choisi de ne pas voter — un cas très rare en pratique.
- **Non-mentionnés** : députés absents de l'hémicycle, qui n'apparaissent pas du tout dans les données du scrutin.

Les pourcentages affichés sont calculés par rapport à la base d'éligibles, pas par rapport aux 577 sièges.

Exemple chiffré : sur un scrutin ordinaire avec 160 votants et 3 non-votants institutionnels, les éligibles sont 577 − 3 = 574, et les absents sont 574 − 160 = 414, soit 72 % des éligibles.

Variables **incluses** :
- Tous les scrutins publics depuis le début de la législature en cours.
- Pour les importants : votes finaux sur l'ensemble d'un texte et motions de censure.

Variables **exclues** :
- Les scrutins pour lesquels le nombre de votants n'est pas renseigné dans les données sources.

**D'où viennent les données**
Les résultats détaillés de chaque scrutin (nombre de votants, de non-votants) proviennent de l'open data de l'Assemblée nationale. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ La moyenne lisse les variations entre scrutins : un vote très mobilisateur peut rassembler 500 députés, un autre seulement 80. La moyenne ne reflète pas ces extrêmes.

⚠ Un « non-participant » n'est pas forcément absent de Paris : il peut être présent en séance mais avoir choisi de ne pas voter, ou avoir délégué sa voix par procuration à un collègue.

**Comment interpréter**
Les scrutins ordinaires mobilisent en moyenne environ 160 à 200 députés sur 577 — environ un tiers de l'hémicycle. Les scrutins importants rassemblent davantage : généralement entre 350 et 450 députés (60 à 80 % de l'hémicycle). Un vote important avec moins de 300 participants serait inhabituellement faible.

---

## Taux de cohésion

**Ce que ça mesure**
Le degré d'alignement des votes au sein d'un groupe politique. Un groupe dont tous les membres votent systématiquement dans le même sens a une cohésion de 100 %. Un groupe divisé à parts égales entre pour et contre a une cohésion proche de 50 %.

Deux niveaux sont affichés sur LoiClair :
- **Cohésion du groupe** (tableau des groupes politiques) : à quelle fréquence les membres du groupe votent ensemble.
- **Cohésion individuelle** (tableau des membres) : à quelle fréquence un parlementaire vote dans le même sens que la position majoritaire de son groupe.

La page Composition affiche également les **records individuels de cohésion** : le parlementaire avec la cohésion individuelle la plus haute et la plus basse de l'institution.

**Comment c'est calculé**
L'Assemblée nationale publie, pour chaque scrutin, la position majoritaire de chaque groupe (pour, contre, abstention). LoiClair utilise cette information pour calculer la cohésion.

**Cohésion du groupe** : pour chaque scrutin, LoiClair compte combien de membres du groupe ont voté dans le même sens que la position majoritaire du groupe, puis divise par le nombre total de votants du groupe.

> Cohésion d'un scrutin = Nombre de membres alignés sur la position majoritaire ÷ Nombre de votants du groupe

> Cohésion interne du groupe = Moyenne de la cohésion sur l'ensemble des scrutins

Exemple chiffré : lors d'un vote, si un groupe de 50 membres compte 45 « pour » et 5 « contre », et que la position majoritaire est « pour », la cohésion de ce scrutin est de 90 % (45 ÷ 50). La cohésion affichée est la moyenne de ce résultat sur tous les scrutins de la législature.

**Cohésion individuelle** : pour chaque parlementaire, LoiClair regarde sur l'ensemble des scrutins à quelle fréquence ce membre a voté dans le même sens que la position majoritaire de son groupe.

> Cohésion individuelle = Nombre de votes alignés sur la position du groupe ÷ Nombre total de votes du parlementaire

Exemple chiffré : si un député a participé à 200 scrutins et a voté avec la position de son groupe 170 fois, sa cohésion individuelle est de 85 %.

Variables **incluses** :
- **Position majoritaire du groupe** : publiée par l'Assemblée nationale pour chaque scrutin (pour, contre, abstention).
- **Vote individuel de chaque membre** : comparé à cette position majoritaire.

Variables **exclues et pourquoi** :
- Les scrutins auxquels un membre était absent ne sont pas comptés dans le calcul de sa cohésion individuelle.
- Le Gouvernement n'a pas de données de cohésion (les ministres ne votent pas au Parlement).

**D'où viennent les données**
Les positions majoritaires des groupes et les votes individuels proviennent de l'open data de l'Assemblée nationale. LoiClair effectue le calcul de cohésion à partir de ces données brutes. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Une cohésion élevée ne signifie pas que le groupe est d'accord sur le fond. Elle peut résulter d'une discipline de vote stricte (consignes de vote du groupe) plutôt que d'une convergence d'opinions.

⚠ La cohésion ne distingue pas les votes importants des votes techniques. Un groupe peut être très uni sur les textes techniques et divisé sur les sujets de société, sans que la moyenne ne le reflète.

⚠ Un parlementaire avec une cohésion individuelle faible n'est pas nécessairement un « dissident » — il peut s'agir d'un membre libre de vote sur des sujets de conscience, ou d'un membre qui s'abstient fréquemment alors que son groupe vote pour ou contre.

**Comment interpréter**
La plupart des groupes politiques affichent une cohésion supérieure à 80 %, ce qui est normal dans le système parlementaire français où la discipline de groupe est forte. En dessous de 70 %, le groupe connaît des divisions significatives. Une cohésion de 95 % ou plus indique un groupe très discipliné ou un petit groupe où les divergences sont rares.

Pour un parlementaire individuel, une cohésion au-dessus de 90 % est très alignée sur son groupe. Entre 70 % et 90 %, il y a des divergences occasionnelles. En dessous de 70 %, le membre vote régulièrement différemment de son groupe.

---

## Types de scrutins

**Ce que ça mesure**
L'Assemblée nationale utilise six modes de scrutin public, chacun avec ses propres règles de majorité. LoiClair les regroupe en deux catégories pour ses indicateurs de participation.

**Les six types de scrutins**

| Code | Nom complet | Voix nécessaires pour l'adoption | Catégorie LoiClair |
|------|------------|----------------------------------|--------------------|
| SPO | Scrutin public ordinaire | Majorité simple : 50 % + 1 des suffrages exprimés (les abstentions ne comptent pas) | Ordinaire |
| SPS | Scrutin public solennel | Majorité simple : 50 % + 1 des suffrages exprimés | Important |
| MOC | Motion de censure | Majorité absolue : 289 voix « pour » sur 577, quel que soit le nombre de votants | Important |
| SNOM | Scrutin nominatif | Majorité simple : 50 % + 1 des suffrages exprimés | Ordinaire |
| SAT | Scrutin à la tribune | Majorité simple : 50 % + 1 des suffrages exprimés | Ordinaire |
| SCG | Scrutin du Congrès | Majorité qualifiée : 3/5 des suffrages exprimés (utilisée pour les révisions constitutionnelles) | Ordinaire |

**Impact sur les indicateurs LoiClair**
- Les indicateurs « tous votes » prennent en compte les 6 types.
- Les indicateurs « votes importants » ne retiennent que les **SPS** (vote final sur l'ensemble d'un texte) et **MOC** (motion de censure) — les votes les plus politiquement significatifs.

**Ce que ça ne mesure pas**
⚠ Les votes à mains levées et les votes à bulletins secrets existent dans le règlement de l'Assemblée mais ne sont pas fournis par le système de vote électronique. Seuls les scrutins publics (avec enregistrement individuel des votes) sont disponibles.

---

## Classification thématique

**Ce que ça mesure**
Chaque dossier législatif est classé dans un ou plusieurs thèmes (santé, éducation, transports, etc.) pour permettre de filtrer les textes par sujet sur la page « Tous les textes ». Un même dossier peut appartenir à plusieurs thèmes : par exemple, un texte sur la pollution des transports sera classé à la fois dans « Environnement » et « Transports ».

**Comment c'est calculé**
Le thème est attribué automatiquement à partir du **titre** du dossier, par détection de mots-clés caractéristiques de chaque sujet.

Pour chaque thème, une liste de termes typiques a été définie. Par exemple :
- **Transports** : transport, ferroviaire, autoroute, aérien, SNCF, RATP, véhicule, mobilité…
- **Éducation** : enseignement, scolaire, école, université, étudiant, lycée, apprentissage…
- **Questions sociales et santé** : santé, hôpital, maladie, handicap, vaccin, sécurité sociale…

Quand le titre d'un dossier contient au moins un des termes associés à un thème, ce thème lui est attribué. Si le titre contient des termes de plusieurs thèmes, le dossier reçoit tous les thèmes correspondants.

Les 27 thèmes disponibles sont :
Affaires étrangères et coopération, Agriculture et pêche, Anciens combattants, Budget, Collectivités territoriales, Culture, Défense, Économie et finances (fiscalité), Éducation, Énergie, Entreprises, Environnement, Famille, Fonction publique, Justice, Logement et urbanisme, Outre-mer, Police et sécurité, Pouvoirs publics et Constitution, Questions sociales et santé, Recherche (sciences et techniques), Sécurité sociale, Sports, Traités et conventions, Transports, Travail, Union européenne.

Exemple concret : le dossier « Projet de loi relatif à l'accélération de la production d'énergies renouvelables » sera classé dans le thème **Énergie** grâce au mot « énergies ».

**D'où viennent les données**
Les titres des dossiers proviennent de l'open data de l'Assemblée nationale. Les listes de mots-clés ont été construites et validées manuellement en les comparant aux thèmes officiels du Sénat sur un échantillon de plus de 8 000 dossiers.

**Ce que ça ne mesure pas**
⚠ Certains dossiers au titre très court ou très administratif (par exemple « Prorogation de l'état d'urgence ») peuvent ne recevoir aucun thème. Environ 15 % des dossiers restent sans thème attribué.

⚠ La classification se base uniquement sur le titre, pas sur le contenu complet du texte. Un dossier dont le titre ne mentionne pas explicitement le sujet peut être mal classé ou non classé.

⚠ Certains thèmes se recoupent partiellement. Par exemple, un texte sur la « sécurité sociale » peut apparaître à la fois dans « Sécurité sociale » et « Questions sociales et santé ». C'est un comportement attendu, pas une erreur.

**Comment interpréter**
Le filtre par thème est utile pour explorer l'activité législative par domaine. Il se combine avec les autres filtres (statut, type de procédure, groupe politique, recherche) : chaque filtre restreint indépendamment la liste des résultats. Par exemple, filtrer par thème « Éducation » et statut « Promulgué » affichera uniquement les textes sur l'éducation qui ont été promulgués.
