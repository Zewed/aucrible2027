---
id: 034
title: L'importance donnée est retrouvée en revenant
milestone: null
depends_on: ["033", "018"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
En revenant, je retrouve l'importance que j'avais donnée.

## Ce qu'il voit
Sur maquettes/revelation.html, l'encart « Ta réponse » rappelle « Importance ×2 » avec ses pastilles ; ce ticket veille à ce que la valeur affichée en revenant soit celle choisie à la réponse.

## C'est fini quand
- [ ] Après avoir validé E avec l'importance ×3, fermer puis rouvrir l'app : la révélation de la question n° 24 affiche « Importance ×3 » avec trois pastilles pleines.
- [ ] Deux questions répondues avec des importances différentes (la n° 23 en ×1, la n° 24 en ×3) gardent chacune la leur.

## Les règles
- Section « Données » : "Aucun compte. Réponses stockées localement dans le navigateur."

## Hors ticket
- L'affichage de l'importance sur la révélation : 021. Son poids dans le classement : 066.
- À trancher : l'importance par défaut, si l'électeur ne la choisit pas (trou du découpage).
- À trancher : si l'électeur peut changer sa réponse après l'avoir validée (trou du découpage).
