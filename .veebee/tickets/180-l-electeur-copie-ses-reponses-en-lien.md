---
id: 180
title: L'électeur copie ses réponses en lien
milestone: null
depends_on: ["033"]
design: maquettes/appareil.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux emporter mes réponses par un lien que je m'envoie à moi-même.

## Ce qu'il voit
Sous le QR code, après « ou par lien » (maquettes/appareil.html) : une ligne avec le lien « aucrible2027.fr/i#… », le bouton « Copier le lien » et l'avertissement « Le lien contient tes 23 réponses : ne le partage qu'avec toi-même. ».

## C'est fini quand
- [ ] Un clic sur « Copier le lien » puis un collage dans une note donne une adresse qui commence par « aucrible2027.fr/i# ».
- [ ] L'avertissement affiche le vrai nombre de réponses : « Le lien contient tes 23 réponses… » ; après une 24e réponse, il dit 24.

## Les règles
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)
- « Aucun compte. Réponses stockées localement dans le navigateur. » (SPEC.md, section « Données »)

## Hors ticket
- Coller le lien sur le nouvel appareil : 182.
- À trancher : si « Copier le lien » affiche une confirmation (« Copié »). La maquette n'en montre pas.
- À trancher : prendre le domaine aucrible2027.fr (trou du découpage). L'adresse du lien en dépend.
