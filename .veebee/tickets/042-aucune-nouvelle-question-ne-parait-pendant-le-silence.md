---
id: 042
title: Aucune nouvelle question ne paraît pendant le silence électoral
milestone: null
depends_on: ["037"]
design: maquettes/silence.html
tracker: null
---

## Ce que l'utilisateur fait
Pendant le silence électoral, aucune nouvelle question ne paraît.

## Ce qu'il voit
Sur maquettes/silence.html, à la place de la carte du jour, une carte face cachée. Ce ticket ne porte que la règle : aucune nouvelle question.

## C'est fini quand
- [ ] Avec des fiches datées du jeudi 15 au dimanche 18 avril 2027, l'accueil du jeudi 15 montre la fiche du 15 ; le vendredi 16 et le samedi 17 avril, il ne montre aucune nouvelle question, et les fiches du 16 et du 17 n'apparaissent nulle part dans l'app.
- [ ] La même règle joue avant le 2nd tour : le vendredi 30 avril et le samedi 1er mai 2027, aucune nouvelle question ne paraît.

## Les règles
- Section « Boucle principale » : "**Silence électoral (légal) :** rien de nouveau publié (app et réseaux) à partir du vendredi 0h avant chaque tour (16 avril et 30 avril 2027), par prudence car l'outre-mer vote le samedi."

## Hors ticket
- Ce que l'accueil affiche à la place : 043. Les écrans qui restent ouverts : 044. La série : 049.
- À trancher : ce que deviennent les fiches datées des jours de silence, décalées ou sautées (SPEC.md ne le dit pas).
- À trancher : quand la publication reprend (la maquette dit « jusqu'à dimanche 20 h » puis « Rendez-vous lundi », SPEC.md ne fixe pas la fin).
- Les réseaux sociaux, aussi concernés par le silence, sont gérés par l'auteur hors de l'app.
