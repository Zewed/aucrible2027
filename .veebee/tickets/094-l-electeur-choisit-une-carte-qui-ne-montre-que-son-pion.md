---
id: 094
title: L'électeur choisit une carte qui ne montre que son pion
milestone: null
depends_on: ["091", "075"]
design: maquettes/carte-story.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur choisit une carte qui ne montre que son pion, sans nom de candidat.

## Ce qu'il voit
Sur maquettes/carte-story.html, « Ce que ma carte montre » propose « Mon candidat le plus proche » (son nom et ton pourcentage), choisi au départ, et « Seulement mon pion » (aucun nom de candidat). La carte « Mon pion sur le plateau » montre le plateau et le pion « TOI » seuls, avec « Et toi, tu te places où ? ».

## C'est fini quand
- [ ] Au départ, la version « avec mon candidat » est marquée « Choisie ». En choisissant « Seulement mon pion », la version « Mon pion sur le plateau » est marquée « Choisie ».
- [ ] La carte « Mon pion sur le plateau » montre le plateau avec le pion « TOI » près du centre, côté redistribution et progressiste, et ni nom de candidat, ni pourcentage, ni pion de candidat.
- [ ] En revenant sur « Mon candidat le plus proche », la version avec « 81 % » et « François Ruffin » redevient la choisie.

## Les règles
- "**Carte partageable** : l'électeur choisit de montrer son candidat le plus proche ou seulement son pion." (SPEC.md, section « Règles validées sur les maquettes (23/10/2026) »)
- "**On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9)." (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Le nom et le pourcentage de la carte « avec mon candidat » : 091. Le plateau et le pion « toi » : 075.
- Envoyer ou enregistrer la carte choisie : 095 et 096.
- L'adresse et l'invitation en bas de la carte : 098.
- À trancher : le choix est-il gardé d'une visite à l'autre ? (pas de maquette, non prévu par le découpage)
