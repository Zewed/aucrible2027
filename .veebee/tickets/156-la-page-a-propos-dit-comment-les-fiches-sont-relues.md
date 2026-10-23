---
id: 156
title: La page À propos dit comment les fiches sont relues
milestone: null
depends_on: ["155"]
design: maquettes/a-propos.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux savoir qui relit les fiches avant qu'elles paraissent, et si on peut me croire.

## Ce qu'il voit
La section « Neutre ? Voilà ce qu'on fait vraiment » (maquettes/a-propos.html) : une citation de l'auteur, la liste de ce qui se vérifie, un paragraphe « Ce que je ne prétends pas » (ni comité ni relecteur extérieur) et le schéma « Avant chaque publication » en quatre temps, avec les trois points de vue Droite, Centre, Gauche.

## C'est fini quand
- [ ] Dans la section 2 de la page À propos, le schéma « Avant chaque publication » montre quatre temps dans l'ordre : un premier jet par l'IA à partir de sources officielles ; la relecture par l'auteur de chaque chiffre et de chaque position de candidat ; le contrôle de neutralité par IA avec trois points de vue (Droite, Centre, Gauche), où l'auteur tranche sur chaque remarque ; après publication, la correction publique de toute erreur signalée.
- [ ] Le paragraphe « Ce que je ne prétends pas » dit « il n'y a ni comité ni relecteur extérieur » et que c'est relu par l'auteur et contrôlé par une IA ; aucune phrase de la page n'annonce une relecture externe.
- [ ] Le texte énumère ce qui se vérifie : chaque position de candidat a sa source, la méthode de calcul est publique, l'ordre des candidats est aléatoire, chaque option est présentée avec l'argument que ses propres défenseurs signeraient.

## Les règles
- « Page « À propos » honnête : relu par l'auteur + contrôle automatique de neutralité par IA + journal public des corrections. Ne jamais prétendre à une relecture externe. » (SPEC.md, section « Projet »)
- « Neutralité vérifiable, pas déclarée. Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement. » (SPEC.md, section « Principes non négociables »)
- « Meilleur argument de chaque camp. Chaque option est présentée avec l'argument que ses propres défenseurs signeraient. Jamais d'ironie, de mépris ni de « en réalité… ». Un électeur RN doit se sentir aussi respecté qu'un électeur LFI. » (SPEC.md, section « Principes non négociables »)
- « L'IA rédige un premier jet à partir de sources officielles. » (SPEC.md, section « Production du contenu »)
- « L'auteur vérifie chaque chiffre et chaque position de candidat. » (SPEC.md, section « Production du contenu »)
- « Contrôle automatique de neutralité par IA avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte. » (SPEC.md, section « Production du contenu »)

## Hors ticket
- Les liens « méthode de calcul » et « journal des corrections » placés dans cette section : pages portées par 143 et 172, liens eux-mêmes non portés par un ticket du découpage.
- Que l'ordre des candidats soit réellement aléatoire (025) et que chaque position ait sa source (022) : cette section le dit, ces tickets le font.
- Le contrôle de neutralité lui-même (201 à 206) : cette section ne fait que le décrire.
- Le reste de la page : 155 (qui), 157 (vie privée), 158 (IA), 159 (suite).
