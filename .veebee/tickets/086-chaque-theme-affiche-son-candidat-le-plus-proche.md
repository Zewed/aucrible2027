---
id: 086
title: Chaque thème affiche son candidat le plus proche
milestone: null
depends_on: ["084", "063"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur lit, pour chaque thème gagné, de quel candidat il est le plus proche.

## Ce qu'il voit
Sur chaque ligne gagnée de « Tes 11 thèmes » (maquettes/resultats.html), « le plus proche : » suivi du nom d'un candidat : François Ruffin en Économie & impôts, Marine Tondelier en Écologie & énergie, Nicolas Dupont-Aignan en Immigration, David Lisnard en Sécurité & justice, Fabien Roussel en Santé.

## C'est fini quand
- [ ] Avec 23 réponses, les 5 thèmes à 3 réponses ou plus nomment : François Ruffin (Économie & impôts), Marine Tondelier (Écologie & énergie), Nicolas Dupont-Aignan (Immigration), David Lisnard (Sécurité & justice) et Fabien Roussel (Santé).
- [ ] Le candidat d'un thème peut différer du premier du classement général : en Santé, c'est Fabien Roussel alors que François Ruffin est premier du classement.

## Les règles
- "**À partir de 3 réponses dans un thème** : détail par thème (« sur l'écologie tu es proche de A, sur l'économie de B »)." (SPEC.md, section « Résultats »)
- "**Score global** : % du maximum possible." (SPEC.md, section « Méthode de calcul (publiée) »)

## Hors ticket
- Le thème qui n'a pas encore 3 réponses : 087. Les pastilles : 084.
- Le classement général : 063. Toucher le nom pour ouvrir la fiche du candidat : la maquette n'en fait pas un lien (123 ne couvre que le classement).
