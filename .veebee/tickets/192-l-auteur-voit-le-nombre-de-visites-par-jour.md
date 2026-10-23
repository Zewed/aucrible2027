---
id: "192"
title: L'auteur voit le nombre de visites par jour
milestone: null
depends_on: ["001"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
En tant qu'auteur, je veux voir combien de personnes ouvrent l'app chaque jour.

## Ce qu'il voit
Pas de maquette pour ce ticket. D'après SPEC.md, l'auteur consulte des statistiques de visite anonymes : pour chaque jour, un nombre de visites.

## C'est fini quand
- [ ] Après avoir ouvert l'app aujourd'hui depuis deux appareils différents, la ligne d'aujourd'hui dans les statistiques de l'auteur augmente de 2 visites.
- [ ] Chaque jour a sa propre ligne : une visite faite le lendemain s'ajoute à la ligne du lendemain et ne change pas celle de la veille.

## Les règles
- « Statistiques de visite anonymes, sans les réponses. » (SPEC.md, section « Données »)
- « Pas un sondage. Aucune statistique agrégée sur les utilisateurs, jamais le mot « sondage ». » (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Qu'aucune réponse n'entre dans ces statistiques : 193. Qu'aucun cookie ne soit déposé : 194.
- À trancher : où l'auteur consulte ces chiffres, ce qui compte comme une visite (un appareil par jour ou chaque ouverture) et à quelle heure on passe au jour suivant. SPEC.md ne le dit pas.
- Toute statistique agrégée sur les utilisateurs, et tout chiffre montré aux électeurs : hors périmètre (SPEC.md, « Statistiques agrégées. »).
