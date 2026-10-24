---
id: 195
title: Une fiche ajoutée par l'auteur paraît à sa date
milestone: null
depends_on: ["037"]
design: null
tracker: null
status: done
---

## Ce que l'utilisateur fait
J'ajoute une fiche datée du jour où elle doit paraître, et je la vois paraître ce jour-là, pas avant.

## Ce qu'il voit
Pas de maquette pour ce ticket. Une fiche complète (la question, le contexte, les chiffres sourcés, les options, comme décrit dans SPEC.md) devient la question du jour à la date que l'auteur lui a donnée.

## C'est fini quand
- [ ] Après avoir ajouté une fiche datée d'aujourd'hui, elle est la question du jour dès que j'ouvre l'app.
- [ ] Après avoir ajouté une fiche datée de demain, elle n'est pas la question du jour aujourd'hui, et elle l'est demain.
- [ ] J'ajoute d'abord la fiche datée d'après-demain, puis celle datée de demain : demain c'est la seconde qui paraît, après-demain c'est la première, quel que soit l'ordre où je les ai ajoutées.

## Les règles
- Boucle principale : « **Une nouvelle question par jour, 7j/7.** Pas de mode express séparé. »

## Hors ticket
- La question du jour qui change chaque jour, et ce que l'accueil en montre : ticket 037.
- Une fiche pas encore publiée reste inaccessible, même en connaissant son adresse : ticket 038.
- Aucune fiche ne paraît pendant le silence électoral, même datée de ces jours-là : ticket 042.
- Le refus d'une fiche dont un chiffre ou une position n'a pas de source : tickets 196 et 197. Le compte des fiches d'avance : tickets 198 et 199.
- À trancher : l'heure à laquelle la question du jour change (trou du découpage).
- À trancher : la rotation des thèmes (SPEC.md : « jamais trois jours de suite sur le même ») n'est portée par aucun ticket ; elle peut rester un travail éditorial ou être vérifiée à l'ajout d'une fiche.
