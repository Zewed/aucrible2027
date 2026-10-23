---
id: 071
title: Le classement affiche sa fiabilité
milestone: null
depends_on: ["063"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur lit à quel point son classement est fiable.

## Ce qu'il voit
Sous le titre de « Mes résultats » (maquettes/resultats.html), « Fiabilité : moyenne (23 réponses) » accompagne un indicateur à trois crans dont deux sont allumés.

## C'est fini quand
- [ ] Avec 23 réponses, la page affiche « Fiabilité : moyenne (23 réponses) » avec deux crans allumés sur trois.
- [ ] Le nombre entre parenthèses suit le nombre de réponses données : après la réponse à la question n° 24, il indique 24 réponses.

## Les règles
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)

## Hors ticket
- À trancher : les seuils de réponses qui séparent « faible », « moyenne » et « forte » (trou du découpage).
- À trancher : la maquette resultats-vide.html affiche « Fiabilité : trop tôt (3 réponses) », un niveau que SPEC.md ne prévoit pas ; son sort relève de 073 (non prévu par le découpage).
- L'explication de la fiabilité sur la page Méthode n'a pas de ticket propre : elle suit 143.
