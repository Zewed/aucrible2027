---
id: "097"
title: Avant 10 réponses, la carte reste verrouillée
milestone: null
depends_on: ["091"]
design: maquettes/resultats-vide.html
tracker: null
---

## Ce que l'utilisateur fait
L'électeur qui a moins de 10 réponses voit sa carte verrouillée et ce qu'il lui reste à répondre.

## Ce qu'il voit
Dans « Ta carte » de maquettes/resultats-vide.html (maquettes/carte-story.html ne dessine pas cet état), l'aperçu est grisé avec un cadenas et dit « Je suis à … % proche de … ». Le bouton « Partager ma carte » est inactif, avec « Ta carte se débloque à 10 réponses. Il t'en reste 7. ».

## C'est fini quand
- [ ] Avec 3 réponses, la carte de « Mes résultats » est grisée, cadenassée, et dit « Je suis à … % proche de … » sans nom de candidat ni pourcentage ; son pied dit « 3 réponses · 0/11 parts · 1 jour d'affilée ».
- [ ] Le bouton « Partager ma carte » est inactif et le texte dit « Ta carte se débloque à 10 réponses. Il t'en reste 7. »
- [ ] À la 10e réponse, la carte se débloque et « Partager ma carte » ouvre la page « Ta carte ».

## Les règles
- "**À partir d'environ 10 réponses** : classement des candidats en % avec indicateur de fiabilité (faible / moyenne / forte), et **carte politique à 2 axes** :" (SPEC.md, section « Résultats »)
- "**Carte de résultat partageable** (format story 9:16)." (SPEC.md, section « Écrans de la v1 »)

## Hors ticket
- La carte débloquée : 091. Le bouton « Rattraper les questions » du classement avant 10 réponses : 074.
- À trancher : ce que montre la page « Ta carte » si on l'ouvre à la main avant 10 réponses (pas de maquette, non prévu par le découpage).
- Le pied de la carte verrouillée dit « parts » (« 0/11 parts ») là où la carte débloquée dit « thèmes » (092) : à harmoniser.
