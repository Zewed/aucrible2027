---
id: "060"
title: Tout rattrapé, la liste dit « Tu es à jour ! »
milestone: null
depends_on: ["056"]
design: maquettes/rattrapage.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui a répondu à toutes les questions publiées lit qu'il est à jour.

## Ce qu'il voit
Quand tout est rattrapé, maquettes/rattrapage.html montre un bloc « Tu es à jour ! » avec une petite carte « n° 25 » et « Reviens demain pour la question n° 25. ». La maquette l'affiche en aperçu sous la liste, annoté « (quand tout est rattrapé) ».

## C'est fini quand
- [ ] Le 23 octobre, une fois les 24 questions publiées toutes répondues, la page affiche « Tu es à jour ! » et « Reviens demain pour la question n° 25. »
- [ ] Tant qu'au moins une question reste « À répondre », ce bloc n'apparaît pas.

## Les règles
- "**Une nouvelle question par jour, 7j/7.** Pas de mode express séparé." (SPEC.md, section « Boucle principale »)
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)

## Hors ticket
- Le compteur qui tombe à zéro : 057. Les cartes « Répondu » : 056.
- À trancher : ce que dit ce bloc quand il n'y aura pas de question demain, pendant le silence électoral (042 et 043) ou quand les questions s'arrêtent (041) : pas de maquette (non prévu par le découpage).
