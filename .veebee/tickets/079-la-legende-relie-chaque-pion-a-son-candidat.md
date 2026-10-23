---
id: "079"
title: La légende relie chaque pion à son candidat
milestone: null
depends_on: ["078"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur retrouve le nom de chaque pion dans la légende sous le plateau.

## Ce qu'il voit
Sous le plateau (maquettes/resultats.html), la légende liste « Toi, ton camembert » puis les 13 candidats, chacun avec son pion à initiales et son nom complet (« NDA » et « Nicolas Dupont-Aignan »), sur deux colonnes au téléphone et trois sur ordinateur.

## C'est fini quand
- [ ] Pour chacun des 13 pions du plateau, la légende contient une ligne avec les mêmes initiales et le nom complet : « FRu » pour François Ruffin, « FRo » pour Fabien Roussel.
- [ ] La légende range les candidats dans un ordre qui n'est ni celui du classement ni l'ordre alphabétique.

## Les règles
- "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement." (SPEC.md, section « Principes non négociables »)

## Hors ticket
- Les pions du plateau : 078. L'ordre mélangé sur la révélation : 025.
- À trancher : l'ordre mélangé change-t-il à chaque visite, ou reste-t-il fixe le temps d'une session ? SPEC.md dit seulement « aléatoire » (non prévu par le découpage).
- La légende avant 10 réponses (« Les pions des candidats arrivent à 10 réponses ») : 081.
