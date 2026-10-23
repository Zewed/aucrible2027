---
id: "199"
title: L'auteur est prévenu sous 14 fiches d'avance
milestone: null
depends_on: ["198"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Quand il me reste moins de 14 fiches d'avance, je veux en être prévenu.

## Ce qu'il voit
Pas de maquette pour ce ticket. Un avertissement dit combien de fiches d'avance il reste et combien il en manque pour revenir à 14 ; il disparaît quand le compte y est.

## C'est fini quand
- [ ] Avec 14 fiches d'avance, aucun avertissement.
- [ ] Le lendemain, la fiche suivante paraît et il n'en reste que 13 : un avertissement dit qu'il en reste 13 et qu'il en manque 1 pour revenir à 14.
- [ ] J'ajoute une fiche datée un jour plus loin que la dernière : l'avertissement disparaît.

## Les règles
- Production du contenu : « Toujours 14 fiches d'avance. »
- Boucle principale : « Lancement quand la v1 est prête **et** que 14 fiches d'avance sont écrites. Pas de date fixe. »

## Hors ticket
- Le nombre de fiches d'avance lui-même : ticket 198.
- L'avertissement prévient seulement : rien n'empêche de publier sous 14 fiches.
- À trancher : par quel canal l'auteur est prévenu (SPEC.md dit « Pas de notifications en v1 » sans dire si cela vise aussi l'auteur).
