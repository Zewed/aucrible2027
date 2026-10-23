---
id: "138"
title: Un candidat remplacé prend le nom de son remplaçant
milestone: null
depends_on: ["121"]
design: maquettes/candidat.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois qu'un candidat remplacé dans son parti a pris le nom de son remplaçant.

## Ce qu'il voit
La maquette ne montre pas ce cas (maquettes/candidat.html montre la fiche d'un candidat en place). D'après SPEC.md, quand un candidat est remplacé dans le même parti, sa fiche est renommée au nom du remplaçant.

## C'est fini quand
- [ ] Quand Bardella remplace Le Pen, la fiche « Marine Le Pen » est renommée au nom de Bardella ; il n'existe plus de fiche à son ancien nom.
- [ ] Le parti affiché sur la fiche reste « RN », et aucune mention de retrait n'y apparaît.
- [ ] « Mes résultats » classe toujours 13 candidats, avec Bardella à la place de Marine Le Pen.

## Les règles
- Section « Candidats » : "**Remplacement dans le même parti** (ex. Bardella pour Le Pen) : fiche renommée, positions du parti gardées en « déduite » puis recodées au fil des déclarations."
- Section « Candidats » : "Le Pen (RN)"

## Hors ticket
- Le badge des positions reprises du parti : 139. Le retrait, qui est un autre cas : 135 à 137.
- À trancher : le prénom, le pion à initiales et la photo du remplaçant ; SPEC.md dit seulement « fiche renommée » (trou non listé au découpage).
