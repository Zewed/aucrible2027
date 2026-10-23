---
id: 051
title: Le dé roule quand la série augmente
milestone: null
depends_on: ["046"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Quand ma série augmente, je vois le dé rouler.

## Ce qu'il voit
Sur maquettes/index.html, le dé de l'en-tête tombe d'en haut en tournant sur lui-même pendant environ une seconde à l'ouverture de la page. Le ticket réserve ce mouvement au moment où la série augmente (la maquette le joue à chaque chargement).

## C'est fini quand
- [ ] En validant la réponse du jour avec « 6 jours d'affilée », le dé de l'en-tête roule à l'arrivée sur la révélation puis affiche « 7 jours d'affilée ».
- [ ] En rouvrant la même révélation plus tard, ou en ouvrant une autre page, le dé ne roule pas.
- [ ] Avec « réduire les animations » activé sur l'appareil, le dé ne roule pas mais affiche quand même « 7 jours d'affilée ».

## Les règles
- Section « Ludique » : "Série (jours d'affilée)."

## Hors ticket
- Le fait que la série gagne un jour : 046.
- Le retournement des cartes de la révélation : 031.
