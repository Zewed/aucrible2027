---
id: "188"
title: Le pied de page mène aux pages secondaires
milestone: null
depends_on: ["052", "143", "155", "172", "179"]
design: maquettes/introuvable.html
tracker: null
---

## Ce que l'utilisateur fait
Je cherche une page secondaire : la méthode, l'à-propos, le journal.

## Ce qu'il voit
Un pied de page commun (maquettes/introuvable.html) avec cinq liens alignés : Rattraper les questions, Méthode de calcul, À propos, Journal des corrections, Changer d'appareil. Sur chaque page, son propre lien est marqué.

## C'est fini quand
- [ ] En bas de la question du jour, de Mes résultats, de la page À propos et de la page introuvable, les cinq liens sont présents, dans cet ordre.
- [ ] Un clic sur chacun ouvre la bonne page : la liste des questions à rattraper, la page Méthode, À propos, le Journal des corrections, Changer d'appareil ; sur chacune de ces pages, son propre lien est marqué.

## Les règles
- « Rattrapage : liste des questions publiées, triées par pouvoir de départage. » (SPEC.md, section « Écrans de la v1 »)
- « Méthodo & sources, Journal des corrections, À propos. » (SPEC.md, section « Écrans de la v1 »)
- « Changement d'appareil par export/import (QR code ou lien). » (SPEC.md, section « Données »)

## Hors ticket
- Le contenu des cinq pages : 052, 143, 155, 172 et 179.
- « Signaler une erreur » n'est pas dans le pied de page : on y accède depuis la fiche (160).
