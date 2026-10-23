---
id: "080"
title: Une option sans note sur un axe ne déplace pas le pion
milestone: null
depends_on: ["075"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit qu'une réponse sans note sur un axe ne déplace pas son pion sur cet axe.

## Ce qu'il voit
Pas d'écran propre. L'exemple de la page Méthode (maquettes/methode.html) place l'électeur sur l'axe économique avec trois réponses : « Retraite : 62 ans » noté −1 (×3), « Droits de succession » noté +2 (×1), et « Fin de vie » sans note (×2), ignorée sur cet axe. Résultat : −0,25, un peu côté redistribution.

## C'est fini quand
- [ ] Deux électeurs qui ont donné les mêmes réponses, sauf que l'un a aussi répondu à une question dont l'option choisie n'a aucune note sur l'axe économique (comme « Fin de vie » dans l'exemple de la page Méthode) : leur pion « TOI » est à la même place de gauche à droite.
- [ ] Une option notée seulement sur l'axe économique déplace le pion de gauche à droite sans changer sa hauteur ; une option sans aucune note ne le déplace pas du tout.

## Les règles
- "**Carte** : chaque option reçoit une note de −2 à +2 sur l'axe économique, l'axe sociétal, ou aucun. Position de l'utilisateur = moyenne pondérée de ses options ; même formule pour les candidats." (SPEC.md, section « Méthode de calcul (publiée) »)
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)

## Hors ticket
- Le pion « toi » et sa place : 075. Les noms des axes : 077.
- L'explication du placement sur la page Méthode : 146.
- La relecture des notes par le contrôle de neutralité : 208.
- À trancher : où se place le pion sur un axe où aucune des réponses n'a de note (pas de maquette, non prévu par le découpage).
