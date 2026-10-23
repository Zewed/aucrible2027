---
id: 065
title: Une option hors échelle compte tout ou rien
milestone: null
depends_on: ["063"]
design: maquettes/resultats.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
L'électeur voit qu'une option qui ne se range pas sur l'échelle ne le rapproche d'un candidat que si ce dernier a choisi exactement la même.

## Ce qu'il voit
Pas d'écran propre. La page Méthode (maquettes/methode.html) précise qu'une option hors échelle, comme « À la carte » dans la question du jour, compte comme une option non ordonnée : 1 si la carte est la même, 0 sinon.

## C'est fini quand
- [ ] Trois électeurs qui ont donné les mêmes réponses partout, sauf à la question n° 24 où ils répondent E, puis D, puis A : le % de Nicolas Dupont-Aignan, dont la position est E, est le plus haut avec E, et le même avec D et avec A.
- [ ] Dans les mêmes conditions, le % de Bruno Retailleau, dont la position est D, est le même que l'électeur réponde E ou A.

## Les règles
- "**Score par question** : options ordonnées sur une échelle → `1 − écart / écart max` ; options non ordonnées → 1 si identique, 0 sinon. Multiplié par l'importance (×1/×2/×3)." (SPEC.md, section « Méthode de calcul (publiée) »)

## Hors ticket
- Les options rangées sur une échelle (A à D de la question n° 24) : 064.
- L'explication sur la page Méthode : 143.
- À trancher : la révélation (maquettes/revelation.html) présente D comme la « carte voisine » de E (« proche de »), alors que la page Méthode range E hors échelle. Ce ticket suit la page Méthode ; l'alignement affiché sur la révélation relève de 027 à 029.
- À trancher : comment l'auteur dit qu'une question est ordonnée ou non ; aucun ticket du découpage, pas même 195 à 197, ne le porte.
