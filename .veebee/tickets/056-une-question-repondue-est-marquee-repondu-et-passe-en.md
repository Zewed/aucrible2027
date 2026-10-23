---
id: "056"
title: Une question répondue est marquée « Répondu » et passe en fin de liste
milestone: null
depends_on: ["052"]
design: maquettes/rattrapage.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur repère d'un coup d'œil les questions déjà répondues, rangées à la fin de la liste.

## Ce qu'il voit
Sur maquettes/rattrapage.html, une carte à répondre porte « À répondre » avec une flèche. Une carte répondue est grisée, porte « Répondu » avec une coche, et vient après toutes les cartes à répondre (n° 5 « semaine de quatre jours », n° 8 « aide active à mourir »).

## C'est fini quand
- [ ] Les questions n° 5 et n° 8, déjà répondues, sont grisées, marquées « Répondu » et placées après les dix cartes « À répondre ».
- [ ] Après avoir validé une réponse à la question n° 24, la liste la montre « Répondu » et la place après les cartes « À répondre » qui restent.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)
- "**Rattrapage** : liste des questions publiées, triées par pouvoir de départage." (SPEC.md, section « Écrans de la v1 »)

## Hors ticket
- Le nombre de questions à rattraper, qui baisse à chaque réponse : 057.
- Ouvrir une carte « Répondu » : elle rouvre sur sa révélation (033 et 059).
- Quand toutes les cartes sont « Répondu » : 060.
- À trancher : si l'électeur peut changer sa réponse après l'avoir validée, donc si une carte « Répondu » peut redevenir « À répondre » (trou du découpage).
- À trancher : la ligne « 12 autres cartes déjà répondues » dessinée sous les deux cartes répondues n'est portée par aucun ticket (non prévu par le découpage).
