---
id: 110
title: Une carte retournée compte les questions cachées
milestone: null
depends_on: ["109"]
design: maquettes/face-a-face.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je sais combien de questions me sont encore cachées et comment aller y répondre.

## Ce qu'il voit
En fin de liste, une carte « Questions cachées » (point gris) : « 3 questions attendent encore ta réponse », « Leurs positions s'affichent après ta réponse, pour ne pas t'influencer. Tu vois ici les 24 questions déjà ouvertes pour toi. », et un bouton « Rattraper les questions » (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Un électeur à qui il reste 3 questions sans réponse voit, après la dernière carte, « 3 questions attendent encore ta réponse » et « Leurs positions s'affichent après ta réponse, pour ne pas t'influencer ».
- [ ] Après avoir répondu à l'une d'elles, la carte annonce « 2 questions attendent encore ta réponse ».
- [ ] Un électeur qui a répondu à toutes les questions publiées ne voit pas cette carte.

## Les règles
- Section « Règles validées sur les maquettes (23/10/2026) » : "**Face-à-face** : il ne montre que les questions auxquelles l'électeur a déjà répondu, pour ne rien révéler avant sa réponse."

## Hors ticket
- La destination du bouton « Rattraper les questions », la liste de rattrapage : 052 (ce ticket ne vérifie que sa présence).
- Le fait de masquer les questions non répondues : 109. Aucune réponse du tout : 111.
