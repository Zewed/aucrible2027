---
id: "171"
title: La fiche candidat propose aussi « Signaler une erreur »
milestone: null
depends_on: ["160", "121"]
design: maquettes/signaler.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois une erreur sur la fiche d'un candidat et je veux la signaler.

## Ce qu'il voit
En bas de la fiche de Marine Tondelier (maquettes/candidat.html), la question « Une erreur, un chiffre ou une source à revoir ? » et le lien « Signaler une erreur sur cette fiche », qui ouvre le formulaire (maquettes/signaler.html).

## C'est fini quand
- [ ] Sur la fiche de Marine Tondelier, sous « Une erreur, un chiffre ou une source à revoir ? », le lien « Signaler une erreur sur cette fiche » est présent.
- [ ] Le même lien est présent sur la fiche d'un autre candidat (par exemple Nathalie Arthaud) et un clic ouvre la page « Signaler une erreur. ».

## Les règles
- « Neutralité vérifiable, pas déclarée. Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement. » (SPEC.md, section « Principes non négociables »)

## Hors ticket
- À trancher : ce que « Sur quelle fiche ? » affiche et quel type est présélectionné quand le formulaire vient d'une fiche candidat. La maquette ne montre que le cas d'une question (161).
- La fiche candidat elle-même et ses positions : 121 et suivants.
