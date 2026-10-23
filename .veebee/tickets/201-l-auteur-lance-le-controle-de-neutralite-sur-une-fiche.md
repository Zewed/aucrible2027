---
id: 201
title: L'auteur lance le contrôle de neutralité sur une fiche
milestone: null
depends_on: ["195"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Avant de publier une fiche, je lance le contrôle de neutralité dessus.

## Ce qu'il voit
Pas de maquette pour ce ticket. L'auteur lance le contrôle sur une fiche précise et obtient un résultat qui dit de quelle fiche il parle et qui rend des remarques, rangées selon trois points de vue : droite, centre, gauche.

## C'est fini quand
- [ ] Je lance le contrôle sur la fiche de la question n° 24 (retraite) : un résultat s'affiche et dit qu'il porte sur la question n° 24.
- [ ] Je lance le contrôle sur la question n° 3, dont l'option C est écrite « Arrêter le nucléaire pour tout miser sur le renouvelable » : le résultat contient une remarque sur cette option.
- [ ] Après le contrôle, la fiche est exactement comme avant : le contrôle n'a rien modifié ni publié.

## Les règles
- Production du contenu : « **Contrôle automatique de neutralité par IA** avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte. »

## Hors ticket
- Les remarques de chaque point de vue : tickets 202 (droite), 203 (centre), 204 (gauche). Le type de chaque remarque : 205. Accepter ou rejeter : 206.
- Le même contrôle sur la liste des sujets : 207 ; sur les notes du plateau : 208.
- À trancher : si le contrôle est obligatoire avant de publier (SPEC.md dit « avant publication » sans dire si une fiche non contrôlée est bloquée).
- À trancher : le premier jet par IA, outil dans le produit ou simple usage d'un assistant ? (trou du découpage). Ce que la page À propos dit de l'IA : ticket 158.
