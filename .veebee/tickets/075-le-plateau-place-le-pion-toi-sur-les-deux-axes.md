---
id: 075
title: Le plateau place le pion « toi » sur les deux axes
milestone: null
depends_on: ["061"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur voit son pion « toi » posé sur un plateau à deux axes.

## Ce qu'il voit
Dans « Ton plateau » (« 2 axes, 14 pions », maquettes/resultats.html), un carré quadrillé dont les quatre bords sont nommés, avec le pion « TOI », un petit camembert, posé près du centre, un peu à gauche et un peu en haut.

## C'est fini quand
- [ ] Avec 23 réponses, « Ton plateau » montre un pion « TOI » placé près du centre, légèrement côté redistribution (à gauche) et côté progressiste (en haut).

## Les règles
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)
- "Économie : plus de redistribution ↔ plus de marché" (SPEC.md, section « Résultats »)
- "Société : progressiste ↔ conservateur" (SPEC.md, section « Résultats »)
- "**Carte** : chaque option reçoit une note de −2 à +2 sur l'axe économique, l'axe sociétal, ou aucun. Position de l'utilisateur = moyenne pondérée de ses options ; même formule pour les candidats." (SPEC.md, section « Méthode de calcul (publiée) »)

## Hors ticket
- Les noms des deux axes sur les bords : 077.
- Les 13 pions des candidats : 078 ; la légende : 079 ; les pions qui se chevauchent : 082.
- Une option sans note sur un axe : 080. Avant 10 réponses : 081.
- Le plateau à côté du classement sur ordinateur : 076.
- L'explication du placement sur la page Méthode : 146.
