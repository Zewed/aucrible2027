---
id: 109
title: Le face-à-face ne montre que les questions déjà répondues
milestone: null
depends_on: ["099", "033"]
design: maquettes/face-a-face.html
tracker: null
---

## Ce que l'utilisateur fait
Je ne vois, dans le face-à-face, que les questions auxquelles j'ai déjà répondu.

## Ce qu'il voit
La liste ne contient que les cartes des questions auxquelles l'électeur a répondu : les autres n'ont pas de carte de positions, et la page précise « Tu vois ici les 24 questions déjà ouvertes pour toi » (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Un électeur qui n'a pas répondu à « Faut-il autoriser une aide active à mourir ? » ne voit aucune position de Glucksmann ni de Retailleau sur ce sujet dans le face-à-face.
- [ ] Après avoir répondu à cette question, elle apparaît dans le face-à-face avec les deux positions.

## Les règles
- Section « Règles validées sur les maquettes (23/10/2026) » : "**Face-à-face** : il ne montre que les questions auxquelles l'électeur a déjà répondu, pour ne rien révéler avant sa réponse."
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."

## Hors ticket
- La carte « Questions cachées » qui compte les questions masquées : 110. Le face-à-face d'un électeur qui n'a encore rien répondu : 111.
- À trancher : une question à laquelle l'électeur a répondu « Je ne sais pas » compte-t-elle comme répondue ici ? SPEC.md ne le dit pas (trou non listé au découpage).
