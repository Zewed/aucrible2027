---
id: 085
title: Le camembert affiche le nombre de parts gagnées
milestone: null
depends_on: ["084"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur lit combien de parts de son camembert sont gagnées.

## Ce qu'il voit
Au centre du camembert (maquettes/resultats.html), « 5/11 » et « parts ». À 3 réponses (maquettes/resultats-vide.html), il affiche « 0/11 ».

## C'est fini quand
- [ ] Avec 23 réponses, dont 5 thèmes à 3 réponses ou plus, le camembert affiche « 5/11 parts ».
- [ ] Après la réponse à la question n° 24, qui gagne la part Travail & retraites, il affiche « 6/11 parts ».
- [ ] Avec 3 réponses et aucun thème complet, il affiche « 0/11 ».

## Les règles
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)

## Hors ticket
- Le remplissage des parts : 084. Les 11 parts remplies : 090.
- À trancher : la ligne « +1 part : Santé, gagnée hier » sous le camembert n'est portée par aucun ticket (non prévu par le découpage).
- La même progression sur la carte partagée : 092 et 093 (la carte dit « thèmes », « Mes résultats » dit « parts » : à harmoniser).
