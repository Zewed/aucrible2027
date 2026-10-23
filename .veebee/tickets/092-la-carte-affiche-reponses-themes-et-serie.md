---
id: "092"
title: La carte affiche réponses, thèmes et série
milestone: null
depends_on: ["091", "084", "045"]
design: maquettes/carte-story.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit sur sa carte combien de réponses, de thèmes et de jours d'affilée il totalise.

## Ce qu'il voit
Au pied de la carte « avec mon candidat » (maquettes/carte-story.html), la ligne « 23 réponses · 5/11 thèmes · 6 jours d'affilée ».

## C'est fini quand
- [ ] Avec 23 réponses, 5 parts gagnées et 6 jours de série, la carte affiche « 23 réponses · 5/11 thèmes · 6 jours d'affilée ».
- [ ] Après la réponse à la question n° 24, la carte affiche « 24 réponses · 6/11 thèmes · 7 jours d'affilée ».

## Les règles
- "Série (jours d'affilée)." (SPEC.md, section « Ludique »)
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)
- "**Carte de résultat partageable** au format story (« Je suis à 74 % proche de X, et toi ? »). C'est le principal moteur de croissance, puisque la pub est impossible." (SPEC.md, section « Ludique »)

## Hors ticket
- La série elle-même : 045 à 051. Les parts gagnées : 084 et 085.
- La carte « seulement mon pion » n'a pas cette ligne : 094. La ligne de la carte verrouillée (« 3 réponses · 0/11 parts · 1 jour d'affilée ») : 097.
- À trancher : ce que la carte dit de la série pendant le silence électoral, où elle est en pause (049), ou sans aucune série (050). Pas de maquette (non prévu par le découpage).
- La carte écrit « thèmes » là où « Mes résultats » écrit « parts » : à harmoniser.
