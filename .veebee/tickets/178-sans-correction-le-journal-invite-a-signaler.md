---
id: "178"
title: Sans correction, le journal invite à signaler
milestone: null
depends_on: ["172"]
design: maquettes/journal.html
tracker: null
---

## Ce que l'utilisateur fait
Je regarde le journal avant la moindre correction et je veux savoir quoi faire.

## Ce qu'il voit
Un aperçu « de l'état vide » (maquettes/journal.html) : un dessin, « Aucune correction pour l'instant. », « Tu as repéré une erreur ? » et le lien « Signale-la ».

## C'est fini quand
- [ ] Tant qu'aucune correction n'est publiée, le journal affiche « Aucune correction pour l'instant. » et « Tu as repéré une erreur ? » à la place de la liste.
- [ ] Le lien « Signale-la » ouvre la page « Signaler une erreur. ».
- [ ] Dès qu'une première correction est publiée, le message disparaît et la correction s'affiche.

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- À trancher : si les filtres et le bandeau de chiffres s'affichent dans l'état vide. La maquette ne le dit pas.
- À trancher : ce que le formulaire affiche dans « Sur quelle fiche ? » quand on y arrive depuis ce lien sans fiche (voir 161).
- La liste des corrections : 172.
