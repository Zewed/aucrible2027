---
id: "152"
title: La page Méthode explique pourquoi ce n'est pas un sondage
milestone: null
depends_on: ["143"]
design: maquettes/methode.html
tracker: null
---

## Ce que l'utilisateur fait
Je comprends pourquoi ce n'est pas un sondage.

## Ce qu'il voit
Dans la règle n° 8 « Ce que ce jeu n'est pas, et comment le vérifier », un tampon « Ce n'est pas un sondage. », puis « Les utilisateurs ne sont pas représentatifs, et on ne collecte pas tes réponses. Aucune statistique sur les utilisateurs n'est calculée ni publiée. » et « Ton pourcentage n'est pas une prévision de vote. » (maquettes/methode.html).

## C'est fini quand
- [ ] La règle n° 8 affiche le tampon « Ce n'est pas un sondage. ».
- [ ] Elle dit que les utilisateurs ne sont pas représentatifs, qu'on ne collecte pas les réponses et qu'aucune statistique sur les utilisateurs n'est calculée ni publiée.
- [ ] Elle dit que le pourcentage n'est pas une prévision de vote : il dit seulement à quel point les réponses rejoignent ce que défend chaque candidat, sur les questions auxquelles l'électeur a répondu.

## Les règles
- Section « Principes non négociables » : "**Pas un sondage.** Aucune statistique agrégée sur les utilisateurs, jamais le mot « sondage »."
- Section « Principes non négociables » : "**On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9)."
- Section « Données » : "Aucun compte. Réponses stockées localement dans le navigateur."
- Section « Données » : "Statistiques de visite anonymes, sans les réponses."

## Hors ticket
- Le bandeau « Ce n'est pas un sondage » sur « Mes résultats » : 072. Le bouton vers le code source qui suit dans la même règle : 153.
- Les statistiques de visite anonymes, côté auteur : 192 à 194.
- SPEC.md dit « jamais le mot « sondage » » et impose pourtant « Ce n'est pas un sondage » (072, 152) : à confirmer que seule cette formule négative est permise.
