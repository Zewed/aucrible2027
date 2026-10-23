---
id: 176
title: Chaque correction dit qui l'a repérée
milestone: null
depends_on: ["172"]
design: maquettes/journal.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux savoir qui a repéré l'erreur.

## Ce qu'il voit
Dans chaque entrée (maquettes/journal.html), sous « Pourquoi », une ligne « Origine » : « Signalé par un utilisateur » ou « Repéré par le contrôle de neutralité ».

## C'est fini quand
- [ ] La correction du 22 oct. 2026 affiche « Origine : Signalé par un utilisateur » ; celle du 20 oct. 2026 affiche « Origine : Repéré par le contrôle de neutralité ».
- [ ] Pour une correction née d'un signalement laissé avec l'e-mail marie@exemple.fr, le journal affiche seulement « Signalé par un utilisateur » : ni l'e-mail ni aucune autre information sur la personne.

## Les règles
- « Page publique « Journal des corrections » : date, fiche, avant/après, raison. » (SPEC.md, section « Corrections »)
- « « Signaler une erreur » arrive dans une boîte privée (pas publique, pour éviter les raids). » (SPEC.md, section « Corrections »)

## Hors ticket
- Le signalement lui-même et sa boîte privée : 163 et 164.
- À trancher : les corrections que l'auteur repère lui-même (la maquette ne montre que deux origines), et le fait que le contrôle de neutralité est décrit dans SPEC.md « avant publication » alors que le journal en fait l'origine de corrections après publication.
