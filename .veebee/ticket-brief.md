# Brief : écrire les fichiers de tickets d'Au crible 2027

Tu écris des fichiers de tickets, un par ticket, pour la plage de numéros qu'on te donne. Tu n'écris aucun code et tu ne touches à rien d'autre.

## Les sources

À lire avant de commencer :

- `/Users/antoinedewez/Dev/MyProjects/Politique/.veebee/cut.json` : le découpage validé. Pour chaque ticket : `id`, `title`, `group` (le parcours), `design` (la maquette), `deps` (ses dépendances) et `file` (le nom de fichier à utiliser **exactement**). Il donne aussi les `holes` (les trous).
- `/Users/antoinedewez/Dev/MyProjects/Politique/SPEC.md` : le cadrage. Ses mots font foi. Reprends exactement son vocabulaire : « question du jour », « fiche », « révélation », « position déduite », « position officielle », « Ce n'est pas un sondage », « plateau », « camembert », « série »…
- Les maquettes dans `/Users/antoinedewez/Dev/MyProjects/Politique/maquettes/` : ouvre en texte la maquette indiquée dans `design` pour décrire ce qu'on voit.

## Le fichier

Écris `/Users/antoinedewez/Dev/MyProjects/Politique/.veebee/tickets/<file>`.

Le front-matter est en anglais, les titres de section en français :

```markdown
---
id: "019"
title: La révélation montre les candidats de chaque option
milestone: null
depends_on: ["001"]
design: maquettes/revelation.html
tracker: null
---

## Ce que l'utilisateur fait
Une phrase, dans ses mots à lui (l'électeur, ou l'auteur pour les parcours auteur).

## Ce qu'il voit
Ce que la maquette montre pour CE ticket seulement, décrit en 1 à 3 phrases, avec le chemin de la maquette. S'il n'y a pas de maquette (design vide), décris ce qu'il voit d'après SPEC.md et écris « Pas de maquette pour ce ticket. »

## C'est fini quand
- [ ] 1 à 3 critères, jamais plus

## Les règles
Les lignes de SPEC.md qui s'appliquent à ce ticket, recopiées telles quelles entre guillemets, avec la section d'où elles viennent. S'il n'y en a pas : « Aucune règle de SPEC.md ne porte sur ce ticket. »

## Hors ticket
Ce qu'on pourrait croire dedans et qui n'y est pas, avec le numéro du ticket qui le porte : les atomes voisins, l'état vide, l'erreur, la règle d'à côté. Au moins une ligne, toujours.
```

- `depends_on` liste les `deps` de cut.json, sur trois chiffres et entre guillemets.
- `design` vaut `null` quand cut.json n'en donne pas. Quand il donne deux maquettes séparées par « · », garde celle qui concerne le ticket.

## Les critères d'acceptation

- **Entre 1 et 3, jamais plus.** Chacun se vérifie **en utilisant le produit**, jamais en lisant du code. Par exemple « Après avoir choisi E et validé, Marine Tondelier apparaît sous l'option A », et non « la fonction renvoie la liste ».
- **Concrets** : ils s'appuient sur les données de la maquette (question n° 24 sur la retraite, options A à E, les 13 candidats, 23 réponses…).
- **Rien qui appartient à un autre ticket** : ce qui est voisin va dans « Hors ticket », avec son numéro.
- **Pas de trou bouché** : si un critère dépend d'un trou de cut.json (`holes`), ne l'invente pas. Écris dans « Hors ticket » : « À trancher : … (trou du découpage) ».
- **Pour les parcours auteur** (Publier, Contrôle de neutralité, Carrousel, Vidéo, Visites), l'utilisateur est l'auteur. Les critères se vérifient en faisant ce qu'il fait, par exemple « ajouter une fiche datée de demain : elle n'apparaît pas aujourd'hui, elle apparaît demain ».
- **Pas de stack technique** : aucun framework, aucun fichier de code, puisque le code n'existe pas encore. Pas de section « Comment ».

## Quand tu as fini

Vérifie que chaque fichier de ta plage existe, a entre 1 et 3 cases `- [ ]`, et a une section « Hors ticket » non vide.

Réponds en 5 lignes au plus : combien de fichiers tu as écrits, et les trous ou incohérences que tu as rencontrés.

Aucune commande git.
