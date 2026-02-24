# Méthodologie des indicateurs

Cette page détaille la façon dont chaque indicateur est calculé, d'où viennent les données et ce qu'ils ne mesurent pas.

---

## Taux de promulgation

**Ce que ça mesure**
Ce taux indique quelle part des textes qui avaient vocation à devenir des lois ont effectivement été promulgués par le Président de la République. C'est un indicateur global de l'efficacité du processus législatif.

**Comment c'est calculé**
> Taux de promulgation = (Nombre de textes promulgués ÷ Nombre de textes à vocation législative) × 100

Exemple chiffré : si 120 textes ont été promulgués sur 400 textes à vocation législative, le taux est de 30 %.

Variables **utilisées** :
- **Textes promulgués** : dossiers dont le statut final contient « promulgu » (ex. : « Promulguée »).
- **Textes à vocation législative** (dénominateur) : dossiers dont le type de procédure appartient à cette liste : projets et propositions de loi ordinaire, loi constitutionnelle, loi organique, loi de finances de l'année, loi de finances rectificative, loi de financement de la sécurité sociale, ratification de traités et conventions.

Variables **non utilisées et pourquoi** :
- Les résolutions, pétitions, missions d'information, commissions d'enquête, rapports d'information, allocutions et engagements de responsabilité gouvernementale sont exclus du dénominateur car ces textes n'ont pas vocation à être promulgués en loi — les compter fausserait le taux vers le bas.

**D'où viennent les données**
Table `dossiers_legislatifs`, alimentée chaque nuit par l'open data de l'Assemblée nationale. La période couverte est l'ensemble de la 17ᵉ législature.

**Ce que ça ne mesure pas**
⚠ Ce taux ne reflète pas la qualité ou l'importance des lois promulguées. Un taux élevé signifie que beaucoup de textes déposés aboutissent, pas que l'activité législative est de qualité.

⚠ Les textes encore en cours d'examen ne sont pas comptabilisés dans le numérateur. Le taux actuel est donc provisoire et augmentera à mesure que les dossiers en cours aboutissent.

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

Variables **utilisées** :
- **Date de dépôt** : champ `date_depot` du dossier législatif.
- **Date de promulgation** : champ `date_promulgation` du dossier.

Variables **non utilisées et pourquoi** :
- Seuls les textes ayant à la fois une date de dépôt et une date de promulgation sont inclus. Les textes en cours, rejetés ou sans date sont exclus car on ne peut pas calculer leur délai complet.

**D'où viennent les données**
Table `dossiers_legislatifs`, open data Assemblée nationale. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ La moyenne est sensible aux cas extrêmes. Un texte déposé et promulgué en 10 jours (urgence nationale) tire la moyenne vers le bas autant qu'un texte bloqué 5 ans la tire vers le haut. Le min et le max affichés permettent de visualiser cette dispersion.

⚠ Cet indicateur ne distingue pas les procédures accélérées des procédures ordinaires. Pour une analyse plus fine, utilisez le filtre par type de procédure.

**Comment interpréter**
Un délai inférieur à 100 jours est typique d'une procédure accélérée (urgence déclarée). Un délai de 300 à 600 jours correspond à une procédure législative ordinaire complète. Au-delà de 600 jours, le texte a généralement fait plusieurs allers-retours entre les deux chambres.

---

## Délai moyen à l'Assemblée nationale

**Ce que ça mesure**
Le temps écoulé, en jours, entre le dépôt d'un texte à l'Assemblée nationale et la décision d'adoption par cette chambre. Cet indicateur isole la vitesse de travail propre à l'Assemblée nationale, indépendamment du Sénat.

**Comment c'est calculé**
> Délai AN d'un texte = Date de la décision d'adoption à l'AN − Date du dépôt à l'AN (en jours)
> Délai moyen AN = Somme de tous les délais AN ÷ Nombre de textes adoptés à l'AN

Exemple chiffré : un texte déposé à l'AN le 1ᵉʳ mars et adopté le 30 avril a un délai AN de 60 jours.

Variables **utilisées** :
- **Date de dépôt à l'AN** : date de l'acte législatif dont le code commence par « AN » et se termine par « DEPOT » — la plus ancienne retenue par dossier.
- **Date d'adoption à l'AN** : date de l'acte dont le code commence par « AN » ou « CMP-DEBATS-AN » et se termine par « DEBATS-DEC », avec un statut indiquant une adoption (contenant « adopt », « modifi » ou « définitiv »).

Variables **non utilisées et pourquoi** :
- Les dossiers sans décision d'adoption enregistrée à l'AN sont exclus (textes déposés mais pas encore votés, ou rejetés).
- En cas de lectures multiples, seule la première date de dépôt et la première date d'adoption sont retenues, pour mesurer le cycle complet de la première navette.

**D'où viennent les données**
Table `actes_legislatifs`, open data Assemblée nationale. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Cet indicateur mesure l'intervalle dépôt → décision en séance publique, pas le travail préparatoire en commission (qui précède souvent le vote). Le délai réel de travail parlementaire est plus long.

⚠ Un délai très court peut indiquer une procédure d'urgence ou un vote sans débat approfondi, pas un examen plus efficace.

**Comment interpréter**
Un délai inférieur à 30 jours à l'AN reflète souvent une procédure d'urgence. Entre 1 et 3 mois, la procédure est rapide mais normale. Plus de 6 mois indique généralement un texte complexe ou controversé.

---

## Délai moyen au Sénat

**Ce que ça mesure**
Le temps écoulé, en jours, entre le dépôt d'un texte au Sénat et la décision d'adoption par cette chambre. Même logique que le délai à l'AN, mais pour la chambre haute.

**Comment c'est calculé**
> Délai SN d'un texte = Date de la décision d'adoption au Sénat − Date du dépôt au Sénat (en jours)
> Délai moyen SN = Somme de tous les délais SN ÷ Nombre de textes adoptés au Sénat

Variables **utilisées** :
- **Date de dépôt au Sénat** : date de l'acte dont le code commence par « SN » et se termine par « DEPOT » — la plus ancienne retenue par dossier.
- **Date d'adoption au Sénat** : date de l'acte dont le code commence par « SN » ou « CMP-DEBATS-SN » et se termine par « DEBATS-DEC », avec un statut d'adoption.

Variables **non utilisées et pourquoi** :
- Les dossiers sans décision d'adoption au Sénat sont exclus.
- ⚠ **Exception documentée** : le dossier « Droit de vote des étrangers » (identifiant interne DLR5L11N19503) est exclu du calcul. Ce texte a été déposé en 2000 et est resté bloqué au Sénat pendant 11 ans pour des raisons politiques. Son délai de plus de 4 000 jours constitue une valeur aberrante unique qui fausserait très fortement la moyenne.

**D'où viennent les données**
Table `actes_legislatifs`, open data Assemblée nationale. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Comme pour l'Assemblée nationale, le délai ne reflète pas la qualité du débat ni le travail réalisé en commission sénatoriale.

**Comment interpréter**
Les délais au Sénat tendent à être légèrement plus longs qu'à l'Assemblée nationale, en raison du rythme de travail propre à la chambre haute et de ses périodes de session. Un délai sénatorial de 2 à 4 mois est courant pour un texte ordinaire.

---

## Succès législatif par groupe politique

**Ce que ça mesure**
Pour chaque groupe politique ayant initié au moins 10 dossiers, cet indicateur compare trois taux : leur taux d'adoption à l'Assemblée nationale, au Sénat, et leur taux de promulgation. C'est une mesure de l'efficacité législative relative des groupes politiques.

**Comment c'est calculé**
Trois taux sont calculés pour chaque groupe :

> Taux d'adoption AN = (Textes du groupe adoptés à l'AN ÷ Total des textes pertinents du groupe pour l'AN) × 100

> Taux d'adoption SN = (Textes du groupe adoptés au SN ÷ Total des textes pertinents du groupe pour le SN) × 100

> Taux de promulgation = (Textes du groupe promulgués ÷ Total des textes à vocation législative du groupe) × 100

Exemple chiffré : si un groupe a déposé 50 textes pertinents pour l'AN et que 15 ont été adoptés, son taux d'adoption AN est de 30 %.

Variables **utilisées** :
- **Textes initiés par un groupe** : dossiers dont `initiateur_groupe_libelle` correspond au groupe.
- **Total pertinent AN** : tous les textes du groupe, sauf ceux exclus des votes AN (pétitions, allocutions, commissions d'enquête, missions d'information, rapports d'information sans mission).
- **Total pertinent SN** : idem, avec en plus l'exclusion des résolutions et des engagements de responsabilité gouvernementale, qui ne passent pas au Sénat.
- **Total à vocation législative** : textes dont la procédure figure dans la liste des procédures promulgables (voir indicateur « Taux de promulgation »).
- **Textes adoptés à l'AN / au SN** : croisement avec la table `actes_legislatifs` pour savoir si chaque dossier a fait l'objet d'une décision d'adoption dans chaque chambre.

Variables **non utilisées et pourquoi** :
- Les groupes ayant initié **moins de 10 dossiers** sont exclus. Avec si peu de textes, les pourcentages ne sont pas statistiquement significatifs — un seul texte adopté ou rejeté ferait varier le taux de 10 à 100 %, ce qui serait trompeur.

**D'où viennent les données**
Croisement de `dossiers_legislatifs` (groupes, procédures, statuts) et `actes_legislatifs` (dates et statuts d'adoption), open data Assemblée nationale. Mise à jour chaque nuit.

**Ce que ça ne mesure pas**
⚠ Ce tableau compare des groupes qui n'évoluent pas dans les mêmes conditions. Un groupe de la majorité voit naturellement plus de ses textes adoptés qu'un groupe d'opposition, car c'est la majorité qui vote la loi. Un faible taux d'adoption pour l'opposition ne signifie pas que ce groupe travaille moins bien — cela reflète une réalité arithmétique du jeu démocratique.

⚠ Le taux de promulgation n'est pas directement comparable entre la majorité et l'opposition. Il doit être interprété en tenant compte de la position de chaque groupe au sein ou en dehors de la coalition gouvernementale.

**Comment interpréter**
Pour les groupes de la majorité gouvernementale, un taux de promulgation supérieur à 40 % est élevé. Pour un groupe d'opposition, tout texte adopté et promulgué est notable et mérite attention. Le classement par nombre total de textes déposés (affiché dans le tableau) donne un contexte utile à la lecture des taux.
