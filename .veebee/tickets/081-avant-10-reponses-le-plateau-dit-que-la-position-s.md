---
id: "081"
title: Avant 10 réponses, le plateau dit que la position s'affinera
milestone: null
depends_on: ["075"]
design: maquettes/resultats-vide.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui a moins de 10 réponses lit que la position de son pion s'affinera avec ses réponses.

## Ce qu'il voit
Dans « Ton plateau » de maquettes/resultats-vide.html (l'état à 3 réponses ; maquettes/resultats.html ne le montre pas), le pion « TOI » est estompé, entouré d'un halo, avec « Ta position s'affinera avec tes réponses ». La légende dit « Toi, ta position encore floue » et « Les pions des candidats arrivent à 10 réponses ».

## C'est fini quand
- [ ] Avec 3 réponses, le plateau montre un pion « TOI » estompé et le texte « Ta position s'affinera avec tes réponses ».
- [ ] Avec 3 réponses, aucun pion de candidat n'est posé sur le plateau, et la légende dit « Les pions des candidats arrivent à 10 réponses ».

## Les règles
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)

## Hors ticket
- Le plateau complet à partir de 10 réponses : 075 pour le pion « toi », 078 pour les 13 candidats, 079 pour la légende.
- Le classement avant 10 réponses : 073.
- À trancher : le pion estompé est-il calculé sur les 3 réponses, ou posé près du centre quelles que soient les réponses ? La maquette le met à 47 % et 50 % sans le dire (non prévu par le découpage).
