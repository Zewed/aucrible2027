---
id: 127
title: Chaque position affiche sa source datée
milestone: null
depends_on: ["126"]
design: maquettes/candidat.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je vois, pour chaque position, d'où elle vient et à quelle date.

## Ce qu'il voit
Sous chaque option, une ligne « Source : » avec l'intitulé et la date, par exemple « Déclaration sur France Inter, 12/09/2026 » ou « Vote du groupe Écologiste et social, 2024 » (maquettes/candidat.html).

## C'est fini quand
- [ ] Sur Q9 « Faut-il rétablir l'impôt sur la fortune ? », la position de Marine Tondelier (C « Oui, sur tout le patrimoine ») affiche « Source : Déclaration sur France Inter, 12/09/2026 ».
- [ ] Sur Q24 (retraite), sa position A « 60 ans » affiche « Source : Vote du groupe Écologiste et social, 2024 ».

## Les règles
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."
- Section « Sources des positions des candidats » : "1. Programme officiel 2027"
- Section « Sources des positions des candidats » : "2. Déclaration publique du candidat (datée, moins de 12 mois)"
- Section « Sources des positions des candidats » : "3. Votes de son groupe à l'Assemblée nationale ou au Parlement européen"
- Section « Sources des positions des candidats » : "4. Programme 2022 du parti"

## Hors ticket
- Le badge « officielle » ou « déduite » placé à côté de la source : 128.
- Une question sans source : 129, qui affiche « pas de source à ce jour ».
- Les sources des autres écrans : 022 (révélation), 100 (face-à-face), 117 (« Moi contre »).
- À trancher : la source est-elle un lien cliquable ? (SPEC.md dit « lien + date », la maquette ne montre que du texte).
