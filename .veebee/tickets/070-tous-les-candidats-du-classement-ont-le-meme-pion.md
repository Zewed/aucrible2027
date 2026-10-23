---
id: 070
title: Tous les candidats du classement ont le même pion
milestone: null
depends_on: ["063"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur voit les 13 candidats du classement représentés par un pion identique, sans couleur de parti.

## Ce qu'il voit
Dans maquettes/resultats.html, chaque ligne du classement commence par un pion rond de la même couleur pour tous, qui porte les initiales du candidat (FRu, DL, MT, NDA, RG, MLP, ÉP, FRo, JLM, BR, NA, GA, ÉZ).

## C'est fini quand
- [ ] Les 13 pions du classement ont la même forme, la même taille et la même couleur ; seules les initiales changent, et aucune couleur de parti n'apparaît.
- [ ] Les initiales désignent le bon candidat, y compris quand elles se ressemblent : « FRu » pour François Ruffin, « FRo » pour Fabien Roussel.

## Les règles
- "**Aucun candidat codé par la couleur de son parti** (contrainte de DA)." (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Le pion de la révélation : 026 ; ceux du plateau : 078.
- L'ordre des lignes et le pourcentage : 063. La barre : 069.
