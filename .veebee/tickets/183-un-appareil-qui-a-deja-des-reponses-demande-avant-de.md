---
id: 183
title: Un appareil qui a déjà des réponses demande avant de les remplacer
milestone: null
depends_on: ["181"]
design: maquettes/appareil.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
J'importe mes réponses sur un appareil qui en a déjà.

## Ce qu'il voit
Un encadré (maquettes/appareil.html, aperçu « si cet appareil a déjà des réponses ») : « Cet appareil a déjà 5 réponses. Les remplacer par les 23 importées ? », un schéma 5 « sur cet appareil » vers 23 « dans le lien », et deux boutons « Remplacer » et « Annuler ».

## C'est fini quand
- [ ] Sur un appareil qui a 5 réponses, scanner le QR code d'un appareil à 23 réponses affiche « Cet appareil a déjà 5 réponses. Les remplacer par les 23 importées ? » avant tout changement ; « Mes résultats » montre alors encore 5 réponses.
- [ ] « Annuler » garde les 5 réponses de l'appareil.
- [ ] « Remplacer » fait passer « Mes résultats » à 23 réponses (et non 28) : les 5 anciennes sont remplacées, pas ajoutées.

## Les règles
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)

## Hors ticket
- À trancher : l'import par lien collé (182) pose-t-il la même question ? La maquette écrit « dans le lien ». SPEC.md ne le dit pas.
- Un code illisible : 184. L'import sur un appareil vide : 181.
