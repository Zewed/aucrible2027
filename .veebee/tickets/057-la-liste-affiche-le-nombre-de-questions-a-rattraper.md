---
id: "057"
title: La liste affiche le nombre de questions à rattraper
milestone: null
depends_on: ["056"]
design: maquettes/rattrapage.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit combien de questions il lui reste à rattraper.

## Ce qu'il voit
En tête de maquettes/rattrapage.html, une tuile affiche « 10 » et « questions à rattraper », une barre de progression et « 14 répondues sur 24 publiées ».

## C'est fini quand
- [ ] Avec 24 questions publiées dont 14 répondues, la tuile affiche « 10 questions à rattraper » et « 14 répondues sur 24 publiées ».
- [ ] Après avoir répondu à la question n° 24, la tuile affiche « 9 questions à rattraper » et « 15 répondues sur 24 publiées », et la barre avance d'un cran.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)

## Hors ticket
- Les cartes « Répondu » : 056. Le message quand le compteur arrive à zéro : 060.
- La tuile « Ta série » à côté de celle-ci : 045.
- Les maquettes ne s'accordent pas sur le nombre de réponses (14 sur cette page, 23 sur « Mes résultats »). Les critères de ce ticket reprennent les chiffres de cette page ; ceux des tickets de « Mes résultats » reprennent les siens.
