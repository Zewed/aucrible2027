---
id: 001
title: Valider une option de la question du jour révèle les candidats qui la défendent
milestone: null
depends_on: []
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
Je réponds à la question du jour et je vois quels candidats défendent l'option que j'ai choisie.

## Ce qu'il voit
Sur maquettes/index.html, une carte question (« À quel âge devrait-on pouvoir partir à la retraite ? ») et ses cartes réponse A à E avec le bouton « Valider ma réponse ». Après validation, maquettes/revelation.html : la liste « Qui défend quoi », où chaque option porte les noms de ses candidats. Pour ce ticket seuls comptent la question, les cinq options, le bouton et les candidats de l'option choisie.

## C'est fini quand
- [ ] Le 23 octobre 2026, l'accueil affiche la question « À quel âge devrait-on pouvoir partir à la retraite ? », ses cinq options (60 ans, 62 ans, 64 ans, 65 ans ou plus, À la carte avec un système à points) et le bouton « Valider ma réponse », et aucun nom de candidat n'est visible.
- [ ] Après avoir choisi « À la carte, avec un système à points » puis « Valider ma réponse », une page de révélation s'ouvre et nomme Nicolas Dupont-Aignan et Édouard Philippe comme défenseurs de cette option.
- [ ] Avec « 62 ans » à la place, la révélation nomme Marine Le Pen, Marine Tondelier et Raphaël Glucksmann : les noms dépendent de l'option choisie.

## Les règles
- Section « Une fiche (question du jour) » : "1. **La question** — ex. « À quel âge devrait-on pouvoir partir à la retraite ? »"
- Section « Une fiche (question du jour) » : "4. **3 à 5 options concrètes et chiffrées**, présentées **sans nom de candidat**. Pour chacune : ce que ça implique, ce qu'en disent ses défenseurs, ce que lui reprochent ses critiques."
- Section « Une fiche (question du jour) » : "6. **Révélation** : qui défend quelle option (avec sources et badge « position déduite » ou « position officielle »), alignement sur cette question, classement mis à jour."

## Hors ticket
- Le thème de la question et sa couleur : 002, 003. Le numéro et la date : 004.
- Le contexte, les chiffres clés et leurs sources : 005, 006, 007.
- Les lettres, les implications, les arguments des défenseurs et des critiques : 008, 009, 010, 011. La phrase « Les noms des candidats s'affichent après ta réponse » : 012. La mise en page sur ordinateur : 013.
- Marquer l'option choisie « Ta carte », changer d'option, bouton inactif sans choix : 014, 015, 016. « Je ne sais pas » : 017. L'importance (×1, ×2, ×3) : 018.
- Les candidats des quatre autres options, leurs sources, leurs badges, l'alignement et le reste de la révélation : 019 à 032.
- Retrouver sa réponse en revenant : 033.
- À trancher : ce que montre la toute première visite (trou du découpage).
- À trancher : l'importance par défaut, si l'électeur ne la choisit pas (trou du découpage).
