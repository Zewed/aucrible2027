---
id: 078
title: Les 13 candidats sont posés en pions identiques
milestone: null
depends_on: ["075"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit les 13 candidats posés sur le plateau, chacun par un pion.

## Ce qu'il voit
Sur le plateau (maquettes/resultats.html), 13 pions ronds identiques, avec les initiales du candidat, sont répartis autour du pion « TOI » : « ÉZ » et « BR » en bas à droite, « JLM » et « MT » en haut à gauche, par exemple. Le titre de la section annonce « 2 axes, 14 pions ».

## C'est fini quand
- [ ] Avec 23 réponses, le plateau montre 13 pions de candidats, un par candidat du lancement, en plus du pion « TOI ».
- [ ] Les 13 pions sont identiques (même forme, même taille, même couleur, aucune couleur de parti) et ne se distinguent que par leurs initiales.

## Les règles
- "**Aucun candidat codé par la couleur de son parti** (contrainte de DA)." (SPEC.md, section « Principes non négociables »)
- "**Carte** : chaque option reçoit une note de −2 à +2 sur l'axe économique, l'axe sociétal, ou aucun. Position de l'utilisateur = moyenne pondérée de ses options ; même formule pour les candidats." (SPEC.md, section « Méthode de calcul (publiée) »)

## Hors ticket
- La légende qui donne le nom de chaque pion : 079. Les pions qui se chevauchent : 082.
- Le pion des lignes du classement : 070. Le pion « toi » : 075.
- Les notes des options relues par le contrôle de neutralité : 208.
- Un nouveau candidat sans aucune source : 141.
