---
id: 091
title: Les résultats montrent la carte « Je suis à X % proche de Y »
milestone: null
depends_on: ["063"]
design: maquettes/carte-story.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur voit sur « Mes résultats » la carte « Je suis à X % proche de Y » et touche « Partager ma carte » pour l'ouvrir.

## Ce qu'il voit
Dans la section « Ta carte · format story » de « Mes résultats » (maquettes/resultats.html), une carte verticale : « Au crible 2027 · ma partie », « 81 % » en grand, « Je suis à 81 % proche de François Ruffin. ». « Partager ma carte » ouvre la page « Ta carte » (maquettes/carte-story.html), qui montre cette carte.

## C'est fini quand
- [ ] Avec 23 réponses, la section « Ta carte » de « Mes résultats » dit « Je suis à 81 % proche de François Ruffin. », soit le premier du classement et son pourcentage.
- [ ] Toucher « Partager ma carte » ouvre la page « Ta carte », où « 81 % » et « Je suis à 81 % proche de François Ruffin. » sont affichés en grand.

## Les règles
- "**Carte de résultat partageable** au format story (« Je suis à 74 % proche de X, et toi ? »). C'est le principal moteur de croissance, puisque la pub est impossible." (SPEC.md, section « Ludique »)
- "**Carte de résultat partageable** (format story 9:16)." (SPEC.md, section « Écrans de la v1 »)
- "**Carte partageable** : l'électeur choisit de montrer son candidat le plus proche ou seulement son pion." (SPEC.md, section « Règles validées sur les maquettes (23/10/2026) »)

## Hors ticket
- Les compteurs au pied de la carte : 092 ; le camembert : 093 ; la carte « seulement mon pion » : 094.
- Les boutons « Partager » (095) et « Télécharger l'image » (096) de la page « Ta carte ».
- La carte avant 10 réponses : 097. « Et toi ? aucrible2027.fr » : 098.
- Le bouton « Face-à-face » à côté de « Partager ma carte » : 099.
- À trancher : le candidat nommé quand deux candidats sont à égalité en tête, ou quand le premier se retire (135) ; SPEC.md ne le dit pas (non prévu par le découpage).
