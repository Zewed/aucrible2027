---
id: 095
title: « Partager » envoie l'image 9:16 au partage du téléphone
milestone: null
depends_on: ["091"]
design: maquettes/carte-story.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur touche « Partager » et envoie l'image de sa carte au partage de son téléphone.

## Ce qu'il voit
Sous les choix de maquettes/carte-story.html, un bouton principal « Partager », à côté de « Télécharger l'image », et la note « L'image est dessinée sur ton téléphone : rien n'est envoyé. ».

## C'est fini quand
- [ ] Sur un téléphone, toucher « Partager » ouvre le partage du téléphone avec l'image de la carte choisie, au format story 9:16.
- [ ] En mode avion, « Partager » ouvre quand même le partage avec l'image : elle est dessinée sur le téléphone, rien n'est envoyé à l'app.
- [ ] L'image jointe est celle de la version choisie : avec « Seulement mon pion », elle ne contient aucun nom de candidat.

## Les règles
- "**Carte de résultat partageable** (format story 9:16)." (SPEC.md, section « Écrans de la v1 »)
- "**On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9)." (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Enregistrer l'image au lieu de la partager : 096.
- Le choix de la version : 094. L'adresse sur l'image : 098.
- À trancher : ce que fait « Partager » sur un navigateur sans partage système, comme un ordinateur, et si un texte accompagne l'image (pas de maquette, non prévu par le découpage).
