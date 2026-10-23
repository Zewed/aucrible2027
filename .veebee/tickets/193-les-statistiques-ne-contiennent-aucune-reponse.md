---
id: "193"
title: Les statistiques ne contiennent aucune réponse
milestone: null
depends_on: ["192"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
En tant qu'auteur, je veux être sûr que les statistiques ne contiennent aucune réponse.

## Ce qu'il voit
Pas de maquette pour ce ticket. Les statistiques de l'auteur ne montrent que des visites par jour, jamais ce que les gens ont répondu.

## C'est fini quand
- [ ] Après avoir validé l'option E avec l'importance ×2 à la question n° 24 depuis un appareil de test, les statistiques de l'auteur n'affichent ni option, ni importance, ni nombre de réponses, ni thème : seulement des visites par jour.
- [ ] Un appareil qui a répondu aux 23 questions et un appareil qui n'a rien répondu comptent chacun pour une visite, et rien dans les statistiques ne permet de les distinguer.

## Les règles
- « Statistiques de visite anonymes, sans les réponses. » (SPEC.md, section « Données »)
- « On ne sait pas pour qui tu votes. Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9). » (SPEC.md, section « Principes non négociables »)
- « Pas un sondage. Aucune statistique agrégée sur les utilisateurs, jamais le mot « sondage ». » (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Le nombre de visites par jour : 192. L'absence de cookie : 194.
- Les signalements, qui restent dans leur boîte privée et n'entrent jamais dans les statistiques : 164.
