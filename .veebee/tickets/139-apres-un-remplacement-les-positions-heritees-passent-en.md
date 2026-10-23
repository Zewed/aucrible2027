---
id: 139
title: Après un remplacement, les positions héritées passent en « déduite »
milestone: null
depends_on: ["138"]
design: maquettes/candidat.html
tracker: null
---

## Ce que l'utilisateur fait
Je vois que les positions reprises d'un prédécesseur sont marquées comme déduites.

## Ce qu'il voit
La maquette ne montre pas ce cas ; elle montre le badge « position déduite » sur les positions d'une fiche (maquettes/candidat.html). Après un remplacement, ce badge couvre toutes les positions reprises du parti.

## C'est fini quand
- [ ] Juste après le remplacement de Le Pen par Bardella, chaque position connue de la fiche de Bardella porte « position déduite », aucune ne porte « position officielle », et chacune garde sa source d'origine.
- [ ] Quand une déclaration datée de Bardella sur une question est ajoutée, cette seule position passe en « position officielle » avec la déclaration pour source ; les autres restent « position déduite ».

## Les règles
- Section « Candidats » : "**Remplacement dans le même parti** (ex. Bardella pour Le Pen) : fiche renommée, positions du parti gardées en « déduite » puis recodées au fil des déclarations."
- Section « Règles validées sur les maquettes (23/10/2026) » : "**Badges** : « position officielle » = programme 2027 ou déclaration du candidat ; « position déduite » = votes de son groupe ou programme 2022."

## Hors ticket
- Le renommage de la fiche : 138. L'explication publique de cette règle sur la page Méthode : 150.
- Le codage éditorial des positions de chaque candidat n'est pas un ticket de code (trou du découpage « Le travail éditorial »).
