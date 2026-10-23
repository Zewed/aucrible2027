---
id: "164"
title: Le signalement arrive dans une boîte privée
milestone: null
depends_on: ["163"]
design: maquettes/signaler.html
tracker: null
---

## Ce que l'utilisateur fait
Je signale une erreur et je veux que seul l'auteur la lise.

## Ce qu'il voit
La maquette (maquettes/signaler.html) ne montre pas la boîte, qui est du côté de l'auteur. Elle montre ce qui y arrive : la fiche, le type, le texte, la source et l'e-mail du formulaire.

## C'est fini quand
- [ ] Après l'envoi de « Le chiffre de 1,7 cotisant pour 1 retraité me semble daté » depuis la question n° 24 avec le type « Un chiffre », l'auteur retrouve ce signalement dans sa boîte privée, avec la question n° 24, le type choisi et le texte.
- [ ] Ce signalement n'apparaît ni dans le journal des corrections, ni sur la fiche, ni sur aucune page publique.

## Les règles
- « « Signaler une erreur » arrive dans une boîte privée (pas publique, pour éviter les raids). » (SPEC.md, section « Corrections »)

## Hors ticket
- La source jointe et l'e-mail, retrouvés dans la boîte : 165 et 166.
- La correction publiée une fois l'erreur confirmée : le journal (172) et 200.
- À trancher : de quelle nature est la boîte privée (e-mail, tableau, autre outil) et qui d'autre que l'auteur y a accès. SPEC.md dit seulement « boîte privée ».
