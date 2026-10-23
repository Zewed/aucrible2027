---
id: 088
title: La question du jour annonce la part en jeu
milestone: null
depends_on: ["084"]
design: maquettes/index.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur voit, sur la question du jour, la part de camembert qu'il peut gagner en y répondant.

## Ce qu'il voit
Sous la carte question (maquettes/index.html ; le camembert est celui de maquettes/resultats.html), un bloc « En jeu aujourd'hui », « La part Travail & retraites », puis « Tu as 2 réponses sur 3 dans ce thème. Réponds et ton camembert passe à 6 parts sur 11. ». Le bloc est un lien vers « Mes résultats ».

## C'est fini quand
- [ ] Sur la fiche de la question n° 24 (Travail & retraites), avec 2 réponses dans ce thème et 5 parts gagnées, le bloc dit « En jeu aujourd'hui », « La part Travail & retraites » et « Tu as 2 réponses sur 3 dans ce thème. Réponds et ton camembert passe à 6 parts sur 11. »
- [ ] Toucher ce bloc ouvre « Mes résultats ».

## Les règles
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)

## Hors ticket
- L'annonce de la part gagnée une fois la réponse validée : 089.
- Le contenu de la page « Mes résultats » : 061.
- À trancher : ce que dit le bloc quand le thème a déjà ses 3 réponses, quand il n'en a aucune, ou quand la fiche ouverte est une question de rattrapage (059). La maquette ne montre que le cas de la question n° 24 (non prévu par le découpage).
