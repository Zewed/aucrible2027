---
id: "140"
title: Un nouveau candidat entre dans le classement
milestone: null
depends_on: ["063"]
design: maquettes/candidat.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois un nouveau candidat entrer dans le classement.

## Ce qu'il voit
La maquette ne montre pas ce cas (maquettes/candidat.html montre une fiche, maquettes/resultats.html un classement de 13). D'après SPEC.md, un candidat qui remplit la règle d'entrée, ou Lassalle s'il se déclare, rejoint la liste et y reste jusqu'à son retrait.

## C'est fini quand
- [ ] Quand Jean Lassalle se déclare, « Mes résultats » classe 14 candidats et Jean Lassalle y figure.
- [ ] Jean Lassalle a une fiche, avec le même pion que les autres candidats (initiales, sans couleur de parti).
- [ ] Il est proposé dans « Choisir un autre candidat » du face-à-face (12 noms) et de « Moi contre » (13 noms).

## Les règles
- Section « Candidats » : "**Règle d'entrée** (au moins un critère) :"
- Section « Candidats » : "le parti du candidat **dirige** un groupe à l'Assemblée nationale ou au Parlement européen ;"
- Section « Candidats » : "moyenne ≥ 2,0 % sur tous les sondages des 30 derniers jours (pour chaque sondage, moyenne des scénarios où le candidat est testé) ;"
- Section « Candidats » : "le parti du candidat a obtenu les 500 parrainages en 2022 (le parti lui-même, pas ses scissions)."
- Section « Candidats » : "Recalcul le 1er de chaque mois. Un candidat entré reste jusqu'à son retrait."
- Section « Candidats » : "Lassalle entre automatiquement s'il se déclare."

## Hors ticket
- Ses positions, toutes inconnues faute de source : 141. La liste officielle : 142.
- À trancher : entrée immédiate à la déclaration (« entre automatiquement ») ou au prochain recalcul du 1er du mois ; SPEC.md dit les deux (trou non listé au découpage).
- À trancher : le pourcentage affiché dans le classement pour un candidat dont toutes les positions sont inconnues, puisque le maximum possible est alors nul (trou non listé).
