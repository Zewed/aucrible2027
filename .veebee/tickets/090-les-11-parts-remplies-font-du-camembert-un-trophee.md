---
id: 090
title: Les 11 parts remplies font du camembert un trophée
milestone: null
depends_on: ["084"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui a gagné les 11 parts voit son camembert complet traité comme un trophée.

## Ce qu'il voit
La maquette (maquettes/resultats.html) ne dessine pas l'état 11/11 : elle montre le camembert à 5/11 dans une zone « trophée », avec des confettis colorés au-dessus du titre. Ce qui change à 11/11 n'est pas dessiné.

## C'est fini quand
- [ ] Avec au moins 3 réponses dans chacun des 11 thèmes, le camembert de « Mes résultats » affiche « 11/11 » et ses 11 parts sont toutes remplies.
- [ ] Le passage de 10/11 à 11/11 se voit : la page marque la réussite d'une façon que le camembert à 10/11 n'a pas.

## Les règles
- "Pas de classement entre utilisateurs, pas de badges gadgets." (SPEC.md, section « Ludique »)
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)

## Hors ticket
- Le remplissage d'une part : 084. Le compteur : 085.
- À trancher : ce que montre le trophée (texte, animation, confettis, partage). La maquette affiche déjà des confettis à 5/11, ce n'est donc pas eux qui font le trophée (non prévu par le découpage).
- La carte partageable à 11/11 : 093.
