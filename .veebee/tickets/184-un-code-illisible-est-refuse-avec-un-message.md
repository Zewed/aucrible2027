---
id: 184
title: Un code illisible est refusé avec un message
milestone: null
depends_on: ["181"]
design: maquettes/appareil.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je scanne un code qui n'est pas le bon.

## Ce qu'il voit
Un encadré d'erreur (maquettes/appareil.html, aperçu « si le code n'est pas valide ») : « Ce code n'est pas lisible. Réessaie ou colle le lien. »

## C'est fini quand
- [ ] Scanner, avec « Scanner un QR code », le QR code d'un site quelconque affiche « Ce code n'est pas lisible. Réessaie ou colle le lien. » et n'importe rien.
- [ ] Sur un appareil qui a déjà 5 réponses, ce refus ne touche pas à ces 5 réponses et ne pose pas la question « Les remplacer ? ».

## Les règles
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)

## Hors ticket
- À trancher : le message pour un lien collé illisible (182) ; la maquette ne montre que le cas du QR code.
- À trancher : le refus d'accès à l'appareil photo, qui n'est pas un code illisible (voir 181).
- Le remplacement des réponses : 183.
