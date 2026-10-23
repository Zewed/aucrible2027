---
id: "049"
title: Le silence électoral met la série en pause
milestone: null
depends_on: ["045", "042"]
design: maquettes/silence.html
tracker: null
---

## Ce que l'utilisateur fait
Pendant le silence électoral, ma série est mise en pause, pas perdue.

## Ce qu'il voit
Sur maquettes/silence.html, l'en-tête garde « 38 jours d'affilée » et une note sous les boutons dit « Ta série de 38 jours est en pause, elle n'est pas perdue. »

## C'est fini quand
- [ ] Avec 38 jours d'affilée au jeudi 15 avril 2027 (question du jour répondue), l'en-tête du samedi 17 avril affiche toujours « 38 jours d'affilée » et l'accueil dit « Ta série de 38 jours est en pause, elle n'est pas perdue. »
- [ ] À la première question publiée après le silence, répondre fait passer la série à « 39 jours d'affilée », sans retour à 1.

## Les règles
- Section « Règles validées sur les maquettes (23/10/2026) » : "**Silence électoral** : la série de jours d'affilée est mise en pause, pas perdue."
- Section « Boucle principale » : "**Silence électoral (légal) :** rien de nouveau publié (app et réseaux) à partir du vendredi 0h avant chaque tour (16 avril et 30 avril 2027), par prudence car l'outre-mer vote le samedi."

## Hors ticket
- Un jour sans réponse avant le silence remet la série à zéro comme d'habitude : 047.
- Le reste de l'écran de silence : 042, 043, 044.
- À trancher : la note de pause avant le 2nd tour (30 avril – 2 mai) et le jour exact où la série reprend (la maquette ne dessine que le samedi 17 avril).
