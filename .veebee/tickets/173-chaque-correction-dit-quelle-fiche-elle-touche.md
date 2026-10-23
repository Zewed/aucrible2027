---
id: 173
title: Chaque correction dit quelle fiche elle touche
milestone: null
depends_on: ["172"]
design: maquettes/journal.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je veux savoir quelle fiche a été corrigée.

## Ce qu'il voit
Sous la date de chaque entrée (maquettes/journal.html), un type (Position, Formulation, Chiffre, Source) et la fiche touchée : pour une question, « Question n° 3 » et son titre « Que faire du parc nucléaire ? » ; pour un candidat, « Fiche candidat », « Gabriel Attal » et « Question n° 12 · Droits de succession ».

## C'est fini quand
- [ ] La correction du 19 oct. 2026 affiche « Formulation », « Question n° 3 » et le titre « Que faire du parc nucléaire ? ».
- [ ] La correction du 22 oct. 2026 affiche « Position », « Fiche candidat », « Gabriel Attal » et la question concernée « Question n° 12 · Droits de succession ».

## Les règles
- « Page publique « Journal des corrections » : date, fiche, avant/après, raison. » (SPEC.md, section « Corrections »)

## Hors ticket
- Le nom du candidat comme lien vers sa fiche : la fiche est portée par 121, le lien depuis le journal par aucun ticket du découpage.
- Le filtre par type : 177. L'avant et l'après : 174.
