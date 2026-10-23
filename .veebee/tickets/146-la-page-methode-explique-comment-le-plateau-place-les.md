---
id: 146
title: La page Méthode explique comment le plateau place les pions
milestone: null
depends_on: ["143"]
design: maquettes/methode.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je comprends comment le plateau place mon pion et ceux des candidats.

## Ce qu'il voit
La règle n° 5 « Le plateau : deux axes, des notes de −2 à +2 » nomme les axes (Économie : plus de redistribution ↔ plus de marché ; Société : progressiste ↔ conservateur), détaille l'exemple « (−1×3 + 2×1) ÷ (3 + 1) = −0,25 » avec une question sans note ignorée, et montre un mini-plateau où le pion TOI est un peu côté redistribution et progressiste (maquettes/methode.html).

## C'est fini quand
- [ ] La règle n° 5 dit que chaque option reçoit une note de −2 à +2 sur l'un des deux axes, ou aucune note, et nomme les axes « Économie » (plus de redistribution ↔ plus de marché) et « Société » (progressiste ↔ conservateur).
- [ ] L'exemple montre Retraite : 62 ans (−1, ×3), Droits de succession (+2, ×1) et Fin de vie (aucune, ×2), et conclut « −0,25 » : la question sans note est ignorée.
- [ ] La règle dit que les candidats sont placés par la même formule, à partir de leurs positions sourcées, et que les notes sont relues par le même contrôle de neutralité que les questions.

## Les règles
- Section « Méthode de calcul (publiée) » : "**Carte** : chaque option reçoit une note de −2 à +2 sur l'axe économique, l'axe sociétal, ou aucun. Position de l'utilisateur = moyenne pondérée de ses options ; même formule pour les candidats."
- Section « Résultats » : "Économie : plus de redistribution ↔ plus de marché"
- Section « Résultats » : "Société : progressiste ↔ conservateur"
- Section « Production du contenu » : "**Contrôle automatique de neutralité par IA** avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte."

## Hors ticket
- Le plateau lui-même : 075 à 082. Le contrôle de neutralité sur les notes, côté auteur : 208.
- Une option sans note sur un axe qui ne déplace pas le pion : 080.
