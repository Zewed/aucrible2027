---
id: 103
title: Le face-à-face compte leurs accords
milestone: null
depends_on: ["102"]
design: maquettes/face-a-face.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je lis en un chiffre sur combien de questions les deux candidats sont d'accord.

## Ce qu'il voit
Sous les deux candidats, un résumé « Entre Glucksmann et Retailleau » : « D'accord sur 4 questions sur 24 », puis « 17 fois, ils ne choisissent pas la même option. 3 questions restent sans comparaison : un des deux n'a pas de position connue. » Une rangée de 24 pastilles (même option, options différentes, position inconnue) avec sa légende le détaille (maquettes/face-a-face.html).

## C'est fini quand
- [ ] Pour Glucksmann et Retailleau, le résumé affiche « D'accord sur 4 questions sur 24 », « 17 fois, ils ne choisissent pas la même option » et « 3 questions restent sans comparaison ».
- [ ] La rangée de 24 pastilles compte 4 pastilles « même option », 17 « options différentes » et 3 « position inconnue », et ces nombres sont ceux des cartes « Même option », « Options différentes » et « Non comparée » de la liste.

## Les règles
- Section « Résultats » : "**Face-à-face** (dès la v1) : 2 candidats au choix, question par question, options et sources côte à côte. Mode **« Moi vs X »**. L'entre-deux-tours = face-à-face pré-rempli avec les deux finalistes."
- Section « Méthode de calcul (publiée) » : "**Positions inconnues** : exclues du calcul pour ce candidat."

## Hors ticket
- Le marqueur de chaque question : 102. Le verdict « Non comparée » d'une position inconnue : 108.
- Le résumé qui se recalcule quand l'électeur remplace un candidat : 104. Le nombre de questions comptées dépend de celles que l'électeur a répondues : 109.
- À trancher : le résumé et le « 24 questions » du bloc de filtre suivent-ils le filtre par thème (107) ? La maquette garde « sur 24 » (trou non listé au découpage).
