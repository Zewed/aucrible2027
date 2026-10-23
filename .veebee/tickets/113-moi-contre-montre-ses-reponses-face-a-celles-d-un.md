---
id: 113
title: « Moi contre » montre ses réponses face à celles d'un candidat
milestone: null
depends_on: ["061"]
design: maquettes/moi-vs.html
tracker: null
---

## Ce que l'utilisateur fait
J'ouvre « Moi contre » et je vois mes réponses face à celles d'un candidat.

## Ce qu'il voit
Sous le titre « Moi contre un candidat. », un duel entre « Toi » (pion TOI) et Édouard Philippe (pion ÉP), puis une carte par question : à gauche « Ta réponse » (lettre, titre, phrase, date et importance), à droite la position de Philippe, au milieu « Même option » ou « Options différentes ». La page rappelle « Ce n'est pas un sondage : seulement tes réponses, gardées sur ton téléphone » (maquettes/moi-vs.html).

## C'est fini quand
- [ ] Face à Édouard Philippe, « À quel âge devrait-on pouvoir partir à la retraite ? » montre à gauche « Ta réponse » (C « 64 ans » pour un électeur qui a choisi C) et à droite l'option C « 64 ans » de Philippe, avec « Même option ».
- [ ] Sur « Faut-il rétablir l'impôt sur la fortune ? », l'électeur qui a choisi B « Un impôt plancher sur les très hauts patrimoines » voit en face C « Garder l'impôt sur la fortune immobilière » et « Options différentes ».
- [ ] Chaque réponse de l'électeur rappelle sa date et son importance, par exemple « 19 oct. 2026 · importance ×2 ».

## Les règles
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."
- Section « Écrans de la v1 » : "6. **Face-à-face** et **Moi vs X**."
- Section « Principes non négociables » : "**On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9)."

## Hors ticket
- Le pourcentage d'accord : 114. Le score par thème : 115. Changer de candidat : 116. La source et le badge de la position du candidat : 117 et 118. Les questions sans réponse : 119. Le lien vers le face-à-face : 120.
- Le bouton « mes résultats » sous « Toi », le bouton « Afficher la suite » (« 7 réponses affichées sur 23 ») et le bandeau « Ce n'est pas un sondage » de cette page ne sont portés par aucun ticket du découpage.
- À trancher : si l'électeur peut changer sa réponse après l'avoir validée (trou du découpage) ; quel candidat s'affiche à l'ouverture (la maquette montre Édouard Philippe) ; comment une réponse « Je ne sais pas » s'affiche ici (trous non listés).
