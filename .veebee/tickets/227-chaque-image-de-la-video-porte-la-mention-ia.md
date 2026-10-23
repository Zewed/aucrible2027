---
id: 227
title: Chaque image de la vidéo porte la mention IA
milestone: null
depends_on: ["220"]
design: maquettes/video.html
tracker: null
---

## Ce que l'utilisateur fait
Je veux que chaque image de la vidéo dise qu'elle est une animation générée avec IA.

## Ce qu'il voit
Dans maquettes/video.html, le bas de chacune des 7 images porte la mention « Animation générée avec IA · contenu vérifié par un humain ». La maquette demande qu'elle fasse 12 px au moins et note : aucun visage, aucun candidat à l'écran.

## C'est fini quand
- [ ] Je regarde la vidéo en entier, de 0 à 75 s : la mention « Animation générée avec IA, contenu vérifié par un humain » est affichée sur chacune des 7 images, sans disparaître.
- [ ] La mention reste lisible sur un téléphone, sans que rien ne la cache.
- [ ] Aucune des 7 images ne montre de visage ni de candidat.

## Les règles
- Réseaux sociaux : « **Lignes rouges IA** : jamais de visage ni de voix de personnes réelles générés par IA. Mention « Animation générée avec IA, contenu vérifié par un humain ». »
- Réseaux sociaux : « Vidéos générées avec **Remotion** : texte animé, compteurs, graphiques, musique libre de droits, **sans voix**, lisibles sans le son. Les chiffres affichés viennent de la fiche vérifiée, jamais d'une IA générative vidéo. »

## Hors ticket
- Le contenu de chaque image : tickets 221 à 226. La musique et l'absence de voix : ticket 228.
- À signaler : SPEC.md écrit la mention avec une virgule (« Animation générée avec IA, contenu vérifié par un humain »), la maquette avec un point médian ; le texte de SPEC.md fait foi.
- La mention « générée avec IA » sur le carrousel ou la story : aucune règle dans SPEC.md.
