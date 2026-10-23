---
id: "186"
title: L'en-tête mène aux deux écrans principaux
milestone: null
depends_on: ["061"]
design: maquettes/introuvable.html
tracker: null
---

## Ce que l'utilisateur fait
Je passe de la question du jour à mes résultats, et je reviens.

## Ce qu'il voit
L'en-tête commun à toutes les maquettes (par exemple maquettes/introuvable.html) : le logo « Au crible 2027 » et, à droite, la série. Les deux entrées « Question du jour » et « Mes résultats », dont celle de la page courante est mise en avant, n'apparaissent qu'à partir d'environ 900 px de large.

## C'est fini quand
- [ ] Sur ordinateur (écran large), l'en-tête montre « Question du jour » et « Mes résultats » ; un clic sur « Mes résultats » ouvre Mes résultats, un clic sur « Question du jour » ouvre la question n° 24, et l'entrée de la page où l'on est est mise en avant.
- [ ] Sur n'importe quelle page (À propos, Journal des corrections, page introuvable) et à toute largeur, un clic sur le logo « Au crible 2027 » ramène à la question du jour.

## Les règles
- « Accueil / question du jour : compte à rebours avant le 1er tour, série, accès à la fiche du jour. » (SPEC.md, section « Écrans de la v1 »)
- « Mes résultats : classement en %, fiabilité, carte 2 axes, détail par thème. » (SPEC.md, section « Écrans de la v1 »)
- « Cible : tout public, tous âges. Pour les jeunes, l'angle est « pas convaincus par la politique classique », pas « peu politisés ». Mobile d'abord. » (SPEC.md, section « Projet »)

## Hors ticket
- À trancher : sur téléphone, les deux entrées sont cachées sous 900 px et la maquette ne montre pas comment on atteint « Mes résultats » depuis une page qui n'est pas la question du jour (061 et 062 portent les liens dans les pages). Or SPEC.md dit « Mobile d'abord ».
- La série dans l'en-tête : 045. Le compte à rebours sous l'en-tête : 039.
- L'en-tête qui reste en haut au défilement : 187.
