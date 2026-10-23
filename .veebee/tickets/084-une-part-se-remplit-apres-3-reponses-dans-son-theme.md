---
id: "084"
title: Une part se remplit après 3 réponses dans son thème
milestone: null
depends_on: ["083"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit une part de son camembert se remplir quand il a répondu à 3 questions d'un même thème.

## Ce qu'il voit
Chaque ligne de « Tes 11 thèmes » (maquettes/resultats.html, « 3 réponses = 1 part ») a trois pastilles qui s'allument à chaque réponse du thème. À trois, la ligne est gagnée et la part du camembert est remplie (Économie & impôts, Écologie & énergie, Immigration, Sécurité & justice et Santé sur la maquette).

## C'est fini quand
- [ ] Avec 2 réponses en Travail & retraites, la ligne montre 2 pastilles allumées sur 3 et la part Travail & retraites du camembert est vide.
- [ ] Après la réponse à la question n° 24 (la 3e du thème), les 3 pastilles sont allumées et la part Travail & retraites est remplie.
- [ ] Une 4e réponse dans un thème déjà gagné (Économie & impôts en a 4) laisse ses 3 pastilles allumées et sa part remplie.

## Les règles
- "**À partir de 3 réponses dans un thème** : détail par thème (« sur l'écologie tu es proche de A, sur l'économie de B »)." (SPEC.md, section « Résultats »)
- "Progression par thème (« 4 thèmes explorés sur 11 »)." (SPEC.md, section « Ludique »)

## Hors ticket
- Le compteur de parts gagnées : 085. Le candidat le plus proche d'un thème gagné : 086. Le message d'un thème sous 3 réponses : 087.
- L'annonce de la part en jeu sur la fiche : 088 ; l'annonce de la part gagnée sur la révélation : 089.
- À trancher : le texte « 1 part commencée » et « Encore une, et la part est à toi » de resultats-vide.html n'est porté par aucun ticket (non prévu par le découpage).
- À trancher : un « Je ne sais pas » compte-t-il dans les 3 réponses d'un thème ? (voir 068)
