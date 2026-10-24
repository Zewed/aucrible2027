---
id: 099
title: Le face-à-face montre deux candidats côte à côte, question par question
milestone: null
depends_on: ["061"]
design: maquettes/face-a-face.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
J'ouvre le face-à-face et je vois deux candidats comparés côte à côte, question par question.

## Ce qu'il voit
Sous le titre « Face-à-face. » (« Deux candidats, les mêmes questions, côte à côte »), deux cartes de candidats avec leur pion à initiales et leur nom, ici Raphaël Glucksmann (RG) et Bruno Retailleau (BR). Dessous, une carte par question : le thème, la question, puis l'option de chacun avec sa lettre, son titre et sa phrase d'explication, Glucksmann à gauche et Retailleau à droite (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Pour un électeur qui a répondu à la question n° 24, le face-à-face Glucksmann / Retailleau montre sous « À quel âge devrait-on pouvoir partir à la retraite ? » l'option B « 62 ans » de Raphaël Glucksmann à gauche et l'option D « 65 ans ou plus » de Bruno Retailleau à droite.
- [ ] Sous « Faut-il construire de nouveaux réacteurs nucléaires ? », Glucksmann a l'option C « Construire les 6 EPR2 prévus » et Retailleau l'option D « Construire davantage », chacun avec son pion (RG, BR) et la même présentation.

## Les règles
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."
- Section « Écrans de la v1 » : "6. **Face-à-face** et **Moi vs X**."
- Section « Principes non négociables » : "**Aucun candidat codé par la couleur de son parti** (contrainte de DA)."

## Hors ticket
- La source de chaque position : 100. Son badge « officielle » ou « déduite » : 101.
- La marque « Même option » / « Options différentes » : 102. Le décompte « D'accord sur 4 questions sur 24 » : 103.
- Changer un candidat, éviter les doublons, inverser, filtrer par thème : 104 à 107. Une position inconnue : 108.
- Ne montrer que les questions déjà répondues, la carte des questions cachées, le face-à-face sans réponse : 109, 110, 111. Le lien partagé : 112.
- Le bouton « Moi contre un candidat » du face-à-face (montré deux fois par la maquette), le bouton « Afficher les 16 autres questions » (« 8 questions affichées sur 24 »), la bande « Mes résultats » du haut et le bandeau « Ce n'est pas un sondage » du bas : aucun ticket du découpage ne les porte.
- À trancher : quels deux candidats s'affichent à l'ouverture quand aucun lien ne les nomme (la maquette montre Glucksmann et Retailleau, SPEC.md ne dit rien) (trou non listé au découpage).
