---
id: "105"
title: Le même candidat ne peut pas être choisi deux fois
milestone: null
depends_on: ["104"]
design: maquettes/face-a-face.html
tracker: null
---

## Ce que l'utilisateur fait
Je ne peux pas mettre un candidat face à lui-même.

## Ce qu'il voit
Dans chaque panneau « Choisir un autre candidat », ni le candidat affiché de ce côté ni celui de l'autre côté ne sont proposés : la liste compte 11 noms sur 13 (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Dans le panneau « Choisir un autre candidat » ouvert sous Glucksmann, Bruno Retailleau n'est pas proposé ; dans celui ouvert sous Retailleau, Raphaël Glucksmann n'est pas proposé.
- [ ] Après avoir choisi Marine Tondelier à droite, le panneau de gauche ne propose plus Tondelier mais propose de nouveau Bruno Retailleau.

## Les règles
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."

## Hors ticket
- Le remplacement lui-même et la liste des 11 candidats : 104.
- À trancher : un lien partagé qui nomme deux fois le même candidat (112) (trou non listé au découpage).
