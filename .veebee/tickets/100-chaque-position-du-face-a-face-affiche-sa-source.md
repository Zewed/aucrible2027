---
id: 100
title: Chaque position du face-à-face affiche sa source
milestone: null
depends_on: ["099"]
design: maquettes/face-a-face.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je lis, sous chaque position, d'où elle vient.

## Ce qu'il voit
Sous l'option de chaque candidat, une ligne de source avec une petite icône, qui donne l'intitulé et la date : « Entretien Libération · 9 sept. 2026 » pour Glucksmann et « Programme LR 2022 · janv. 2022 » pour Retailleau sur la retraite (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Sur la question de la retraite, la position « 62 ans » de Glucksmann affiche « Entretien Libération · 9 sept. 2026 » et celle de Retailleau, « 65 ans ou plus », affiche « Programme LR 2022 · janv. 2022 ».
- [ ] Sur chaque question dont les deux candidats ont une position, les deux positions affichent une source avec une date.

## Les règles
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."

## Hors ticket
- Le badge « officielle » ou « déduite » placé à côté de la source : 101.
- La ligne « Aucune source » d'une position inconnue : 108. L'ordre dans lequel les sources sont choisies, expliqué sur la page Méthode : 147.
- À trancher : la source est-elle un lien cliquable ? (SPEC.md dit « lien + date », la maquette ne montre que du texte).
