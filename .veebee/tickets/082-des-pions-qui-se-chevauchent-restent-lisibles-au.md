---
id: "082"
title: Des pions qui se chevauchent restent lisibles au téléphone
milestone: null
depends_on: ["078"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui regarde le plateau sur son téléphone distingue encore deux pions très proches.

## Ce qu'il voit
La maquette (maquettes/resultats.html) ne dessine aucun chevauchement : les 13 pions y sont tous distincts. Ce cas n'est pas dessiné.

## C'est fini quand
- [ ] Sur un téléphone de 375 px de large, quand deux candidats sont presque au même endroit du plateau, on voit qu'il y a deux pions et on peut lire les initiales de chacun, ou les identifier d'un geste.
- [ ] Quand le pion « TOI » tombe sur un pion de candidat, on repère encore les deux.

## Les règles
- "Cible : tout public, tous âges. Pour les jeunes, l'angle est « pas convaincus par la politique classique », pas « peu politisés ». Mobile d'abord." (SPEC.md, section « Projet »)

## Hors ticket
- Les pions du plateau : 078. La légende qui nomme chaque pion : 079.
- À trancher : comment on distingue deux pions superposés (décalage, agrandissement au toucher, autre). La maquette ne donne qu'une infobulle au survol, inutilisable au doigt (non prévu par le découpage).
