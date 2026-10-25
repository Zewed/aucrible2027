---
id: 179
title: L'électeur affiche ses réponses en QR code
milestone: null
depends_on: ["033"]
design: maquettes/appareil.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je change de téléphone et je veux emporter mes réponses.

## Ce qu'il voit
La page « Changer d'appareil. » (maquettes/appareil.html), avec « Deux gestes, de l'ancien appareil vers le nouveau : par QR code ou par lien. » Dans la carte 1, « Sur l'appareil qui a tes réponses : Envoyer mes réponses », un grand QR code et « Scanne-le avec ton autre appareil ».

## C'est fini quand
- [ ] Avec 23 réponses données, la page Changer d'appareil affiche, sous « Envoyer mes réponses », un QR code et « Scanne-le avec ton autre appareil ».
- [ ] Viser ce QR code avec l'appareil photo d'un autre téléphone propose d'ouvrir une adresse en aucrible2027.fr.

## Les règles
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)
- « Aucun compte. Réponses stockées localement dans le navigateur. » (SPEC.md, section « Données »)

## Hors ticket
- Le lien à copier : 180. Ce qui arrive quand on scanne : 181. La phrase « pas de serveur » : 185.
- À trancher : ce que la page affiche quand l'appareil n'a aucune réponse. La maquette ne montre que le cas à 23 réponses.
- À trancher : prendre le domaine aucrible2027.fr (trou du découpage). L'adresse du QR code en dépend.
- L'accès à cette page : le lien « Changer d'appareil » du pied de page (188).
