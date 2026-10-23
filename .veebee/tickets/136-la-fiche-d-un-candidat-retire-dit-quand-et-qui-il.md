---
id: 136
title: La fiche d'un candidat retiré dit quand et qui il soutient
milestone: null
depends_on: ["121"]
design: maquettes/candidat.html
tracker: null
---

## Ce que l'utilisateur fait
J'ouvre la fiche d'un candidat retiré et je vois quand il s'est retiré et qui il soutient.

## Ce qu'il voit
Sur la fiche, un encart avec le pion de la candidate et la phrase « Marine Tondelier s'est retirée le 14/12/2026 et soutient Raphaël Glucksmann. », où le nom du soutien est un lien, puis « Sa fiche reste consultable, mais elle sort du classement. » L'étiquette « (si le candidat se retire) » est une annotation de la maquette, pas un texte du produit (maquettes/candidat.html).

## C'est fini quand
- [ ] La fiche d'une candidate retirée affiche « Marine Tondelier s'est retirée le 14/12/2026 et soutient Raphaël Glucksmann. » et « Sa fiche reste consultable, mais elle sort du classement. ».
- [ ] Toucher « Raphaël Glucksmann » dans cette phrase ouvre la fiche de Raphaël Glucksmann.

## Les règles
- Section « Candidats » : "**Retrait** : sortie du classement avec la mention « X s'est retiré·e le JJ/MM et soutient Y »."

## Hors ticket
- La sortie du classement elle-même : 135. Les révélations : 137.
- À trancher : la date s'écrit JJ/MM dans SPEC.md et JJ/MM/AAAA dans la maquette ; la forme pour un candidat masculin (« retiré ») ; un retrait sans soutien nommé (trou non listé au découpage).
