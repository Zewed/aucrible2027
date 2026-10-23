---
id: 161
title: Le formulaire sait de quelle fiche il vient
milestone: null
depends_on: ["160"]
design: maquettes/signaler.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je signale une erreur sur la fiche que je viens de lire, sans avoir à la retrouver.

## Ce qu'il voit
Dans le formulaire (maquettes/signaler.html), le bloc « Sur quelle fiche ? » est déjà rempli : la pastille du thème « Travail & retraites » et « Question n° 24 — À quel âge devrait-on pouvoir partir à la retraite ? », avec la mention « Rempli pour toi. » et le lien « Ce n'est pas la bonne fiche ? ».

## C'est fini quand
- [ ] Depuis la question n° 24, le formulaire affiche « Sur quelle fiche ? » avec « Travail & retraites », « Question n° 24 — À quel âge devrait-on pouvoir partir à la retraite ? » et « Rempli pour toi. ».
- [ ] Depuis une autre question ouverte par le rattrapage (par exemple « Faut-il encadrer les loyers ? »), le formulaire affiche cette question-là, avec son thème et son numéro, et non la n° 24.

## Les règles
- « Bouton « Signaler une erreur » sur chaque fiche. » (SPEC.md, section « Une fiche (question du jour) »)

## Hors ticket
- Le lien « Ce n'est pas la bonne fiche ? » (qui mène à la liste du rattrapage, 052) : aucun ticket du découpage ne porte ce choix d'une autre fiche.
- À trancher : ce que « Sur quelle fiche ? » affiche quand le formulaire s'ouvre sans fiche, par exemple depuis Mes résultats, la page introuvable ou le journal vide. Ni SPEC.md ni les maquettes ne le disent.
- La fiche candidat : 171.
