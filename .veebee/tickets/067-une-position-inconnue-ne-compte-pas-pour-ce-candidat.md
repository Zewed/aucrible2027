---
id: 067
title: Une position inconnue ne compte pas pour ce candidat
milestone: null
depends_on: ["063"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur voit que le classement ignore, pour un candidat, les questions où sa position est inconnue.

## Ce qu'il voit
Pas d'écran propre. Sur la révélation de la question n° 24 (maquettes/revelation.html), François Ruffin et David Lisnard sont rangés sous « Position inconnue », avec la mention « exclus du calcul sur ce sujet ».

## C'est fini quand
- [ ] Avec les 23 réponses de la maquette (François Ruffin 81 %, David Lisnard 76 %), répondre E à la question n° 24 laisse ces deux pourcentages à 81 % et 76 %, alors que ceux de Nicolas Dupont-Aignan (position E) et de Jean-Luc Mélenchon (position A) changent.
- [ ] Avec l'importance ×3 plutôt que ×1 à la question n° 24, le % de François Ruffin et celui de David Lisnard restent les mêmes.

## Les règles
- "**Positions inconnues** : exclues du calcul pour ce candidat." (SPEC.md, section « Méthode de calcul (publiée) »)
- "Sans source : position « inconnue », exclue du calcul. On ne devine jamais. On ne sollicite pas les équipes de campagne." (SPEC.md, section « Sources des positions des candidats »)

## Hors ticket
- L'affichage « Position inconnue » sur la révélation : 024 ; sur le face-à-face : 108 ; sur la fiche candidat : 129.
- L'explication sur la page Méthode : 145.
- À trancher : le % d'un candidat dont aucune position n'est connue sur les questions répondues (pas de maquette, non prévu par le découpage ; voir 141).
