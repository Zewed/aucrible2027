---
id: 163
title: L'électeur envoie un signalement
milestone: null
depends_on: ["160"]
design: maquettes/signaler.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
J'envoie mon signalement.

## Ce qu'il voit
Le bouton « Envoyer » en bas du formulaire (maquettes/signaler.html), sous la promesse « On répond sous 72 h. ».

## C'est fini quand
- [ ] Sur la question n° 24, écrire seulement « Le chiffre de 1,7 cotisant pour 1 retraité me semble daté » dans « Qu'est-ce qui ne va pas ? », lien et e-mail laissés vides, puis cliquer « Envoyer » envoie le signalement.
- [ ] Envoyer ne demande ni compte, ni mot de passe, ni connexion : aucun écran intermédiaire ne s'intercale.

## Les règles
- « Aucun compte. Réponses stockées localement dans le navigateur. » (SPEC.md, section « Données »)

## Hors ticket
- Où arrive le signalement : 164. Le remerciement après l'envoi : 167. Le texte vide : 168. L'échec d'envoi : 169.
- La source jointe (165) et l'e-mail (166).
