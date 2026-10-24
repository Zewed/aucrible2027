---
id: 115
title: « Moi contre » affiche un score par thème
milestone: null
depends_on: ["114"]
design: maquettes/moi-vs.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je vois mon accord avec ce candidat thème par thème.

## Ce qu'il voit
Une section « Thème par thème » (« score dès 3 réponses ») avec 11 lignes : les thèmes d'au moins 3 réponses affichent un pourcentage et « d'accord sur 2 questions sur 4 », les autres affichent trois pastilles à remplir et « pas encore assez de réponses » (maquettes/moi-vs.html).

## C'est fini quand
- [ ] Dans « Économie & impôts » (4 réponses), la ligne affiche « 55 % » et « d'accord sur 2 questions sur 4 ».
- [ ] « Travail & retraites » (2 réponses) affiche 2 pastilles remplies sur 3 et « pas encore assez de réponses », sans pourcentage.
- [ ] Après une 3e réponse dans « Travail & retraites », la ligne affiche un pourcentage à la place de « pas encore assez de réponses ».

## Les règles
- Section « Résultats » : "**À partir de 3 réponses dans un thème** : détail par thème (« sur l'écologie tu es proche de A, sur l'économie de B »)."
- Section « Thèmes (11, en rotation) » : "Économie & impôts · Travail & retraites · Écologie & énergie · Immigration · Sécurité & justice · Santé · Éducation & jeunesse · Logement · Europe & international · Institutions & démocratie · Société (laïcité, fin de vie…)."

## Hors ticket
- Le camembert des thèmes (083 à 090) et le candidat le plus proche de chaque thème (086) sont ceux de « Mes résultats », pas de cette page.
- Le pourcentage global avec ce candidat : 114.
