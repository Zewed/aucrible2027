---
id: 022
title: Chaque candidat révélé affiche la source de sa position
milestone: null
depends_on: ["019"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois la source de la position de chaque candidat.

## Ce qu'il voit
Sur maquettes/revelation.html, sous chaque nom, une ligne de source datée en petit : « Interview franceinfo, 21/09/2026 », « Programme 2022, p. 6 », « Vote du groupe à l'Assemblée, 2023 ».

## C'est fini quand
- [ ] Sur la révélation de la question n° 24, Fabien Roussel est suivi de « Interview franceinfo, 21/09/2026 », Nathalie Arthaud de « Programme 2022, p. 6 », Marine Le Pen de « Vote du groupe à l'Assemblée, 2023 » et Bruno Retailleau de « Discours de rentrée, 12/09/2026 ».
- [ ] Les 11 candidats rangés sous une option ont tous une source ; aucun n'en est dépourvu.

## Les règles
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."
- Section « Une fiche (question du jour) » : "6. **Révélation** : qui défend quelle option (avec sources et badge « position déduite » ou « position officielle »), alignement sur cette question, classement mis à jour."

## Hors ticket
- Le badge « officielle » ou « déduite » : 023. Les candidats sans source : 024.
- À trancher : la source est-elle un lien cliquable ? (SPEC.md dit « lien + date », la maquette ne montre que du texte).
- Refuser une position de candidat sans source à la publication : 197.
