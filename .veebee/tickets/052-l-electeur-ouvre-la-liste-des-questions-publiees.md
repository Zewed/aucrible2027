---
id: "052"
title: L'électeur ouvre la liste des questions publiées
milestone: null
depends_on: ["033", "037"]
design: maquettes/rattrapage.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur ouvre la page « Rattraper les questions » et y voit toutes les questions déjà publiées.

## Ce qu'il voit
La page « Rattraper les questions. » (maquettes/rattrapage.html) montre, sous « Toutes les questions » et « 24 publiées », une carte par question avec sa pastille de thème, son numéro, sa question et sa date de publication. Chaque carte est cliquable.

## C'est fini quand
- [ ] Le 23 octobre, la page annonce « 24 publiées » et contient la carte n° 24 « À quel âge devrait-on pouvoir partir à la retraite ? » avec la pastille « Travail & retraites » et la date « 23 octobre ».
- [ ] La carte n° 9 « Faut-il rétablir l'ISF ? » (pastille « Économie & impôts », 8 octobre) y figure aussi, et la question n° 25, pas encore publiée, n'y est pas.

## Les règles
- "On peut répondre à **toutes les questions déjà publiées**. Le rattrapage présente d'abord celles qui départagent le plus les candidats, pour qu'un nouveau venu ait un match fiable en 10–15 réponses." (SPEC.md, section « Boucle principale »)
- "**Rattrapage** : liste des questions publiées, triées par pouvoir de départage." (SPEC.md, section « Écrans de la v1 »)

## Hors ticket
- Les liens qui mènent à cette page : le pied de page, sur toutes les pages (188), la révélation (053), « Mes résultats » avant 10 réponses (074), « Moi contre » (119).
- Le tri de la liste (054), le dé de départage (055), les mentions « À répondre » et « Répondu » (056), le compteur de questions à rattraper (057), le filtre par thème (058), l'ouverture d'une fiche (059), le message « Tu es à jour ! » (060).
- La tuile « Ta série » en haut de la page : 045.
- Une question pas encore publiée reste inaccessible, même par son adresse : 038.
- À trancher : la ligne « 12 autres cartes déjà répondues » dessinée sous la liste n'est portée par aucun ticket du découpage (non prévu par le découpage).
