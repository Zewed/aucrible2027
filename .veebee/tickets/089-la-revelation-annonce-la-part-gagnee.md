---
id: "089"
title: La révélation annonce la part gagnée
milestone: null
depends_on: ["084", "019"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Après avoir validé sa réponse, l'électeur lit qu'il vient de gagner la part de son thème.

## Ce qu'il voit
Sur la révélation de la question n° 24 (maquettes/revelation.html), un bloc « Ton camembert » dit « +1 réponse en Travail & retraites : 3/3, la part est gagnée ! », montre trois cases dont la dernière vient de s'allumer, puis « Ton camembert passe à 6 parts sur 11. ».

## C'est fini quand
- [ ] Avec 2 réponses en Travail & retraites, valider la réponse à la question n° 24 fait afficher sur la révélation « +1 réponse en Travail & retraites : 3/3, la part est gagnée ! » et « Ton camembert passe à 6 parts sur 11. »

## Les règles
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)
- "**Révélation** : qui défend quelle option (avec sources et badge « position déduite » ou « position officielle »), alignement sur cette question, classement mis à jour." (SPEC.md, section « Une fiche (question du jour) »)

## Hors ticket
- La série annoncée à côté du bloc (« Ta série continue », 7 jours d'affilée) : 046.
- Le camembert sur « Mes résultats » : 083 à 085.
- À trancher : ce que dit la révélation quand la réponse ne complète aucune part, ou après un « Je ne sais pas ». La maquette ne dessine que le cas gagné (non prévu par le découpage ; voir aussi 030).
