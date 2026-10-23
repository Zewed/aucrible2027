---
id: 177
title: L'électeur filtre le journal par type
milestone: null
depends_on: ["172"]
design: maquettes/journal.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je veux ne voir que les corrections d'un type.

## Ce qu'il voit
Au-dessus de la liste (maquettes/journal.html), cinq boutons de filtre avec leur nombre : Toutes 7, Chiffre 2, Position de candidat 2, Formulation 2, Source 1.

## C'est fini quand
- [ ] Avec les sept corrections de la maquette, « Toutes » est choisi au départ et la liste montre 7 corrections.
- [ ] Choisir « Position de candidat » n'en laisse que 2 (Gabriel Attal et Nathalie Arthaud) ; choisir « Source » n'en laisse qu'une (celle du 09 oct. 2026) ; revenir à « Toutes » les remet à 7.
- [ ] Le nombre écrit à côté de chaque filtre est celui des corrections qu'il affiche.

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- À trancher : le type « Autre » du formulaire de signalement (162) n'a pas de filtre ici, et « Source » n'a pas de choix là-bas.
- À trancher : ce que montre un type sans aucune correction. La maquette ne montre pas ce cas.
- L'état vide du journal entier : 178.
