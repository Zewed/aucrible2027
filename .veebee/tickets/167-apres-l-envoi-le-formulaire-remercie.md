---
id: 167
title: Après l'envoi, le formulaire remercie
milestone: null
depends_on: ["163"]
design: maquettes/signaler.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux savoir que mon signalement est bien parti.

## Ce qu'il voit
Après l'envoi, un encadré (maquettes/signaler.html, aperçu « après l'envoi ») : « Merci ! Ton signalement est arrivé. », « Si tu as laissé ton e-mail, on te répond sous 72 h. » et un bouton « Retour à la question du jour ».

## C'est fini quand
- [ ] Après un envoi réussi, la page affiche « Merci ! Ton signalement est arrivé. » et « Si tu as laissé ton e-mail, on te répond sous 72 h. ».
- [ ] Le bouton « Retour à la question du jour » ramène à la question du jour (n° 24 le vendredi 23 octobre).

## Les règles
- « Réponse sous 72 h. » (SPEC.md, section « Corrections »)

## Hors ticket
- L'envoi lui-même : 163. L'échec d'envoi : 169.
- À trancher : le formulaire reste-t-il affiché sous le remerciement, ou est-il remplacé par lui ? La maquette montre les deux états l'un sous l'autre sans le dire.
