---
id: "016"
title: « Valider ma réponse » reste inactif sans option choisie
milestone: null
depends_on: ["001"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
Je ne peux pas valider tant que je n'ai pas choisi une option.

## Ce qu'il voit
Sur maquettes/index.html, le bouton « Valider ma réponse » en bas de la fiche, dessiné actif (la carte E est cochée). La maquette ne dessine pas l'état inactif : pas de maquette pour cet état.

## C'est fini quand
- [ ] À l'ouverture de la question n° 24, sans rien choisir, toucher « Valider ma réponse » n'ouvre pas la révélation et n'enregistre rien.
- [ ] Dès qu'une option est choisie, toucher « Valider ma réponse » ouvre la révélation.

## Les règles
- Section « Une fiche (question du jour) » : "5. **Réponse** : une option, ou « je ne sais pas » ; plus l'importance du sujet pour soi (×1 / ×2 / ×3)."

## Hors ticket
- Choisir « Je ne sais pas » comme réponse valable pour activer le bouton : 017.
- L'aspect exact du bouton inactif : la maquette ne le dessine pas.
- À trancher : l'importance par défaut, si l'électeur ne la choisit pas ; si elle est obligatoire, le bouton en dépend aussi (trou du découpage).
