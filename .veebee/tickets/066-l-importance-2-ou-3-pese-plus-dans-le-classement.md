---
id: "066"
title: L'importance ×2 ou ×3 pèse plus dans le classement
milestone: null
depends_on: ["063", "018"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur donne plus de poids à un sujet (×2 ou ×3) et le voit peser plus lourd dans son classement.

## Ce qu'il voit
Sous le classement (maquettes/resultats.html), la note « Calculé sur tes 23 réponses, pondérées par l'importance que tu leur donnes. ». L'importance se choisit sur la fiche : ×1 « Un peu », ×2 « Beaucoup », ×3 « Essentiel » (maquettes/index.html).

## C'est fini quand
- [ ] Deux électeurs qui ont donné les mêmes réponses partout, y compris E à la question n° 24, mais avec l'importance ×1 pour l'un et ×3 pour l'autre : le % de Nicolas Dupont-Aignan (position E) est plus haut chez celui qui a mis ×3, et celui de Jean-Luc Mélenchon (position A) est plus bas.
- [ ] Sous le classement, la note dit que les réponses sont « pondérées par l'importance que tu leur donnes ».

## Les règles
- "**Score par question** : options ordonnées sur une échelle → `1 − écart / écart max` ; options non ordonnées → 1 si identique, 0 sinon. Multiplié par l'importance (×1/×2/×3)." (SPEC.md, section « Méthode de calcul (publiée) »)
- "**Réponse** : une option, ou « je ne sais pas » ; plus l'importance du sujet pour soi (×1 / ×2 / ×3)." (SPEC.md, section « Une fiche (question du jour) »)

## Hors ticket
- Le choix de l'importance sur la fiche : 018 ; son rappel sur la révélation : 021.
- L'explication du poids sur la page Méthode : 144.
- À trancher : l'importance par défaut si l'électeur n'en choisit pas (trou du découpage). Le ×1 y est noté en question, alors que la maquette présélectionne ×2.
