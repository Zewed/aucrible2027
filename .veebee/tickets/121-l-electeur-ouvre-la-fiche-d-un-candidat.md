---
id: 121
title: L'électeur ouvre la fiche d'un candidat
milestone: null
depends_on: ["001"]
design: maquettes/candidat.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
J'ouvre la fiche d'un candidat.

## Ce qu'il voit
Une page « Fiche candidat » avec, en tête, le pion à initiales en grand (MT), le sur-titre « Fiche candidat » et le nom « Marine Tondelier » en titre. Au-dessus, la bande « Mes résultats » et le compte à rebours « J-177 avant le 1er tour » (maquettes/candidat.html).

## C'est fini quand
- [ ] Ouvrir la fiche de Marine Tondelier affiche le sur-titre « Fiche candidat », son nom en titre et son pion « MT ».
- [ ] Les fiches de Jean-Luc Mélenchon (pion JLM) et de Marine Le Pen (pion MLP) ont le même pion que celle de Tondelier, de même forme et de même couleur : seules les initiales changent, aucun pion n'est coloré par son parti.

## Les règles
- Section « Écrans de la v1 » : "7. **Fiche candidat** : positions sourcées par thème, badges déduite / officielle."
- Section « Principes non négociables » : "**Aucun candidat codé par la couleur de son parti** (contrainte de DA)."
- Section « Candidats » : "Photos des candidats : portraits officiels sous licence libre uniquement."

## Hors ticket
- Le parti : 124. Le statut de la candidature : 125. Les positions : 126 à 130. La proximité avec l'électeur : 131. La légende des badges : 132. Les boutons « Moi contre » et « Face-à-face » : 133 et 134. « Signaler une erreur » sur la fiche : 171.
- Les chemins pour arriver sur la fiche depuis la révélation (122) et depuis le classement (123). Le lien depuis la liste des 13 candidats de la page Méthode n'est porté par aucun ticket.
- Le compte à rebours « J-177 avant le 1er tour » : 039. La bande de retour « Mes résultats » n'est portée par aucun ticket du découpage.
- À trancher : la photo du candidat (portrait officiel sous licence libre, SPEC.md) ; la maquette ne montre qu'un pion à initiales et aucun ticket ne porte la photo (trou non listé au découpage).
