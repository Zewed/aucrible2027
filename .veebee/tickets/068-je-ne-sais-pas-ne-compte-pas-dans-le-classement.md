---
id: 068
title: « Je ne sais pas » ne compte pas dans le classement
milestone: null
depends_on: ["063", "017"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur répond « Je ne sais pas » et voit que son classement ne change pas.

## Ce qu'il voit
Sur la fiche (maquettes/index.html), la carte « Je ne sais pas » dit « Tu passes, ta série continue. ». Le classement de « Mes résultats » (maquettes/resultats.html) n'en tient aucun compte.

## C'est fini quand
- [ ] Avec les 23 réponses de la maquette, répondre « Je ne sais pas » à la question n° 24 laisse les 13 pourcentages du classement inchangés (François Ruffin 81 %, David Lisnard 76 %, Marine Tondelier 71 %, et les dix autres).

## Les règles
- "**Réponse** : une option, ou « je ne sais pas » ; plus l'importance du sujet pour soi (×1 / ×2 / ×3)." (SPEC.md, section « Une fiche (question du jour) »)

## Hors ticket
- Le bouton « Je ne sais pas » sur la fiche : 017. La révélation sans alignement : 030. La série qui continue : 048.
- À trancher : un « Je ne sais pas » compte-t-il dans les « environ 10 réponses » du classement (073), dans les 3 réponses d'un thème (084), dans le nombre de réponses de la carte (092) ? SPEC.md ne le dit pas (non prévu par le découpage).
