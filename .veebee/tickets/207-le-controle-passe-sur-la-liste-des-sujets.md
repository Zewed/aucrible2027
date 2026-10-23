---
id: "207"
title: Le contrôle passe sur la liste des sujets
milestone: null
depends_on: ["201"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Je lance le contrôle de neutralité sur la liste des sujets.

## Ce qu'il voit
Pas de maquette pour ce ticket. Le même résultat que pour une fiche, avec ses trois points de vue, mais qui porte sur la liste des sujets (environ 13 par thème, 11 thèmes) au lieu d'une fiche.

## C'est fini quand
- [ ] Je lance le contrôle sur la liste des sujets : le résultat dit qu'il porte sur la liste des sujets, et non sur une fiche, et montre les trois points de vue (droite, centre, gauche).
- [ ] J'ajoute au thème « Travail & retraites » un sujet formulé « Faut-il en finir avec la retraite à 64 ans ? » : le contrôle fait une remarque sur ce sujet.

## Les règles
- Production du contenu : « **Contrôle automatique de neutralité par IA** avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte. »
- Thèmes (11, en rotation) : « Environ 150 sujets listés en amont (~13 par thème). »
- Thèmes (11, en rotation) : « Critères d'un sujet : les candidats ne sont pas d'accord, c'est chiffrable, c'est concret. »

## Hors ticket
- Lancer le contrôle sur une fiche : ticket 201. Accepter ou rejeter : ticket 206. Les notes du plateau : ticket 208.
- Choisir et écrire les ≈150 sujets est un travail éditorial (trou du découpage), pas un ticket de code.
- À trancher : la forme de la liste des sujets (SPEC.md dit seulement « listés en amont », sans dire où ni comment).
