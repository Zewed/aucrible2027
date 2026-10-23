---
id: "053"
title: La révélation mène au rattrapage
milestone: null
depends_on: ["019", "052"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Après avoir répondu, l'électeur touche « Rattraper d'autres questions » sur la révélation pour passer à la liste des questions à rattraper.

## Ce qu'il voit
Sous « Qui défend quoi », la révélation (maquettes/revelation.html) propose deux actions : « Voir mes résultats » et « Rattraper d'autres questions ». La seconde ouvre la page Rattraper (maquettes/rattrapage.html).

## C'est fini quand
- [ ] Sur la révélation de la question n° 24 (réponse E validée), toucher « Rattraper d'autres questions » ouvre la page « Rattraper les questions ».
- [ ] Le même bouton est sur la révélation d'une question répondue depuis la liste (par exemple la n° 9 « Faut-il rétablir l'ISF ? ») et ramène à la liste.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)

## Hors ticket
- « Voir mes résultats », l'autre action de la révélation : 062.
- Le contenu de la page Rattraper : 052. La question qu'on vient de répondre y passe en « Répondu » : 056.
- Le lien « Rattraper les questions » du pied de page : 188.
