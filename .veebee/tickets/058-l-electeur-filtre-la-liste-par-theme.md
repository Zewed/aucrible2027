---
id: "058"
title: L'électeur filtre la liste par thème
milestone: null
depends_on: ["052"]
design: maquettes/rattrapage.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur filtre la liste des questions sur un seul thème.

## Ce qu'il voit
Au-dessus de la liste (maquettes/rattrapage.html), « Filtrer par thème » propose « Tous les thèmes » et les 11 thèmes en pastilles ; le thème choisi est rappelé dans « Filtrer par thème » et la liste ne montre plus que ses questions.

## C'est fini quand
- [ ] En choisissant « Travail & retraites », les questions n° 24 (« À répondre ») et n° 5 (« Répondu ») restent, et la n° 9 « Faut-il rétablir l'ISF ? » disparaît de la liste.
- [ ] En choisissant « Santé », la n° 3 « Faut-il réguler l'installation des médecins ? » reste, et les n° 9 (ISF) et n° 24 (retraite) disparaissent ; en choisissant « Tous les thèmes », la liste complète revient.

## Les règles
- "Économie & impôts · Travail & retraites · Écologie & énergie · Immigration · Sécurité & justice · Santé · Éducation & jeunesse · Logement · Europe & international · Institutions & démocratie · Société (laïcité, fin de vie…)." (SPEC.md, section « Thèmes (11, en rotation) »)

## Hors ticket
- La liste et les cartes elles-mêmes : 052. Le compteur de questions à rattraper : 057.
- À trancher : ce que montre la liste pour un thème qui n'a encore aucune question publiée, et si le compteur de questions à rattraper suit le filtre (pas de maquette, non prévu par le découpage).
