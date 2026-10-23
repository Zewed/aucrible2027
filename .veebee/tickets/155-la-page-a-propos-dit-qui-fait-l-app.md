---
id: "155"
title: La page À propos dit qui fait l'app
milestone: null
depends_on: ["001"]
design: maquettes/a-propos.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux savoir qui est derrière Au crible 2027 avant de lui faire confiance.

## Ce qu'il voit
La page « À propos. » (maquettes/a-propos.html) s'ouvre sur une phrase d'accroche (« Une personne, un projet perso, et des règles écrites noir sur blanc… »), une liste « Aller à » de cinq entrées, puis la première des cinq sections, « Qui fait Au crible 2027 ? » : « Je m'appelle Antoine », un projet perso fait par une seule personne, sans but lucratif et sans pub. À côté, une carte de visite « Antoine, auteur, affiché publiquement » avec trois sceaux : Non lucratif, Sans pub, Sans compte.

## C'est fini quand
- [ ] En ouvrant la page À propos, le titre « À propos. » s'affiche, puis la section « Qui fait Au crible 2027 ? » qui dit « Je m'appelle Antoine » et que le projet est fait par une seule personne.
- [ ] La même section dit « pas de but lucratif » et « pas de pub », et la carte de visite affiche « Antoine », « auteur, affiché publiquement » et les trois sceaux Non lucratif, Sans pub, Sans compte.
- [ ] La liste « Aller à » propose cinq entrées numérotées (1 Qui, 2 Neutralité, 3 Vie privée, 4 IA, 5 Suite) ; « 1 Qui » amène à la section « Qui fait Au crible 2027 ? ».

## Les règles
- « Side project perso, non lucratif, sans pub. Auteur affiché publiquement. » (SPEC.md, section « Projet »)
- « Page « À propos » honnête : relu par l'auteur + contrôle automatique de neutralité par IA + journal public des corrections. Ne jamais prétendre à une relecture externe. » (SPEC.md, section « Projet »)

## Hors ticket
- Les sections 2 à 5 de la page : « Neutre ? Voilà ce qu'on fait vraiment » (156), « On ne sait pas pour qui tu votes » (157), « L'IA » (158), « Aller plus loin, ou nous suivre » (159). Leurs entrées dans « Aller à » n'aboutissent qu'une fois ces tickets faits.
- Les liens vers la Méthode et le Journal dans la phrase « Tout ce qui suit est vérifiable… » : les pages sont portées par 143 et 172, mais aucun ticket du découpage ne porte ces deux liens eux-mêmes.
- Le lien « À propos » du pied de page : 188.
