---
id: "031"
title: Les cartes se retournent une à une à l'arrivée
milestone: null
depends_on: ["019"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Quand la révélation s'ouvre, je vois les cartes se retourner une à une.

## Ce qu'il voit
Sur maquettes/revelation.html, chaque bloc d'option pivote autour de son bord haut en arrivant, l'un après l'autre, de A jusqu'à « Position inconnue », avec un dixième de seconde d'écart environ.

## C'est fini quand
- [ ] En arrivant sur la révélation, les blocs A, B, C, D, E puis « Position inconnue » se retournent l'un après l'autre dans cet ordre et sont tous posés en moins de deux secondes.
- [ ] Avec « réduire les animations » activé sur l'appareil, les blocs sont posés d'emblée, sans retournement.

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- Les blocs eux-mêmes et leurs candidats : 019.
- Le dé qui roule : 051.
- À trancher : le retournement se joue-t-il aussi quand on rouvre une révélation déjà vue (voir 033) ? SPEC.md ne le dit pas.
