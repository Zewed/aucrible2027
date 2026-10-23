---
id: 004
title: La question affiche son numéro et sa date
milestone: null
depends_on: ["001"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
Je sais quelle est la question du jour et à quelle date elle est parue.

## Ce qu'il voit
Sur maquettes/index.html, à droite du bandeau sous l'en-tête : « Question n° 24 », suivi sur grand écran de « · vendredi 23 octobre ». Sur maquettes/revelation.html, le même bandeau dit « Question n° 24 · 23 octobre ».

## C'est fini quand
- [ ] Le vendredi 23 octobre 2026, sur grand écran, le bandeau affiche « Question n° 24 · vendredi 23 octobre » ; sur téléphone, seulement « Question n° 24 ».
- [ ] Le samedi 24 octobre 2026, la nouvelle question affiche « Question n° 25 ».
- [ ] Après validation, la révélation garde le numéro : « Question n° 24 » (« · 23 octobre » sur grand écran).

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- Le compte à rebours, à gauche du même bandeau : 039.
- Le changement de question d'un jour à l'autre : 037.
- À trancher : la révélation écrit « 23 octobre » sans le jour de la semaine, l'accueil écrit « vendredi 23 octobre » (écart entre les deux maquettes).
