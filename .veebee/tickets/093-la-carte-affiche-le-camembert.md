---
id: "093"
title: La carte affiche le camembert
milestone: null
depends_on: ["091", "083"]
design: maquettes/carte-story.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit son camembert sur la carte qu'il partage.

## Ce qu'il voit
Sur la carte « avec mon candidat » (maquettes/carte-story.html), sous la phrase « Je suis à 81 % proche de François Ruffin. », un camembert de 11 parts dont les parts gagnées sont remplies. La carte porte aussi, en haut, une frise de 11 petites tuiles de couleur.

## C'est fini quand
- [ ] Avec 5 parts gagnées, le camembert de la carte montre 5 parts remplies sur 11, les mêmes que celles de « Mes résultats » (Économie & impôts, Écologie & énergie, Immigration, Sécurité & justice, Santé).
- [ ] Après la réponse à la question n° 24, le camembert de la carte montre 6 parts remplies : la part Travail & retraites s'est ajoutée.

## Les règles
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)
- "**Carte de résultat partageable** au format story (« Je suis à 74 % proche de X, et toi ? »). C'est le principal moteur de croissance, puisque la pub est impossible." (SPEC.md, section « Ludique »)

## Hors ticket
- Le camembert de « Mes résultats » : 083 à 085. Le texte « 5/11 thèmes » au pied de la carte : 092.
- La carte « seulement mon pion » n'a pas de camembert : 094.
