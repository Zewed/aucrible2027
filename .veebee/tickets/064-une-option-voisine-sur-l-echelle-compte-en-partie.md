---
id: "064"
title: Une option voisine sur l'échelle compte en partie
milestone: null
depends_on: ["063"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur dont la réponse est voisine de celle d'un candidat, sur une question à échelle, se rapproche de lui en partie.

## Ce qu'il voit
Pas d'écran propre : l'effet se lit dans le classement de « Mes résultats » (maquettes/resultats.html). La page Méthode donne l'exemple 62 ans contre 64 ans, soit un écart de 1 sur un écart maximum de 3, environ 67 % (maquettes/methode.html).

## C'est fini quand
- [ ] Trois électeurs qui ont donné les mêmes réponses partout, sauf à la question n° 24 où ils répondent C (64 ans), puis B (62 ans), puis A (60 ans) : le % de Gabriel Attal, dont la position est C, est le plus haut avec C, plus bas avec B, et encore plus bas avec A.
- [ ] Dans les mêmes conditions, avec des réponses D (65 ans ou plus), C, B puis A : le % de Bruno Retailleau, dont la position est D, baisse à chaque cran d'écart.

## Les règles
- "**Score par question** : options ordonnées sur une échelle → `1 − écart / écart max` ; options non ordonnées → 1 si identique, 0 sinon. Multiplié par l'importance (×1/×2/×3)." (SPEC.md, section « Méthode de calcul (publiée) »)
- "**Score global** : % du maximum possible." (SPEC.md, section « Méthode de calcul (publiée) »)

## Hors ticket
- Une option hors échelle comme E « À la carte, avec un système à points » : 065.
- Le poids de l'importance : 066. Les positions inconnues : 067.
- L'explication de ce calcul sur la page Méthode : 143.
- Le classement lui-même : 063.
