---
id: "117"
title: Chaque position du candidat affiche sa source
milestone: null
depends_on: ["113"]
design: maquettes/moi-vs.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois d'où vient la position du candidat.

## Ce qu'il voit
Sous la position d'Édouard Philippe, une ligne de source avec une icône, l'intitulé et la date : « Entretien Le Figaro · 5 sept. 2026 » sur la retraite, « Vote du groupe Horizons · 11 juin 2025 » sur le nucléaire (maquettes/moi-vs.html).

## C'est fini quand
- [ ] Pour un électeur qui a répondu aux deux questions, la position de Philippe sur la retraite (« 64 ans ») affiche « Entretien Le Figaro · 5 sept. 2026 » et sa position sur le nucléaire (« Construire les 6 EPR2 prévus ») affiche « Vote du groupe Horizons · 11 juin 2025 ».
- [ ] Toute position de Philippe visible a une source datée : aucune position n'est affichée sans source.

## Les règles
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."

## Hors ticket
- Le badge « officielle » ou « déduite » à côté de la source : 118.
- Du côté de l'électeur, il n'y a pas de source mais la date et l'importance de sa réponse : 113.
- Une position inconnue du candidat : aucun ticket du découpage ne la montre dans « Moi contre ».
- À trancher : la source est-elle un lien cliquable ? (SPEC.md dit « lien + date », la maquette ne montre que du texte).
