---
id: "061"
title: L'électeur ouvre « Mes résultats »
milestone: null
depends_on: ["033"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur ouvre « Mes résultats » depuis la question du jour.

## Ce qu'il voit
La page « Mes résultats. » (maquettes/resultats.html) s'ouvre avec son titre, un lien « Question du jour » et le compte à rebours en haut. Depuis la fiche (maquettes/index.html), le lien « Mes résultats » en bas de page y mène.

## C'est fini quand
- [ ] Depuis la fiche de la question n° 24, toucher « Mes résultats » ouvre la page « Mes résultats ».
- [ ] Sur cette page, le lien « Question du jour » en haut ramène à la fiche de la question n° 24.

## Les règles
- "**Mes résultats** : classement en %, fiabilité, carte 2 axes, détail par thème." (SPEC.md, section « Écrans de la v1 »)
- "Aucun compte. Réponses stockées localement dans le navigateur." (SPEC.md, section « Données »)

## Hors ticket
- Les autres chemins vers cette page : la révélation (062), le bloc « En jeu aujourd'hui » (088), l'en-tête (186).
- Le classement lui-même et tout ce qui le compose : 063 à 072 ; ce que montre la page avant 10 réponses : 073.
- À trancher : ce que montre « Mes résultats » à la toute première visite, sans aucune réponse (trou du découpage) ; la maquette n'en dessine que le cas à 3 réponses.
- À trancher : ce que devient le compte à rebours après le 1er tour (trou du découpage) ; son affichage avant : 039.
