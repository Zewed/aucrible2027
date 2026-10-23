---
id: 169
title: Un envoi raté garde le texte et propose de réessayer
milestone: null
depends_on: ["163"]
design: maquettes/signaler.html
tracker: null
---

## Ce que l'utilisateur fait
Mon envoi échoue et je ne veux pas tout réécrire.

## Ce qu'il voit
Un encadré d'erreur (maquettes/signaler.html, aperçu « si l'envoi échoue ») : « L'envoi n'a pas marché. Ton texte est gardé, réessaie. » avec un bouton « Réessayer ».

## C'est fini quand
- [ ] Réseau coupé (mode avion), après avoir choisi « Un chiffre », écrit un texte, collé un lien et saisi un e-mail, un clic sur « Envoyer » affiche « L'envoi n'a pas marché. Ton texte est gardé, réessaie. », et le type, le texte, le lien et l'e-mail sont toujours dans le formulaire.
- [ ] Réseau rétabli, un clic sur « Réessayer » envoie le signalement, et il n'arrive qu'une fois dans la boîte de l'auteur (pas de doublon).

## Les règles
Aucune règle de SPEC.md ne porte sur ce ticket.

## Hors ticket
- Le message général « il faut une connexion » quand l'app entière est hors réseau : 191.
- Le remerciement après un envoi réussi : 167. La boîte privée : 164.
