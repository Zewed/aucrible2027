---
id: 048
title: « Je ne sais pas » ne casse pas la série
milestone: null
depends_on: ["045", "017"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
Si je réponds « Je ne sais pas », ma série n'est pas cassée.

## Ce qu'il voit
Sur maquettes/index.html, la carte « Je ne sais pas » dit « Tu passes, ta série continue. »

## C'est fini quand
- [ ] Avec « 6 jours d'affilée », répondre « Je ne sais pas » à la question du jour ne remet pas la série à zéro : l'en-tête affiche toujours au moins 6 jours après la validation.
- [ ] Le lendemain, répondre à la question suivante prolonge la série au lieu de la relancer à 1 jour.

## Les règles
- Section « Ludique » : "Série (jours d'affilée)."
- Section « Une fiche (question du jour) » : "5. **Réponse** : une option, ou « je ne sais pas » ; plus l'importance du sujet pour soi (×1 / ×2 / ×3)."

## Hors ticket
- À trancher : « Je ne sais pas » ajoute-t-il un jour (6 puis 7) ou laisse-t-il la série à 6 ? (la maquette et SPEC.md disent « ta série continue » sans trancher).
- Répondre « Je ne sais pas » : 017. Ajouter un jour avec une vraie réponse : 046.
