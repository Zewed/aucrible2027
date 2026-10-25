---
id: 185
title: La page dit que les réponses ne passent par aucun serveur
milestone: null
depends_on: ["179"]
design: maquettes/appareil.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je veux être sûr que changer d'appareil n'envoie mes réponses à personne.

## Ce qu'il voit
En haut de la page (maquettes/appareil.html), un bandeau : « Tes réponses ne quittent ton téléphone que si tu le décides. » et « Pas de compte, pas de serveur. »

## C'est fini quand
- [ ] En haut de la page Changer d'appareil, le bandeau dit « Tes réponses ne quittent ton téléphone que si tu le décides. » et « Pas de compte, pas de serveur. ».
- [ ] Faire un transfert complet (afficher le QR code, le scanner, importer) ne demande ni compte, ni e-mail, ni mot de passe.

## Les règles
- « On ne sait pas pour qui tu votes. Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9). » (SPEC.md, section « Principes non négociables »)

## Hors ticket
- La même promesse dans la page À propos : 157.
- Les gestes du transfert : 179 à 184.
- À trancher : la formule « pas de serveur ». Le lien s'ouvre sur aucrible2027.fr, et les réponses voyagent dans le lien lui-même ; la formule exacte reste à confirmer.
