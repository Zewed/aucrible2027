---
id: "036"
title: En navigation privée, l'app prévient que rien ne sera gardé
milestone: null
depends_on: ["033"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
En navigation privée, je suis prévenu que mes réponses ne seront pas gardées.

## Ce qu'il voit
Pas de maquette pour ce ticket : maquettes/index.html ne dessine aucun avertissement de ce genre. D'après SPEC.md, les réponses sont « stockées localement dans le navigateur » : une fenêtre de navigation privée les efface à sa fermeture, d'où l'avertissement.

## C'est fini quand
- [ ] En ouvrant l'app dans une fenêtre de navigation privée, un message dit que les réponses ne seront pas gardées à la fermeture de la fenêtre.
- [ ] Dans une fenêtre de navigation normale, ce message n'apparaît pas.

## Les règles
- Section « Données » : "Aucun compte. Réponses stockées localement dans le navigateur."
- Section « Principes non négociables » : "**On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9)."

## Hors ticket
- À trancher : où et sous quelle forme le message s'affiche (la maquette ne le dessine pas).
- Garder ses réponses d'un appareil à l'autre : 179 à 184.
- À trancher : un navigateur qui refuse le stockage local hors navigation privée n'est couvert par aucun ticket du découpage.
