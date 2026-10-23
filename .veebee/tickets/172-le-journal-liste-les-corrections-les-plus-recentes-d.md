---
id: 172
title: Le journal liste les corrections, les plus récentes d'abord
milestone: null
depends_on: ["001"]
design: maquettes/journal.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je veux voir les erreurs qu'on a reconnues et corrigées.

## Ce qu'il voit
La page « Journal des corrections. » (maquettes/journal.html) : une introduction (« Quand une erreur est repérée, elle est corrigée en public… Rien n'est modifié en douce. ») puis la liste « Les corrections, la plus récente d'abord » : sept entrées, du 22 oct. 2026 au 09 oct. 2026, chacune avec sa date en gros.

## C'est fini quand
- [ ] Avec les sept corrections de la maquette, le journal les liste de la plus récente à la plus ancienne : 22 oct., 20 oct., 19 oct., 17 oct., 16 oct., 12 oct., 09 oct. 2026.
- [ ] L'introduction dit que les signalements arrivent dans une boîte privée, que seule la correction est publique et que la réponse vient sous 72 h.

## Les règles
- « Page publique « Journal des corrections » : date, fiche, avant/après, raison. » (SPEC.md, section « Corrections »)
- « Neutralité vérifiable, pas déclarée. Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement. » (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Le détail de chaque entrée : la fiche touchée (173), l'avant et l'après (174), la raison (175), l'origine (176).
- Les filtres par type (177) et l'état vide (178).
- Le bandeau de chiffres au-dessus de la liste (« 7 corrections depuis le lancement », « 4 signalées par des utilisateurs », « 3 repérées par le contrôle de neutralité ») et les deux liens de bas de page (« Signaler une erreur », « Méthode de calcul ») : aucun ticket du découpage ne les porte.
- L'ajout d'une ligne quand l'auteur corrige une fiche : 200.
