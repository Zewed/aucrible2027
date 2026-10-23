---
id: "194"
title: L'app ne dépose aucun cookie
milestone: null
depends_on: ["192"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Je visite l'app sans qu'elle me suive à la trace.

## Ce qu'il voit
Pas de maquette pour ce ticket. Le visiteur ne voit rien de plus : aucun bandeau de consentement, et la liste des cookies de son navigateur pour aucrible2027.fr reste vide.

## C'est fini quand
- [ ] Après avoir ouvert l'app, répondu à la question n° 24, parcouru Mes résultats et À propos et envoyé un signalement, la liste des cookies du navigateur pour aucrible2027.fr est vide.
- [ ] Aucun bandeau ni fenêtre de consentement aux cookies ne s'affiche, ni à la première visite ni ensuite.

## Les règles
- « Statistiques de visite anonymes, sans les réponses. » (SPEC.md, section « Données »)
- « On ne sait pas pour qui tu votes. Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9). » (SPEC.md, section « Principes non négociables »)

## Hors ticket
- À trancher : SPEC.md ne dit pas « aucun cookie » ; ce ticket le déduit de « statistiques de visite anonymes ». À confirmer.
- À trancher : ce que montre la toute première visite (trou du découpage).
- Les réponses gardées sur l'appareil (033) ne sont pas des cookies et restent sur l'appareil. Les statistiques elles-mêmes : 192 et 193.
