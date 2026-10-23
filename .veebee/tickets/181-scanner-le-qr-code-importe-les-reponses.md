---
id: 181
title: Scanner le QR code importe les réponses
milestone: null
depends_on: ["179"]
design: maquettes/appareil.html
tracker: null
---

## Ce que l'utilisateur fait
Sur mon nouveau téléphone, je scanne le QR code de l'ancien.

## Ce qu'il voit
La carte 2, « Sur le nouvel appareil : Récupérer mes réponses » (maquettes/appareil.html), avec le bouton « Scanner un QR code ». Sur l'ancien appareil, le QR code invite à « Ouvrir l'appareil photo, viser le carré : tes réponses arrivent. »

## C'est fini quand
- [ ] Sur un appareil sans réponse, « Scanner un QR code » ouvre l'appareil photo ; en visant le QR code de l'ancien appareil, « Mes résultats » montre les mêmes 23 réponses et le même classement.
- [ ] En visant le QR code avec l'appareil photo du téléphone, hors de l'app, le lien ouvre l'app et importe aussi les 23 réponses.
- [ ] La question n° 24, répondue E avec l'importance ×2 sur l'ancien appareil, s'ouvre sur sa révélation avec « Ta carte » sur E et ×2 sur le nouveau.

## Les règles
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)
- « Aucun compte. Réponses stockées localement dans le navigateur. » (SPEC.md, section « Données »)

## Hors ticket
- Un appareil qui a déjà des réponses : 183. Un code illisible : 184.
- Coller le lien au lieu de scanner : 182.
- À trancher : le message de confirmation après l'import, et le refus d'accès à l'appareil photo. La maquette ne montre ni l'un ni l'autre.
