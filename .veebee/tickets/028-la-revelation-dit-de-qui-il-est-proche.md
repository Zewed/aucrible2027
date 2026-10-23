---
id: "028"
title: La révélation dit de qui il est proche
milestone: null
depends_on: ["027"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Après ma réponse, je vois de qui je suis proche sur ce sujet.

## Ce qu'il voit
Sur maquettes/revelation.html, sous « Sur ce sujet, tu es aligné·e avec », une ligne « et proche de » : les candidats dont l'option est voisine de la tienne sur l'échelle (pour E : Bruno Retailleau, qui défend D).

## C'est fini quand
- [ ] Après avoir choisi E, la révélation dit « et proche de » Bruno Retailleau (option D, voisine de E).
- [ ] Après avoir choisi A, elle dit « et proche de » Marine Le Pen, Marine Tondelier et Raphaël Glucksmann (option B, voisine de A).
- [ ] La note sous les listes donne la définition : « Proche : carte voisine (D). » (avec la lettre de la carte voisine).

## Les règles
- Section « Résultats » : "**Après chaque réponse** : « sur ce sujet tu es aligné·e avec X, Y ; opposé·e à Z »."

## Hors ticket
- Pas dans SPEC.md : « proche de » vient de la maquette, SPEC.md ne parle que d'« aligné·e » et d'« opposé·e ».
- À trancher : pour une question dont les options ne sont pas ordonnées (hors échelle), il n'y a pas de carte voisine ; SPEC.md ne dit pas ce que la révélation affiche alors (voir 065).
- À trancher : la ligne quand aucun candidat n'est sur une carte voisine (la maquette ne dessine pas ce cas).
- Les lignes « aligné·e avec » et « opposé·e à » : 027, 029.
