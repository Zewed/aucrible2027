---
id: "191"
title: Sans réseau, l'app dit qu'il faut une connexion
milestone: null
depends_on: ["001"]
design: maquettes/introuvable.html
tracker: null
---

## Ce que l'utilisateur fait
Je perds mon réseau en plein usage.

## Ce qu'il voit
La maquette (maquettes/introuvable.html) ne montre pas cet état. Elle donne seulement le ton d'une page d'erreur : une carte avec un titre, une phrase d'explication et un bouton « La question du jour ».

## C'est fini quand
- [ ] Réseau coupé (mode avion), toucher dans l'app un lien vers une page pas encore chargée (par exemple le rattrapage) affiche un message qui dit qu'il faut une connexion, au lieu d'une page vide ou d'une erreur technique.
- [ ] Réseau rétabli, la même page s'ouvre normalement et les 23 réponses données sont toujours là dans « Mes résultats ».

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- À trancher : le texte exact du message et ce qui reste utilisable hors connexion. SPEC.md n'en dit rien et la maquette ne montre pas cet état.
- L'envoi raté d'un signalement, qui garde son texte : 169.
- L'adresse inconnue : 189.
