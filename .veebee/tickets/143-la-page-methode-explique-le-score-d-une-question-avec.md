---
id: "143"
title: La page Méthode explique le score d'une question avec un exemple
milestone: null
depends_on: ["063"]
design: maquettes/methode.html
tracker: null
---

## Ce que l'utilisateur fait
J'ouvre la page Méthode et je comprends comment une question donne un score.

## Ce qu'il voit
La page « Méthode de calcul et sources. » (« Tout est publié, rien n'est caché ») s'ouvre sur la règle n° 1 « Chaque question donne un score entre 0 et 100 % » : la formule « score = 1 − écart ÷ écart maximum », l'exemple de la question n° 24 sur la retraite (TOI à 62 ans, un candidat à 64 ans : écart 1 sur 3, soit environ 67 %) et le cas des options sans ordre (A = A donne 1, A ≠ C donne 0). Une note précise qu'une option hors échelle comme « À la carte » compte comme une option non ordonnée (maquettes/methode.html).

## C'est fini quand
- [ ] La page « Méthode de calcul et sources » s'ouvre et sa première règle, « Chaque question donne un score entre 0 et 100 % », écrit la formule « score = 1 − écart ÷ écart maximum ».
- [ ] L'exemple de la question n° 24 place TOI sur 62 ans et un candidat sur 64 ans (écart 1, écart maximum 3) et conclut « 1 − 1/3 ≈ 67 % ».
- [ ] Pour les options sans ordre, la page montre « A = A » avec « Même carte : 1 (100 %) » et « A ≠ C » avec « Cartes différentes : 0 ».

## Les règles
- Section « Méthode de calcul (publiée) » : "**Score par question** : options ordonnées sur une échelle → `1 − écart / écart max` ; options non ordonnées → 1 si identique, 0 sinon. Multiplié par l'importance (×1/×2/×3)."
- Section « Principes non négociables » : "**Neutralité vérifiable, pas déclarée.** Chaque position de candidat est sourcée (lien + date), la méthode de calcul est publique, l'ordre d'affichage des candidats est aléatoire, toute erreur signalée est corrigée publiquement."

## Hors ticket
- Les autres règles de la page : importance 144, position inconnue 145, plateau 146, sources 147, badges 148, règle d'entrée 149, retraits et remplacements 150, liste officielle 151, « Ce n'est pas un sondage » 152, code public 153.
- Le chemin depuis « Mes résultats » : 154. Le chemin depuis le pied de page : 188. Le calcul réel de l'option hors échelle dans le classement : 065.
- Le sommaire « Aller à la règle », la règle n° 4 (le pourcentage final, la fiabilité du classement) et la mention « Version 1 de la méthode, publiée le 23/10/2026 » ne sont portés par aucun ticket du découpage.
