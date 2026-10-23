---
id: 119
title: Une question non répondue est grisée et mène au rattrapage
milestone: null
depends_on: ["113", "052"]
design: maquettes/moi-vs.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois quelles questions je n'ai pas encore répondues et je peux aller y répondre.

## Ce qu'il voit
Une carte grisée par question sans réponse, par exemple « Faut-il rétablir un service national obligatoire ? » : « Tu n'as pas encore répondu », « La position d'Édouard Philippe s'affiche après ta réponse. » et un bouton « Répondre ». L'en-tête de la liste compte « 23 réponses · 4 sans réponse » (maquettes/moi-vs.html).

## C'est fini quand
- [ ] Pour « Faut-il rétablir un service national obligatoire ? », sans réponse, la carte est grisée, dit « Tu n'as pas encore répondu » et ne montre aucune position d'Édouard Philippe.
- [ ] Le bouton « Répondre » de cette carte ouvre la liste de rattrapage.
- [ ] L'en-tête « Question par question » affiche « 23 réponses · 4 sans réponse » pour un électeur qui a répondu à 23 questions et en a 4 sans réponse.

## Les règles
- Section « Règles validées sur les maquettes (23/10/2026) » : "**Face-à-face** : il ne montre que les questions auxquelles l'électeur a déjà répondu, pour ne rien révéler avant sa réponse."
- Section « Boucle principale » : "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses."

## Hors ticket
- La liste de rattrapage elle-même : 052 et suivants.
- La règle validée de SPEC.md vise le face-à-face (109) ; la maquette l'applique aussi ici, sans que le découpage la reprenne ailleurs.
- À trancher : comment une question à laquelle l'électeur a répondu « Je ne sais pas » est classée ici (trou non listé au découpage).
