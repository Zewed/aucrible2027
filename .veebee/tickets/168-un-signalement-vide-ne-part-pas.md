---
id: "168"
title: Un signalement vide ne part pas
milestone: null
depends_on: ["163"]
design: maquettes/signaler.html
tracker: null
---

## Ce que l'utilisateur fait
J'appuie sur « Envoyer » sans avoir rien écrit.

## Ce qu'il voit
Pas de maquette de ce refus : maquettes/signaler.html montre seulement la zone de texte « Qu'est-ce qui ne va pas ? » et son invite « Dis-nous ce que tu as vu, avec tes mots. ».

## C'est fini quand
- [ ] Cliquer « Envoyer » sans rien écrire dans « Qu'est-ce qui ne va pas ? » n'envoie rien : le formulaire reste ouvert et aucun « Merci ! » ne s'affiche.
- [ ] Même avec un lien et un e-mail remplis, un texte vide, ou fait seulement d'espaces, ne part pas.

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- À trancher : le message qui dit pourquoi l'envoi est refusé (texte, endroit). La maquette ne le montre pas.
- L'envoi normal : 163.
