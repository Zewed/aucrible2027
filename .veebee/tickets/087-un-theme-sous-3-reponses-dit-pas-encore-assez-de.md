---
id: 087
title: Un thème sous 3 réponses dit « pas encore assez de réponses »
milestone: null
depends_on: ["086"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur voit qu'un thème où il a moins de 3 réponses n'a pas encore de candidat le plus proche.

## Ce qu'il voit
Sur les lignes non gagnées de « Tes 11 thèmes » (maquettes/resultats.html), à la place d'un candidat, « pas encore assez de réponses » : Travail & retraites, Éducation & jeunesse, Logement, Europe & international, Institutions & démocratie et Société.

## C'est fini quand
- [ ] Avec 23 réponses, les 6 thèmes sous 3 réponses (Travail & retraites 2, Éducation & jeunesse 1, Logement 2, Europe & international 1, Institutions & démocratie 0, Société 1) disent « pas encore assez de réponses » et ne nomment aucun candidat.
- [ ] Après la réponse à la question n° 24, la ligne Travail & retraites, qui a alors 3 réponses, nomme un candidat à la place de ce message.

## Les règles
- "**À partir de 3 réponses dans un thème** : détail par thème (« sur l'écologie tu es proche de A, sur l'économie de B »)." (SPEC.md, section « Résultats »)

## Hors ticket
- Les pastilles de chaque thème : 084. Le candidat nommé quand le thème est gagné : 086.
- À trancher : maquettes/resultats-vide.html écrit « pas encore assez de réponses (encore 1) » ou « (encore 2) » pour les thèmes commencés, ce que maquettes/resultats.html ne fait pas pour Travail & retraites (2 réponses). Il faut choisir (non prévu par le découpage).
