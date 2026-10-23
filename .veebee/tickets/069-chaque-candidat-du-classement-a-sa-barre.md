---
id: 069
title: Chaque candidat du classement a sa barre
milestone: null
depends_on: ["063"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur lit la proximité de chaque candidat sur une barre placée sous son nom.

## Ce qu'il voit
Sous chaque ligne du classement (maquettes/resultats.html), une barre à segments est remplie à hauteur du pourcentage du candidat.

## C'est fini quand
- [ ] La barre sous « François Ruffin 81 % » est remplie aux 81 % de sa longueur et celle sous « Éric Zemmour 22 % » aux 22 %.
- [ ] Les 13 barres vont de la plus remplie à la moins remplie dans l'ordre du classement.

## Les règles
- "**Mes résultats** : classement en %, fiabilité, carte 2 axes, détail par thème." (SPEC.md, section « Écrans de la v1 »)

## Hors ticket
- Le pourcentage écrit et l'ordre des lignes : 063.
- Le pion en début de ligne : 070.
