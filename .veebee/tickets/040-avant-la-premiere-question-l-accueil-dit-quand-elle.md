---
id: 040
title: Avant la première question, l'accueil dit quand elle arrive
milestone: null
depends_on: ["037"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
Avant la première question, je vois quand elle arrive.

## Ce qu'il voit
Pas de maquette pour ce ticket. maquettes/index.html donne le cadre (en-tête, bandeau avec compte à rebours, pied de page) mais ne dessine pas l'état « la première question n'est pas encore parue ».

## C'est fini quand
- [ ] Quand la première fiche est datée d'un jour à venir (par exemple le 2 novembre 2026), ouvrir l'app avant cette date affiche à l'accueil un message qui donne la date de la première question et ne montre aucune question.
- [ ] Le jour de la première fiche, la question apparaît à l'accueil à la place du message.

## Les règles
- Section « Boucle principale » : "Lancement quand la v1 est prête **et** que 14 fiches d'avance sont écrites. Pas de date fixe."

## Hors ticket
- À trancher : l'heure à laquelle la question du jour change (trou du découpage).
- À trancher : ce que montre la toute première visite (trou du découpage).
- L'accueil une fois la question parue : 001. Une fiche future qu'on ne peut pas ouvrir : 038.
- À trancher : le texte exact du message (la maquette ne le dessine pas).
