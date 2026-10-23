---
id: "015"
title: L'électeur change d'option avant de valider
milestone: null
depends_on: ["014"]
design: maquettes/index.html
tracker: null
---

## Ce que l'utilisateur fait
Je change d'option avant de valider.

## Ce qu'il voit
Sur maquettes/index.html, les cartes réponse se comportent comme un choix unique : une seule carte porte « Ta carte » à la fois. La maquette ne dessine que l'état où E est cochée.

## C'est fini quand
- [ ] Choisir A puis B (sans valider) fait passer « Ta carte » de A à B ; une seule carte est marquée à la fois.
- [ ] Après avoir choisi A puis B et validé, la révélation nomme Marine Le Pen, Marine Tondelier et Raphaël Glucksmann comme défenseurs de la réponse (B), pas Jean-Luc Mélenchon, Fabien Roussel ni Nathalie Arthaud.

## Les règles
- Section « Une fiche (question du jour) » : "5. **Réponse** : une option, ou « je ne sais pas » ; plus l'importance du sujet pour soi (×1 / ×2 / ×3)."

## Hors ticket
- Le marquage « Ta carte » lui-même : 014.
- À trancher : si l'électeur peut changer sa réponse après l'avoir validée (trou du découpage).
- Passer de « Je ne sais pas » à une option : 017.
