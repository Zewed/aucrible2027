---
id: 208
title: Le contrôle passe sur les notes du plateau
milestone: null
depends_on: ["201"]
design: null
tracker: null
---

## Ce que l'utilisateur fait
Je lance le contrôle de neutralité sur les notes que je donne aux options pour placer les pions sur le plateau.

## Ce qu'il voit
Pas de maquette pour ce ticket. Le même résultat que pour une fiche, avec ses trois points de vue, mais qui porte sur les notes des options d'une fiche (de −2 à +2 sur l'axe Économie, sur l'axe Société, ou aucune). SPEC.md les appelle « les notes de la carte » : c'est le plateau des maquettes.

## C'est fini quand
- [ ] Je lance le contrôle sur les notes de la fiche n° 24 : le résultat dit qu'il porte sur les notes de cette fiche, option par option (A à E), et montre les trois points de vue.
- [ ] Je donne à l'option E (À la carte) la note +2 sur l'axe Économie, puis je relance : le résultat montre +2 pour l'option E.

## Les règles
- Production du contenu : « **Contrôle automatique de neutralité par IA** avant publication, avec 3 points de vue (droite, centre, gauche) : formulations orientées, arguments manquants, chiffres sans source, options caricaturées. L'auteur tranche sur chaque remarque. Le même contrôle s'applique à la liste des sujets et aux notes de la carte. »
- Méthode de calcul (publiée) : « **Carte** : chaque option reçoit une note de −2 à +2 sur l'axe économique, l'axe sociétal, ou aucun. Position de l'utilisateur = moyenne pondérée de ses options ; même formule pour les candidats. »
- Résultats (« **carte politique à 2 axes** : ») : « Économie : plus de redistribution ↔ plus de marché »
- Résultats (« **carte politique à 2 axes** : ») : « Société : progressiste ↔ conservateur »

## Hors ticket
- Le placement des pions sur le plateau : tickets 075 à 082. Une option sans note qui ne déplace pas le pion : ticket 080. L'explication sur la page Méthode : ticket 146.
- Lancer le contrôle sur une fiche : ticket 201. Accepter ou rejeter : ticket 206.
- Choisir les notes elles-mêmes est un travail éditorial (trou du découpage), pas un ticket de code.
