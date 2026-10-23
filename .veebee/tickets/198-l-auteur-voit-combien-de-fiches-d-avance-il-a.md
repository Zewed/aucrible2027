---
id: 198
title: L'auteur voit combien de fiches d'avance il a
milestone: null
depends_on: ["195"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Je regarde combien de fiches j'ai d'avance.

## Ce qu'il voit
Pas de maquette pour ce ticket. L'auteur voit un nombre de fiches d'avance : les fiches écrites et datées après aujourd'hui, donc pas encore publiées.

## C'est fini quand
- [ ] Avec la fiche du jour et 14 fiches datées des 14 jours suivants, je vois 14 fiches d'avance.
- [ ] Le lendemain, la fiche suivante devient la question du jour et je vois 13 fiches d'avance.
- [ ] J'ajoute une fiche datée un jour plus loin que la dernière : le nombre monte de 1.

## Les règles
- Production du contenu : « Toujours 14 fiches d'avance. »
- Boucle principale : « Lancement quand la v1 est prête **et** que 14 fiches d'avance sont écrites. Pas de date fixe. »

## Hors ticket
- L'avertissement sous 14 fiches d'avance : ticket 199.
- Écrire les fiches d'avance et les ≈150 sujets est un travail éditorial (trou du découpage), pas un ticket de code.
- Avant le lancement, ce que dit l'accueil : ticket 040.
- À trancher : où l'auteur consulte ce nombre (SPEC.md ne décrit aucun écran d'auteur), et si une fiche compte encore comme « d'avance » quand un jour est sauté entre deux fiches.
