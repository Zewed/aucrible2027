---
id: 116
title: L'électeur change de candidat
milestone: null
depends_on: ["113"]
design: maquettes/moi-vs.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je choisis un autre candidat pour me comparer.

## Ce qu'il voit
Sous le nom d'Édouard Philippe, un bouton « changer » déroule « Choisir un autre candidat » : 12 candidats, chacun avec son pion et son nom (maquettes/moi-vs.html).

## C'est fini quand
- [ ] « changer » sous Édouard Philippe liste 12 candidats (les 13 moins Philippe), dans un ordre mélangé.
- [ ] Après avoir choisi Marine Le Pen, le bloc « Ta proximité avec Marine Le Pen » remplace celui de Philippe et les positions de droite sont les siennes ; les réponses de l'électeur, à gauche, ne changent pas.

## Les règles
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."

## Hors ticket
- Le même panneau dans le face-à-face, avec deux candidats à choisir : 104.
- L'adresse de « Moi contre » qui garderait le candidat choisi pour un partage : aucun ticket ne la porte (112 ne vise que le face-à-face).
