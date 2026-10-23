---
id: "074"
title: Avant 10 réponses, un bouton mène au rattrapage
milestone: null
depends_on: ["073", "052"]
design: maquettes/resultats-vide.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui a moins de 10 réponses touche « Rattraper les questions » pour aller répondre à d'autres questions.

## Ce qu'il voit
Sous le message du classement (maquettes/resultats-vide.html), « Ça vient vite : on te propose d'abord les questions qui départagent le plus les candidats. » puis un bouton « Rattraper les questions » suivi de 10 cases dont 3 allumées.

## C'est fini quand
- [ ] Avec 3 réponses, toucher « Rattraper les questions » dans « Ton classement » ouvre la page « Rattraper les questions ».
- [ ] Le bouton affiche 10 cases dont 3 allumées ; après une 4e réponse, 4 sont allumées.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)

## Hors ticket
- Le message « Encore 7 réponses » et la jauge : 073.
- La liste de la page Rattraper et son tri : 052 et 054.
- Le lien de pied de page vers la même page, toujours disponible : 188.
- À 10 réponses, le bouton disparaît avec le message : 073.
