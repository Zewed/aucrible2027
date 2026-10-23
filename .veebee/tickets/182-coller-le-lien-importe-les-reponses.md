---
id: "182"
title: Coller le lien importe les réponses
milestone: null
depends_on: ["180"]
design: maquettes/appareil.html
tracker: null
---

## Ce que l'utilisateur fait
Sur mon nouveau téléphone, je colle le lien que j'avais copié.

## Ce qu'il voit
Dans la carte 2 (maquettes/appareil.html), après « ou avec un lien » : le champ « Coller un lien » (« Colle ici le lien copié ») et le bouton « Importer ».

## C'est fini quand
- [ ] Sur un appareil sans réponse, coller tel quel le lien copié par « Copier le lien » dans « Coller un lien », puis « Importer », fait apparaître les mêmes 23 réponses dans « Mes résultats ».
- [ ] La question n° 24, répondue E avec l'importance ×2 sur l'ancien appareil, s'ouvre sur sa révélation avec « Ta carte » sur E et ×2 sur le nouveau.

## Les règles
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)
- « Aucun compte. Réponses stockées localement dans le navigateur. » (SPEC.md, section « Données »)

## Hors ticket
- Le lien à copier : 180. L'import par QR code : 181.
- Un appareil qui a déjà des réponses (183) et un code illisible (184).
- À trancher : le texte du message pour un lien collé illisible. La maquette ne montre que le message du QR code.
