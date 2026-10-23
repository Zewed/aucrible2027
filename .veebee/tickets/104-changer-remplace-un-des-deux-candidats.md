---
id: "104"
title: « Changer » remplace un des deux candidats
milestone: null
depends_on: ["099"]
design: maquettes/face-a-face.html
tracker: null
---

## Ce que l'utilisateur fait
Je remplace l'un des deux candidats par un autre.

## Ce qu'il voit
Sous chaque candidat, un bouton « changer » déroule « Choisir un autre candidat » : une liste de 11 candidats (Éric Zemmour, Marine Tondelier, Gabriel Attal…), chacun avec son pion et son nom (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Sous Bruno Retailleau, « changer » ouvre « Choisir un autre candidat » avec 11 candidats, soit les 13 moins Glucksmann et Retailleau, dans un ordre mélangé (ni alphabétique, ni celui du classement).
- [ ] Après avoir choisi Marine Tondelier, elle remplace Retailleau à droite, Glucksmann reste à gauche, et chaque question montre à droite la position de Tondelier.
- [ ] Le même geste sous Glucksmann le remplace à gauche sans toucher au candidat de droite.

## Les règles
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."

## Hors ticket
- Empêcher de choisir deux fois le même candidat : 105. Inverser les deux : 106. Le lien partagé qui suit ce choix : 112.
- Le résumé « D'accord sur … questions » qui se recalcule pour le nouveau couple : 103.
