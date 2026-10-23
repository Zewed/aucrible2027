---
id: "130"
title: La fiche ne montre que les questions publiées
milestone: null
depends_on: ["126", "038"]
design: maquettes/candidat.html
tracker: null
---

## Ce que l'utilisateur fait
Je ne vois sur la fiche que les questions déjà publiées.

## Ce qu'il voit
L'en-tête « Ses positions » annonce « 24 questions publiées », de Q1 à Q24, et chaque bloc de thème indique combien de questions publiées il contient (maquettes/candidat.html). Aucune ligne n'existe pour une question pas encore publiée.

## C'est fini quand
- [ ] La fiche de Marine Tondelier annonce « 24 questions publiées » et en liste 24, de Q1 à Q24.
- [ ] Une question programmée pour demain n'apparaît pas sur la fiche aujourd'hui, ni son numéro ni son thème ; elle y apparaît demain, sous son thème.

## Les règles
- Section « Boucle principale » : "**Une nouvelle question par jour, 7j/7.** Pas de mode express séparé."
- Section « Production du contenu » : "Toujours 14 fiches d'avance."

## Hors ticket
- L'accès direct à l'adresse d'une question pas encore publiée : 038.
- À trancher : l'heure à laquelle une question devient publiée (trou du découpage « L'heure à laquelle la question du jour change »).
- À trancher : la fiche montre-t-elle aussi ses positions sur des questions que l'électeur n'a pas encore répondues (le face-à-face, lui, les cache) ? (trou du découpage)
