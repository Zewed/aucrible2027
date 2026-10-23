---
id: 162
title: L'électeur choisit le type d'erreur
milestone: null
depends_on: ["160"]
design: maquettes/signaler.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je dis de quel genre d'erreur il s'agit.

## Ce qu'il voit
Dans le formulaire (maquettes/signaler.html), la question « C'est quel genre d'erreur ? » avec quatre choix en pastilles, un seul à la fois : Un chiffre (choisi au départ), La position d'un candidat, Une formulation qui penche, Autre.

## C'est fini quand
- [ ] À l'ouverture du formulaire, les quatre choix « Un chiffre », « La position d'un candidat », « Une formulation qui penche » et « Autre » sont là, et « Un chiffre » est déjà choisi.
- [ ] On ne peut choisir qu'un type à la fois : choisir « La position d'un candidat » décoche « Un chiffre », puis choisir « Autre » décoche « La position d'un candidat ».

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- À trancher : les types du formulaire (Un chiffre, La position d'un candidat, Une formulation qui penche, Autre) ne sont pas ceux du journal (Chiffre, Position de candidat, Formulation, Source) : « Autre » n'a pas de filtre dans le journal, « Source » n'a pas de choix dans le formulaire (voir 177).
- L'envoi du signalement avec son type : 163 et 164.
