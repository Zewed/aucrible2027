---
id: "062"
title: La révélation mène à « Mes résultats »
milestone: null
depends_on: ["019", "061"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Après avoir validé sa réponse, l'électeur touche « Voir mes résultats » sur la révélation pour voir son classement recalculé.

## Ce qu'il voit
Sur la révélation (maquettes/revelation.html), le bouton principal « Voir mes résultats » est suivi de « Ton classement est recalculé avec cette 24e réponse. ». Il ouvre « Mes résultats » (maquettes/resultats.html).

## C'est fini quand
- [ ] Sur la révélation de la question n° 24, la phrase sous le bouton dit « Ton classement est recalculé avec cette 24e réponse. » et « Voir mes résultats » ouvre « Mes résultats ».
- [ ] Sur « Mes résultats », le classement tient compte de cette réponse : Nicolas Dupont-Aignan, qui défend l'option E choisie, dépasse les 66 % qu'il avait avant.

## Les règles
- "**Révélation** : qui défend quelle option (avec sources et badge « position déduite » ou « position officielle »), alignement sur cette question, classement mis à jour." (SPEC.md, section « Une fiche (question du jour) »)

## Hors ticket
- « Rattraper d'autres questions », l'autre action de la révélation : 053.
- Le calcul du classement et son affichage : 063 à 068.
- Le camembert gagné annoncé sur la révélation : 089.
- Avant 10 réponses, ce bouton ouvre l'état « Encore X réponses » de « Mes résultats » : 073.
