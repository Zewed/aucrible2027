---
id: "059"
title: Une question de la liste s'ouvre sur sa fiche
milestone: null
depends_on: ["052"]
design: maquettes/rattrapage.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur touche une question de la liste et arrive sur sa fiche pour y répondre.

## Ce qu'il voit
Chaque carte de maquettes/rattrapage.html est entièrement cliquable (flèche « À répondre »). Elle ouvre la fiche de cette question, avec le contexte, les chiffres clés, les options et l'importance (maquettes/index.html).

## C'est fini quand
- [ ] Toucher la carte n° 9 « Faut-il rétablir l'ISF ? » ouvre la fiche de la question n° 9, avec son numéro et la date du 8 octobre, et non celle de la question du jour n° 24.
- [ ] Toucher la carte n° 6 « Faut-il fixer chaque année des quotas d'immigration ? » ouvre la fiche de la question n° 6, datée du 5 octobre.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)

## Hors ticket
- Le contenu d'une fiche (contexte, chiffres, options) : 005 à 011. Répondre : 014 à 018.
- Une carte « Répondu » rouvre sur sa révélation : 033.
- À trancher : si répondre en rattrapage fait avancer la série (trou du découpage ; voir 046).
- À trancher : si l'électeur peut changer sa réponse après l'avoir validée (trou du découpage).
- Le retour vers la liste depuis une fiche n'est pas dessiné (pas de maquette).
