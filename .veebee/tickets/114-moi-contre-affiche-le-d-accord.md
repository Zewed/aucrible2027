---
id: 114
title: « Moi contre » affiche le % d'accord
milestone: null
depends_on: ["113", "063"]
design: maquettes/moi-vs.html
tracker: null
status: done
---

## Ce que l'utilisateur fait
Je vois mon pourcentage d'accord avec ce candidat.

## Ce qu'il voit
Un bloc « Ta proximité avec Édouard Philippe » avec « 54 % » en grand, la phrase « Tu es d'accord avec Édouard Philippe sur 11 questions sur 23 (54 %) » et une rangée de 23 pastilles (11 « même option », 12 « autre option »). Une note précise que le pourcentage compte aussi les options proches et l'importance (maquettes/moi-vs.html).

## C'est fini quand
- [ ] Avec les réponses de la maquette (23 réponses, dont 11 identiques à celles de Philippe), la page affiche « 54 % » et « Tu es d'accord avec Édouard Philippe sur 11 questions sur 23 (54 %) ».
- [ ] Ce pourcentage est celui de la ligne Édouard Philippe dans « Mes résultats » (7e, 54 %).
- [ ] La rangée de 23 pastilles compte 11 pastilles « même option » et 12 « autre option ».

## Les règles
- Section « Méthode de calcul (publiée) » : "**Score par question** : options ordonnées sur une échelle → `1 − écart / écart max` ; options non ordonnées → 1 si identique, 0 sinon. Multiplié par l'importance (×1/×2/×3)."
- Section « Méthode de calcul (publiée) » : "**Positions inconnues** : exclues du calcul pour ce candidat."
- Section « Méthode de calcul (publiée) » : "**Score global** : % du maximum possible."

## Hors ticket
- Le détail par thème : 115. Le classement et ses pourcentages : 063.
- Le lien « Comment on calcule » de la note vers la page Méthode : aucun ticket du découpage ne le porte (la page elle-même : 143 ; le lien depuis les résultats : 154).
