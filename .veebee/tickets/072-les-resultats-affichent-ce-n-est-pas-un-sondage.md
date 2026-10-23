---
id: "072"
title: Les résultats affichent « Ce n'est pas un sondage »
milestone: null
depends_on: ["061"]
design: maquettes/resultats.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur lit que ses résultats ne sont pas un sondage.

## Ce qu'il voit
Sous le titre de maquettes/resultats.html : « Ce n'est pas un sondage : seulement tes réponses, gardées sur ton téléphone. ». La mention « Ce n'est pas un sondage » revient dans une étiquette en bas de page.

## C'est fini quand
- [ ] Dès l'ouverture de « Mes résultats », la phrase « Ce n'est pas un sondage : seulement tes réponses, gardées sur ton téléphone. » est visible sous le titre.
- [ ] En bas de la page, l'étiquette « Ce n'est pas un sondage » figure aussi, avant « Signaler une erreur ».

## Les règles
- "**Pas un sondage.** Aucune statistique agrégée sur les utilisateurs, jamais le mot « sondage »." (SPEC.md, section « Principes non négociables »)
- "**On ne sait pas pour qui tu votes.** Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9)." (SPEC.md, section « Principes non négociables »)

## Hors ticket
- L'explication complète sur la page Méthode : 152 ; sur la page À propos : 157.
- L'étiquette « Ce n'est pas un sondage » au pied de la page « Ta carte » (maquettes/carte-story.html) n'est portée par aucun ticket (non prévu par le découpage).
- À trancher : SPEC.md interdit d'employer le mot « sondage », mais la maquette affiche « Ce n'est pas un sondage » ; ce ticket suit la maquette (non prévu par le découpage).
