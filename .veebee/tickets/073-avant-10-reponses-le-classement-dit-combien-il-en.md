---
id: 073
title: Avant 10 réponses, le classement dit combien il en manque
milestone: null
depends_on: ["063"]
design: maquettes/resultats-vide.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui a moins de 10 réponses lit combien il lui en manque pour voir son classement.

## Ce qu'il voit
Dans « Ton classement – à partir de 10 réponses » (maquettes/resultats-vide.html), un message « Encore 7 réponses pour voir ton classement » et « 3/10 réponses » avec une jauge de 10 cases dont 3 allumées. Dessous, un aperçu estompé « Il ressemblera à ça » et « Avant 10 réponses, un classement serait trop fragile pour être honnête. ».

## C'est fini quand
- [ ] Avec 3 réponses, « Ton classement » affiche « Encore 7 réponses pour voir ton classement » et « 3/10 réponses ».
- [ ] Avec 3 réponses, aucun nom de candidat ni aucun pourcentage réel n'apparaît : seulement l'aperçu estompé « Il ressemblera à ça ».
- [ ] À la 10e réponse, le message disparaît et le classement des 13 candidats prend sa place.

## Les règles
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)

## Hors ticket
- Le bouton « Rattraper les questions » du message : 074.
- Le plateau avant 10 réponses : 081. La carte verrouillée : 097. Le classement une fois débloqué : 063.
- Le niveau de fiabilité affiché à 3 réponses (« trop tôt ») : 071.
- À trancher : SPEC.md dit « environ 10 réponses » ; la maquette fixe 10 pile (non prévu par le découpage). Et si un « Je ne sais pas » compte dans ces 10 (voir 068).
