---
id: 054
title: Les questions qui départagent le plus viennent en premier
milestone: null
depends_on: ["052"]
design: maquettes/rattrapage.html
tracker: null
status: done
abandonne: "2026-10-25 — l'ordre est tiré au hasard (décision de l'auteur)"
---

## Ce que l'utilisateur fait
L'électeur parcourt la liste et trouve en premier les questions qui départagent le plus les candidats.

## Ce qu'il voit
Sur maquettes/rattrapage.html, la phrase d'accueil dit « Les questions qui départagent le plus les candidats d'abord ». Les cartes « À répondre » sont rangées du plus fort au plus faible départage, les cartes « Répondu » venant après.

## C'est fini quand
- [ ] Avec 24 questions publiées dont 14 répondues, les quatre cartes « Départage fort » (n° 9, 17, 24 et 6) sont avant les quatre « Départage moyen » (n° 13, 20, 11 et 3), elles-mêmes avant les deux « Départage faible » (n° 15 et 22).
- [ ] Une question « faible » encore à répondre n'est jamais placée avant une question « fort » ou « moyen » encore à répondre.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)
- "**Rattrapage** : liste des questions publiées, triées par pouvoir de départage." (SPEC.md, section « Écrans de la v1 »)

## Hors ticket
- Le dé et les mots « Départage fort / moyen / faible » sur chaque carte : 055.
- Les cartes « Répondu » rangées après les autres : 056.
- À trancher : comment se mesure le pouvoir de départage d'une question, et dans quel ordre se rangent deux questions du même niveau (sur la maquette, les « fort » sont dans l'ordre n° 9, 17, 24, 6, qui n'est ni celui des numéros ni celui des dates). SPEC.md ne le définit pas (non prévu par le découpage).
