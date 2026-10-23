---
id: 157
title: La page À propos dit qu'on ne sait pas pour qui tu votes
milestone: null
depends_on: ["155"]
design: maquettes/a-propos.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux être sûr que personne ne saura pour qui je vote.

## Ce qu'il voit
La section « On ne sait pas pour qui tu votes » (maquettes/a-propos.html) : pas de compte, réponses gardées sur le téléphone, RGPD article 9, « Ce n'est pas un sondage », la mise en garde « Si tu vides les données de ton navigateur, elle disparaît », un bouton « Changer d'appareil » et un schéma « Ton téléphone », un trait coupé, « Un serveur » qui « n'en reçoit aucune ».

## C'est fini quand
- [ ] La section dit qu'il n'y a « ni e-mail, ni mot de passe, ni pseudo », que les réponses restent sur le téléphone, dans le navigateur, et qu'elles ne sont envoyées nulle part, « moi non plus ».
- [ ] Elle cite le RGPD, article 9 (une opinion politique est une donnée sensible) et dit « Ce n'est pas un sondage ».
- [ ] Elle prévient que vider les données du navigateur fait disparaître la partie, et son schéma montre « Ton téléphone : tes réponses restent ici » et « Un serveur : n'en reçoit aucune ».

## Les règles
- « On ne sait pas pour qui tu votes. Aucun compte, réponses stockées uniquement sur l'appareil (opinions politiques = données sensibles, RGPD art. 9). » (SPEC.md, section « Principes non négociables »)
- « Pas un sondage. Aucune statistique agrégée sur les utilisateurs, jamais le mot « sondage ». » (SPEC.md, section « Principes non négociables »)
- « Aucun compte. Réponses stockées localement dans le navigateur. » (SPEC.md, section « Données »)

## Hors ticket
- Le lien « règle 8 de la méthode » et la page Méthode qui explique pourquoi ce n'est pas un sondage : 152.
- Le bouton « Changer d'appareil » de cette section : la page d'arrivée est portée par 179, mais aucun ticket du découpage ne porte le bouton lui-même.
- Le rappel sur la fiche que les réponses restent sur le téléphone (035) et l'avertissement en navigation privée (036).
- Les statistiques de visite anonymes : 192 à 194.
